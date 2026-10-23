<?php
namespace YAgent\Providers;

use YAgent\Infrastructure\Store;
use YAgent\Settings;

if (!defined('ABSPATH')) { exit; }

/** Metadata requests never generate content or run from the paid request path. */
final class Discovery
{
    private const KIND = 'model_metadata';
    private const MAX_AGE = 600;
    private const MAX_BYTES = 524288;
    private const MAX_ITEMS = 200;

    public function __construct(private Settings $settings, private Store $store) {}

    public function models(string $provider, bool $refresh = false): array|\WP_Error
    {
        $connection = $this->connection($provider);
        if (is_wp_error($connection)) { return $connection; }
        $id = $this->fingerprint($connection);
        try {
            $record = $this->store->get(self::KIND, $id, 0);
            if (!$refresh && !is_wp_error($record) && $this->validCache($record['data'], $provider, $id)) {
                return $this->publicCache($record['data']);
            }
        } catch (\Throwable $error) {
            return $this->error('storage', 'خواندن اطلاعات ذخیره‌شده مدل‌ها انجام نشد.', 503);
        }

        $headers = ['Accept'=>'application/json'];
        if ($connection['protocol'] === 'gemini') { $headers['x-goog-api-key'] = $connection['api_key']; }
        else { $headers['Authorization'] = 'Bearer '.$connection['api_key']; }
        $response = wp_safe_remote_get($connection['models_url'], [
            'headers'=>$headers, 'timeout'=>10, 'redirection'=>0, 'sslverify'=>true,
            'limit_response_size'=>self::MAX_BYTES + 1,
        ]);
        if (is_wp_error($response)) { return $this->error('network', 'دریافت فهرست مدل‌ها از سرویس انجام نشد.', 502); }
        $status = (int) wp_remote_retrieve_response_code($response);
        if ($status < 200 || $status >= 300) {
            return $this->error('provider', 'سرویس فهرست مدل‌ها را برنگرداند. (HTTP '.$status.')', 502, ['http_status'=>$status]);
        }
        $raw = wp_remote_retrieve_body($response);
        if (strlen($raw) > self::MAX_BYTES) { return $this->error('response_too_large', 'پاسخ فهرست مدل‌ها از محدودیت اندازه بزرگ‌تر بود.', 502); }
        $decoded = json_decode($raw);
        $field = $connection['protocol'] === 'gemini' ? 'models' : 'data';
        if (!$decoded instanceof \stdClass || json_last_error() !== JSON_ERROR_NONE || property_exists($decoded, 'error') || !isset($decoded->{$field}) || !is_array($decoded->{$field})) {
            return $this->error('invalid_response', 'ساختار پاسخ فهرست مدل‌ها معتبر نیست.', 502);
        }
        $items = [];
        $seen = [];
        foreach (array_slice($decoded->{$field}, 0, self::MAX_ITEMS) as $model) {
            if (!$model instanceof \stdClass) { continue; }
            $item = $this->parseModel($model, $connection['protocol']);
            if ($item === null || isset($seen[$item['id']])) { continue; }
            // A provider must not be able to reflect credentials into cached UI metadata.
            $strings = [$item['id'], $item['label'], ...($item['modalities'] ?? [])];
            if (array_filter($strings, static fn(string $value): bool => str_contains($value, $connection['api_key']))) { continue; }
            $items[] = $item;
            $seen[$item['id']] = true;
        }
        $data = ['provider'=>$provider, 'fingerprint'=>$id, 'items'=>$items, 'checked_at'=>time(), 'source'=>'provider_metadata'];
        try {
            $saved = is_wp_error($record)
                ? $this->store->create(self::KIND, 0, $data, $id)
                : $this->store->update(self::KIND, $id, $record['version'], $data);
        } catch (\Throwable $error) {
            return $this->error('storage', 'ذخیره اطلاعات مدل‌ها انجام نشد.', 503);
        }
        if (is_wp_error($saved)) { return $this->error('storage', 'ذخیره اطلاعات مدل‌ها انجام نشد؛ دوباره تلاش کنید.', 503); }
        return $this->publicCache($data);
    }

    /** Read matching fresh provider metadata; never make a discovery HTTP call. */
    public function forModel(string $provider, string $model): array
    {
        $connection = $this->connection($provider);
        if (is_wp_error($connection)) { return []; }
        $id = $this->fingerprint($connection);
        try { $record = $this->store->get(self::KIND, $id, 0); }
        catch (\Throwable $error) { return []; }
        if (is_wp_error($record) || !$this->validCache($record['data'], $provider, $id)) { return []; }
        foreach ($record['data']['items'] as $item) {
            if ($item['id'] === $model) { return $item; }
        }
        return [];
    }

