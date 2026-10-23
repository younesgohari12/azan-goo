<?php
declare(strict_types=1);
namespace YAgent\AI;

use YAgent\Infrastructure\Lock;
use YAgent\Infrastructure\Store;

/** Atomic reservations serialize accounting only. Provider HTTP never runs inside the lock. */
final class Budget
{
    public const KIND = 'budget_reservation';
    private const MAX_ROWS = 10000;
    public function __construct(private Config $config, private UsageLedger $ledger, private Store $store) {}

    public function reserve(array $profile, int $inputTokenUpperBound, int $maxOutputTokens, int $userId, string $taskId, string $conversationId = ''): array|\WP_Error
    {
        if ($inputTokenUpperBound < 0 || $inputTokenUpperBound > 1000000000 || $maxOutputTokens < 1 || $maxOutputTokens > 1000000 || $userId < 0 || strlen($taskId) > 256 || strlen($conversationId) > 256) { return $this->error('yagent_invalid_reservation'); }
        $config = $this->config->get();
        if(ConsumptionMode::enabled()){
            $data=['provider'=>(string)($profile['provider']??''),'model'=>(string)($profile['model']??''),'task_id'=>$taskId,'conversation_id'=>$conversationId,'input_token_upper_bound'=>$inputTokenUpperBound,'max_output_tokens'=>$maxOutputTokens,'reserved_cost_usd'=>$this->estimate($profile,$inputTokenUpperBound,$maxOutputTokens),'state'=>'reserved','created_at'=>gmdate('Y-m-d\TH:i:s\Z'),'open_consumption'=>true];
            if(isset($profile['profile_id']))$data['profile_id']=$profile['profile_id'];
            return $this->store->create(self::KIND,$userId,$data);
        }
        $limits = $config['budgets'];
        $cost = $this->estimate($profile, $inputTokenUpperBound, $maxOutputTokens);
        foreach (['daily_usd','monthly_usd','task_usd'] as $field) {
            if ($limits[$field] !== null && $cost === null) { return $this->error('yagent_budget_unknown_price'); }
        }
        return $this->locked(function() use ($profile,$inputTokenUpperBound,$maxOutputTokens,$userId,$taskId,$conversationId,$limits,$cost): array|\WP_Error {
            $usage = $this->ledger->export();
            if (is_wp_error($usage)) { return $usage; }
            $reservations = $this->store->all(self::KIND, self::MAX_ROWS);
            if (count($usage) >= self::MAX_ROWS || count($reservations) >= self::MAX_ROWS) { return $this->error('yagent_budget_capacity'); }
            $totals = $this->totals($usage, $reservations, $taskId);
            if (is_wp_error($totals)) { return $totals; }
            foreach (['daily','monthly','task'] as $period) {
                $countCap = $limits[$period.'_requests'];
                if ($countCap !== null && $totals[$period]['requests'] + 1 > $countCap) { return $this->error('yagent_budget_exceeded'); }
                $moneyCap = $limits[$period.'_usd'];
                if ($moneyCap !== null) {
                    if ($totals[$period]['unknown'] || $cost === null) { return $this->error('yagent_budget_unknown_cost'); }
                    if ($totals[$period]['money'] + $this->units($cost) > $this->capUnits((float)$moneyCap)) { return $this->error('yagent_budget_exceeded'); }
                }
            }
            $data = ['provider'=>(string)($profile['provider'] ?? ''),'model'=>(string)($profile['model'] ?? ''),'task_id'=>$taskId,'conversation_id'=>$conversationId,'input_token_upper_bound'=>$inputTokenUpperBound,'max_output_tokens'=>$maxOutputTokens,'reserved_cost_usd'=>$cost,'state'=>'reserved','created_at'=>gmdate('Y-m-d\TH:i:s\Z')];
            if (isset($profile['profile_id']) && is_string($profile['profile_id'])) { $data['profile_id'] = $profile['profile_id']; }
            return $this->store->create(self::KIND, $userId, $data);
        });
    }

    public function settle(array $reservation, array $entry): array|\WP_Error
    {
        if (!isset($reservation['id'],$reservation['owner']) || !is_string($reservation['id']) || !is_int($reservation['owner'])) { return $this->error('yagent_invalid_reservation'); }
        return $this->locked(function() use ($reservation,$entry): array|\WP_Error {
            $current = $this->store->get(self::KIND, $reservation['id'], $reservation['owner']);
            if (is_wp_error($current)) { return $current; }
            if (!is_array($current) || !$this->validReservation($current)) { return $this->error('yagent_invalid_reservation'); }
            $existing = $this->store->get(UsageLedger::KIND, $current['id'], $current['owner']);
            if (is_wp_error($existing) && $existing->get_error_code() !== 'yagent_not_found') { return $existing; }
            if (is_array($existing)) { return $existing; }
            $data = $current['data'];
            // Identity and window come from the reservation, never from caller-supplied usage.
            $entry['user_id'] = $current['owner'];
            foreach (['provider','model','task_id','conversation_id','created_at'] as $field) { $entry[$field] = $data[$field]; }
            if (isset($data['profile_id'])) { $entry['profile_id'] = $data['profile_id']; }
            $uncertain = ($entry['billing_uncertain'] ?? false) || !isset($entry['input_tokens'],$entry['output_tokens']) || !array_key_exists('estimated_cost_usd',$entry) || $entry['estimated_cost_usd'] === null;
            // A response claiming zero without complete usage is still potentially billable.
            $entry['billing_uncertain'] = $uncertain;
            $usage = $this->ledger->recordReserved($entry, $current['id']);
            if (is_wp_error($usage)) { return $usage; }
            $data['state'] = $uncertain ? 'uncertain' : 'settled';
            $data['usage_id'] = $usage['id'];
            $updated = $this->store->update(self::KIND, $current['id'], (int)$current['version'], $data);
            // A failed transition leaves the original reservation in place, conservatively counted.
            return is_wp_error($updated) ? $updated : $usage;
        });
    }

