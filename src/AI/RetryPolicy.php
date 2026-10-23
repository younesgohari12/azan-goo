<?php
declare(strict_types=1);
namespace YAgent\AI;

final class RetryPolicy
{
    public static function decision(\WP_Error $error, int $attempt, array $config, float $remainingSeconds): array
    {
        $no = static fn(string $reason) => ['retry'=>false, 'delay_seconds'=>0, 'reason'=>$reason];
        $policy = $config['retry'] ?? $config;
        if (($policy['enabled'] ?? false) !== true) { return $no('disabled'); }
        if ($attempt < 1 || $attempt > min(2, max(0, (int)($policy['max_retries'] ?? 2)))) { return $no('retry_limit'); }
        $data = $error->get_error_data();
        if (!is_array($data)) { return $no('unsafe_error'); }
        // Retrying a request is safe only when the transport explicitly identifies an HTTP response.
        $status = $data['http_status'] ?? $data['status'] ?? null;
        $safeCodes = ['yagent_provider_rate_limit','yagent_provider_error','yagent_http_error','provider_http_error'];
        if (!in_array($error->get_error_code(), $safeCodes, true) || !is_int($status) || !in_array($status, [429,500,502,503,504], true) || !empty($data['network_error']) || !empty($data['tool_execution']) || !empty($data['write']) || ($data['retryable'] ?? true) !== true) { return $no('unsafe_error'); }
        $base = max(0, min(60, (int)($policy['base_delay_seconds'] ?? 1)));
        $maximum = max($base, min(300, max(0, (int)($policy['max_delay_seconds'] ?? 60))));
        $delay = min($maximum, $base * (2 ** ($attempt - 1)));
        $retryAfter = $data['retry_after'] ?? $data['retry_after_seconds'] ?? null;
        if ($retryAfter !== null) {
            if (is_int($retryAfter) || (is_string($retryAfter) && ctype_digit($retryAfter))) { $retryAfter = (int)$retryAfter; }
            elseif (is_string($retryAfter)) { $date = strtotime($retryAfter); $retryAfter = $date === false ? null : max(0, $date-time()); }
            else { $retryAfter = null; }
            if ($retryAfter !== null) {
                if ($retryAfter > $maximum) { return $no('retry_after_limit'); }
                $delay = max($delay, $retryAfter);
            }
        }
        if (!is_finite($remainingSeconds) || $remainingSeconds <= $delay + 1) { return $no('deadline'); }
        return ['retry'=>true, 'delay_seconds'=>$delay, 'reason'=>'transient_http'];
    }
}