    private function connection(string $provider): array|\WP_Error
    {
        $connection = $this->settings->connection($provider, false);
        if (is_wp_error($connection)) { return $connection; }
        $base = $connection['base_url'] ?? '';
        if (!is_string($base) || !Settings::validUrl($base)
            || ($connection['protocol'] === 'gemini' && $base !== Catalog::all()['gemini']['base_url'])) {
            return $this->error('invalid_url', 'آدرس عمومی و معتبر API را در تنظیمات ذخیره کنید.', 400);
        }
        $key = $connection['api_key'] ?? '';
        if (!is_string($key) || $key === '' || strlen($key) > 4096 || preg_match('/[\x00-\x20\x7F]/', $key)) {
            return $this->error('invalid_key', 'کلید معتبر API را در تنظیمات ذخیره کنید.', 400);
        }
        $base = rtrim($base, '/');
        if ($connection['protocol'] !== 'gemini') { $base = preg_replace('~/chat/completions$~D', '', $base); }
        $connection['models_url'] = $base.'/models';
        if (!Settings::validUrl($connection['models_url'])) { return $this->error('invalid_url', 'آدرس فهرست مدل‌ها معتبر نیست.', 400); }
        return $connection;
    }

    private function fingerprint(array $connection): string
    {
        return hash('sha256', $connection['provider']."\0".$connection['base_url']."\0".$connection['api_key']);
    }

    private function parseModel(\stdClass $model, string $protocol): ?array
    {
        if ($protocol === 'gemini') {
            if (!is_array($model->supportedGenerationMethods ?? null) || !in_array('generateContent', $model->supportedGenerationMethods, true)) { return null; }
            $id = $model->name ?? null;
            if (is_string($id) && str_starts_with($id, 'models/')) { $id = substr($id, 7); }
            $label = $model->displayName ?? $id;
            $input = $model->inputTokenLimit ?? null;
            $output = $model->outputTokenLimit ?? null;
        } else {
            $id = $model->id ?? null;
            $label = $model->name ?? $model->label ?? $model->display_name ?? $id;
            $input = $model->context_window ?? null;
            $output = $model->max_output_tokens ?? $model->max_completion_tokens ?? null;
        }
        if (!is_string($id) || !$this->validId($id)) { return null; }
        $label = is_string($label) ? trim(sanitize_text_field($label)) : '';
        if ($label === '') { $label = $id; }
        $label = function_exists('mb_substr') ? mb_substr($label, 0, 128) : substr($label, 0, 512);
        $modalities = $model->modalities ?? $model->input_modalities ?? $model->architecture->input_modalities ?? null;
        $tools = $model->capabilities->tool_calling ?? $model->supports_tools ?? null;
        return [
            'id'=>$id, 'label'=>$label, 'input_limit'=>$this->limit($input), 'output_limit'=>$this->limit($output),
            'modalities'=>$this->modalities($modalities), 'supports_tools'=>is_bool($tools) ? $tools : null,
        ];
    }

    private function validId(string $id): bool
    {
        return (bool) preg_match('/^[a-zA-Z0-9][a-zA-Z0-9._:\/-]{0,127}$/D', $id) && !str_contains($id, '..');
    }

    private function limit($value): ?int { return is_int($value) && $value > 0 ? $value : null; }

    private function modalities($values): ?array
    {
        if (!is_array($values) || !array_is_list($values) || count($values) > 16) { return null; }
        $result = [];
        foreach ($values as $value) {
            if (!is_string($value) || !preg_match('/^[a-zA-Z][a-zA-Z0-9_-]{0,31}$/D', $value)) { return null; }
            $result[] = strtolower($value);
        }
        return array_values(array_unique($result));
    }

    private function validCache(array $data, string $provider, string $id): bool
    {
        if (($data['source'] ?? null) !== 'provider_metadata' || ($data['provider'] ?? null) !== $provider || ($data['fingerprint'] ?? null) !== $id
            || !is_int($data['checked_at'] ?? null) || $data['checked_at'] > time() || $data['checked_at'] <= time() - self::MAX_AGE
            || !is_array($data['items'] ?? null) || !array_is_list($data['items']) || count($data['items']) > self::MAX_ITEMS) { return false; }
        foreach ($data['items'] as $item) {
            if (!is_array($item) || !is_string($item['id'] ?? null) || !$this->validId($item['id']) || !is_string($item['label'] ?? null)
                || !array_key_exists('input_limit', $item) || !array_key_exists('output_limit', $item)
                || !array_key_exists('modalities', $item) || !array_key_exists('supports_tools', $item)
                || ($item['input_limit'] !== null && $this->limit($item['input_limit']) === null)
                || ($item['output_limit'] !== null && $this->limit($item['output_limit']) === null)
                || ($item['modalities'] !== null && $this->modalities($item['modalities']) !== $item['modalities'])
                || ($item['supports_tools'] !== null && !is_bool($item['supports_tools']))) { return false; }
        }
        return true;
    }

    private function publicCache(array $data): array
    {
        return ['items'=>$data['items'], 'checked_at'=>$data['checked_at'], 'source'=>'provider_metadata'];
    }

    private function error(string $code, string $message, int $status, array $details = []): \WP_Error
    {
        return new \WP_Error('yagent_discovery_'.$code, $message, ['status'=>$status] + $details);
    }
}