    private function totals(array $usage, array $reservations, string $taskId): array|\WP_Error
    {
        $totals = ['daily'=>['requests'=>0,'money'=>0,'unknown'=>false],'monthly'=>['requests'=>0,'money'=>0,'unknown'=>false],'task'=>['requests'=>0,'money'=>0,'unknown'=>false]];
        $active = [];
        $usageById = [];
        foreach ($usage as $row) { $usageById[$row['id']] = $row; }
        foreach ($reservations as $row) {
            if (!$this->validReservation($row)) { return $this->error('yagent_budget_corrupt'); }
            if (isset($usageById[$row['id']]) && $usageById[$row['id']]['owner'] !== $row['owner']) { return $this->error('yagent_budget_corrupt'); }
            if ($row['data']['state'] !== 'settled') { $active[$row['id']] = $row; }
            elseif (!isset($usageById[$row['id']])) { return $this->error('yagent_budget_corrupt'); }
        }
        // Active reservations supersede their usage entry: count one request and retain the upper bound.
        foreach ($usage as $row) {
            if (isset($active[$row['id']])) { continue; }
            $data = $row['data'];
            $this->addTotal($totals, $data['created_at'], (string)($data['task_id'] ?? ''), $taskId, $data['estimated_cost_usd']);
        }
        foreach ($active as $row) {
            $data = $row['data'];
            $cost = $data['reserved_cost_usd'];
            if ($cost !== null && isset($usageById[$row['id']]['data']['estimated_cost_usd'])) { $cost = max((float)$cost, (float)$usageById[$row['id']]['data']['estimated_cost_usd']); }
            $this->addTotal($totals, $data['created_at'], $data['task_id'], $taskId, $cost);
        }
        return $totals;
    }

    private function addTotal(array &$totals, string $createdAt, string $rowTask, string $taskId, mixed $cost): void
    {
        $periods = [];
        if (substr($createdAt,0,10) === gmdate('Y-m-d')) { $periods[] = 'daily'; }
        if (substr($createdAt,0,7) === gmdate('Y-m')) { $periods[] = 'monthly'; }
        if ($rowTask === $taskId) { $periods[] = 'task'; }
        foreach ($periods as $period) {
            ++$totals[$period]['requests'];
            if ($cost === null) { $totals[$period]['unknown'] = true; }
            else { $totals[$period]['money'] += $this->units((float)$cost); }
        }
    }

    private function validReservation(mixed $row): bool
    {
        if (!is_array($row) || !isset($row['id'],$row['owner'],$row['version'],$row['data']) || !is_array($row['data'])) { return false; }
        $data = $row['data'];
        if (!isset($data['created_at'],$data['task_id'],$data['conversation_id'],$data['state'],$data['provider'],$data['model']) || !array_key_exists('reserved_cost_usd',$data) || !in_array($data['state'],['reserved','uncertain','settled'],true) || !is_string($data['created_at']) || !preg_match('/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/D',$data['created_at']) || strtotime($data['created_at']) === false || !is_string($data['task_id']) || !is_string($data['conversation_id'])) { return false; }
        return $data['reserved_cost_usd'] === null || ((is_int($data['reserved_cost_usd']) || is_float($data['reserved_cost_usd'])) && is_finite((float)$data['reserved_cost_usd']) && $data['reserved_cost_usd'] >= 0 && $data['reserved_cost_usd'] <= 1000000000);
    }

    private function estimate(array $profile, int $input, int $output): ?float
    {
        foreach (['input_price','output_price'] as $key) {
            if (!isset($profile[$key]) || (!is_float($profile[$key]) && !is_int($profile[$key])) || !is_finite((float)$profile[$key]) || $profile[$key] < 0 || $profile[$key] > 1000000000) { return null; }
        }
        $cost = ($input * (float)$profile['input_price'] + $output * (float)$profile['output_price']) / 1000000;
        return $cost <= 1000000000 ? $this->units($cost) / 1000000 : null;
    }

    /** Integer microdollars, rounded upwards for charges and downwards for caps. */
    private function units(float $dollars): int { return $dollars>0 ? max(1,(int)ceil(round($dollars * 1000000, 8))) : 0; }
    private function capUnits(float $dollars): int { return (int)floor(round($dollars * 1000000, 8)); }

    private function locked(callable $operation): array|\WP_Error
    {
        $lock = new Lock();
        $token = $lock->acquire('budget', 120);
        if (is_wp_error($token)) { return $token; }
        try { return $operation(); }
        catch (\Throwable $error) { return $this->error('yagent_budget_unavailable'); }
        finally { $lock->release('budget', $token); }
    }

    private function error(string $code): \WP_Error { return new \WP_Error($code, 'درخواست به دلیل محدودیت یا نامشخص بودن اطلاعات مصرف متوقف شد.'); }
}
