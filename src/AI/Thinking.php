<?php
declare(strict_types=1);
namespace YAgent\AI;

final class Thinking
{
    /** Return provider-native controls; auto deliberately leaves provider defaults alone. */
    public static function parameters(array $profile, string $level = 'auto'): array|\WP_Error
    {
        if ($level === 'auto') { return []; }
        $kind = $profile['thinking_kind'] ?? 'none';
        $levels = $profile['thinking_levels'] ?? [];
        if (!is_array($levels) || !array_key_exists($level, $levels)) { return self::unsupported(); }
        $wire = $levels[$level];
        if ($kind === 'openai_effort' && is_string($wire) && preg_match('/^[a-zA-Z0-9_-]{1,32}$/D', $wire)) { return ['reasoning_effort'=>$wire]; }
        if ($kind === 'gemini_level' && is_string($wire) && preg_match('/^[a-zA-Z0-9_-]{1,32}$/D', $wire)) { return ['thinkingConfig'=>['thinkingLevel'=>$wire]]; }
        if ($kind === 'gemini_budget' && is_int($wire) && $wire >= 0 && $wire <= 1048576) { return ['thinkingConfig'=>['thinkingBudget'=>$wire]]; }
        return self::unsupported();
    }

    private static function unsupported(): \WP_Error { return new \WP_Error('yagent_thinking_unsupported', 'سطح تفکر انتخاب‌شده برای این مدل پشتیبانی نمی‌شود.', ['status'=>400]); }
}
