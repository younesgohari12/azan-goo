<?php
declare(strict_types=1);
namespace YAgent\AI;

use YAgent\Infrastructure\Store;
use YAgent\Infrastructure\Lock;

/** Metadata-only billing ledger. Unknown provider values remain null throughout aggregation. */
final class UsageLedger
{
    public const KIND = 'usage';
    public const MAX_ROWS = 10000;
    private bool $lastTruncated = false;
    public function __construct(private Store $store) {}

    public function record(array $entry, ?string $id = null): array|\WP_Error
    {
        $lock = new Lock();
        $token = $lock->acquire('budget', 120);
        if (is_wp_error($token)) { return $token; }
        try { return $this->write($entry, $id); }
        finally { $lock->release('budget', $token); }
    }

    /** @internal Budget already holds the global accounting lock while settling. */
    public function recordReserved(array $entry, string $id): array|\WP_Error
    {
        return $this->write($entry, $id);
    }

    private function write(array $entry, ?string $id): array|\WP_Error
    {
        $owner = $entry['user_id'] ?? $entry['owner'] ?? 0;
        if (!is_int($owner) || $owner < 0) { return $this->invalid(); }
        $data = $this->normalize($entry);
        if (is_wp_error($data)) { return $data; }
        try {
            if ($id !== null) {
                $existing = $this->store->get(self::KIND, $id, $owner);
                if (is_wp_error($existing) && $existing->get_error_code() !== 'yagent_not_found') { return $existing; }
                if (is_array($existing)) {
                    // The identifier is an idempotency key; a different payload may never overwrite billing.
                    $old = $this->normalize($existing['data']);
                    if (is_wp_error($old)) { return $old; }
                    unset($old['created_at']);
                    $new = $data;
                    unset($new['created_at']);
                    return $old === $new ? $existing : new \WP_Error('yagent_usage_conflict', 'شناسه مصرف قبلاً با اطلاعات دیگری ثبت شده است.');
                }
            }
            if (count($this->store->all(self::KIND, self::MAX_ROWS)) >= self::MAX_ROWS) { return new \WP_Error('yagent_usage_capacity', 'ظرفیت ثبت مصرف پر شده است.'); }
            return $this->store->create(self::KIND, $owner, $data, $id);
        } catch (\Throwable $error) {
            return new \WP_Error('yagent_usage_unavailable', 'اطلاعات مصرف در دسترس نیست.');
        }
    }

    public function summary(int $owner = 0, ?string $conversationId = null): array|\WP_Error
    {
        $rows = $this->export($owner);
        if (is_wp_error($rows)) { return $rows; }
        $summary = ['totals'=>$this->emptyTotals(), 'by_day'=>[], 'by_month'=>[], 'truncated'=>$this->lastTruncated];
        foreach ($rows as $row) {
            $data = $row['data'];
            if ($conversationId !== null && ($data['conversation_id'] ?? '') !== $conversationId) { continue; }
            $day = substr($data['created_at'], 0, 10);
            $month = substr($data['created_at'], 0, 7);
            $summary['by_day'][$day] ??= $this->emptyTotals();
            $summary['by_month'][$month] ??= $this->emptyTotals();
            $this->add($summary['totals'], $data);
            $this->add($summary['by_day'][$day], $data);
            $this->add($summary['by_month'][$month], $data);
        }
        ksort($summary['by_day']); ksort($summary['by_month']);
        return $summary;
    }

    /** Owner zero is the administrator's site-wide view. Positive owners are strictly filtered. */
    public function export(int $owner = 0): array|\WP_Error
    {
        if ($owner < 0) { return $this->invalid(); }
        try {
            $rows = $this->store->all(self::KIND, self::MAX_ROWS);
            $this->lastTruncated = count($rows) >= self::MAX_ROWS;
            foreach ($rows as &$row) {
                if (!$this->validRow($row)) { return new \WP_Error('yagent_usage_corrupt', 'اطلاعات مصرف معتبر نیست.'); }
                $row['data'] = $this->normalize($row['data']);
            }
            unset($row);
            return array_values(array_filter($rows, static fn(array $row): bool => $owner === 0 || (int)$row['owner'] === $owner));
        } catch (\Throwable $error) { return new \WP_Error('yagent_usage_unavailable', 'اطلاعات مصرف در دسترس نیست.'); }
    }

    private function normalize(array $entry): array|\WP_Error
    {
        $data = [];
        foreach (['provider','model','profile_id','source','task_id','conversation_id','status','error_code','thinking_level','request_id','purpose','routing_reason'] as $field) {
            if (isset($entry[$field]) && (!is_string($entry[$field]) || strlen($entry[$field]) > 256 || preg_match('/[\x00-\x1f\x7f]/', $entry[$field]))) { return $this->invalid(); }
            if (isset($entry[$field])) { $data[$field] = $entry[$field]; }
        }
        foreach (['input_tokens','output_tokens','total_tokens','thinking_tokens','cached_tokens'] as $field) {
            $value = $entry[$field] ?? null;
            if ($value !== null && (!is_int($value) || $value < 0 || $value > 1000000000000)) { return $this->invalid(); }
            $data[$field] = $value;
        }
        if ($data['total_tokens'] === null && $data['input_tokens'] !== null && $data['output_tokens'] !== null) { $data['total_tokens'] = $data['input_tokens'] + $data['output_tokens']; }
        if ($data['total_tokens'] !== null && (($data['input_tokens'] !== null && $data['total_tokens'] < $data['input_tokens']) || ($data['output_tokens'] !== null && $data['total_tokens'] < $data['output_tokens']))) { return $this->invalid(); }
        $cost = $entry['estimated_cost_usd'] ?? null;
        if ($cost !== null && ((!is_int($cost) && !is_float($cost)) || !is_finite((float)$cost) || $cost < 0 || $cost > 1000000000)) { return $this->invalid(); }
        $data['estimated_cost_usd'] = $cost === null ? null : (float)$cost;
        if (isset($entry['billing_uncertain']) && !is_bool($entry['billing_uncertain'])) { return $this->invalid(); }
        $data['billing_uncertain'] = ($entry['billing_uncertain'] ?? false) || $data['input_tokens'] === null || $data['output_tokens'] === null;
        if ($data['billing_uncertain']) { $data['estimated_cost_usd'] = null; }
        foreach (['http_status','attempt','duration_ms'] as $field) {
            if (isset($entry[$field])) {
                if (!is_int($entry[$field]) || $entry[$field] < 0 || $entry[$field] > 1000000000) { return $this->invalid(); }
                $data[$field] = $entry[$field];
            }
        }
        $created = $entry['created_at'] ?? gmdate('Y-m-d\TH:i:s\Z');
        if (!is_string($created) || !preg_match('/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/D', $created) || strtotime($created) === false || gmdate('Y-m-d\TH:i:s\Z', strtotime($created)) !== $created) { return $this->invalid(); }
        $data['created_at'] = $created;
        return $data;
    }

    private function validRow(mixed $row): bool
    {
        return is_array($row) && isset($row['id'],$row['owner'],$row['data']) && is_array($row['data']) && !array_diff(['input_tokens','output_tokens','total_tokens','estimated_cost_usd','billing_uncertain','created_at'], array_keys($row['data'])) && !is_wp_error($this->normalize($row['data']));
    }

    private function emptyTotals(): array { return ['requests'=>0,'input_tokens'=>0,'output_tokens'=>0,'total_tokens'=>0,'thinking_tokens'=>0,'cached_tokens'=>0,'estimated_cost_usd'=>0.0,'unknown_usage_requests'=>0,'unknown_cost_requests'=>0]; }

    private function add(array &$totals, array $entry): void
    {
        ++$totals['requests'];
        foreach (['input_tokens','output_tokens','total_tokens','thinking_tokens','cached_tokens','estimated_cost_usd'] as $field) {
            if (($entry[$field] ?? null) === null || $totals[$field] === null) { $totals[$field] = null; }
            else { $totals[$field] += $entry[$field]; }
        }
        if ($entry['input_tokens'] === null || $entry['output_tokens'] === null) { ++$totals['unknown_usage_requests']; }
        if ($entry['estimated_cost_usd'] === null) { ++$totals['unknown_cost_requests']; }
    }

    private function invalid(): \WP_Error { return new \WP_Error('yagent_invalid_usage', 'اطلاعات مصرف معتبر نیست.'); }
}
