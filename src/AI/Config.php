<?php
declare(strict_types=1);
namespace YAgent\AI;

/** Validated, secret-free consumption policy. Invalid persisted policy fails closed. */
final class Config
{
    public const OPTION = 'yagent_ai_consumption';

    public static function defaults(): array
    {
        return [
            'models' => [],
            'routing' => ['enabled' => false, 'economic' => null, 'balanced' => null, 'powerful' => null, 'allow_powerful' => false, 'long_prompt_chars' => 4000],
            'budgets' => ['daily_usd' => null, 'monthly_usd' => null, 'task_usd' => null, 'daily_requests' => null, 'monthly_requests' => null, 'task_requests' => null],
            'retry' => ['enabled' => false, 'max_retries' => 2, 'base_delay_seconds' => 1, 'max_delay_seconds' => 60],
            'memory' => ['context_tokens' => 16000, 'max_output_tokens' => 2048, 'recent_turns' => 6, 'summary_max_tokens' => 512, 'summarize' => true],
            'task_limits' => ['max_model_calls' => 12, 'max_tool_calls' => 24, 'max_seconds' => 300],
            'read_only' => true,
            'auto_install_plugins' => false,
        ];
    }

    public function get(): array
    {
        $missing = new \stdClass();
        $saved = get_option(self::OPTION, $missing);
        if ($saved === $missing) { return self::defaults(); }
        if (!is_array($saved)) { return $this->closed(); }
        $result = $this->validate($this->merge(self::defaults(), $saved));
        return is_wp_error($result) ? $this->closed() : $result;
    }

    public function save(array $input): array|\WP_Error
    {
        $result = $this->validate($this->merge($this->get(), $input));
        if (is_wp_error($result)) { return $result; }
        update_option(self::OPTION, $result, false);
        // update_option also returns false for an unchanged value. Verify the persisted value.
        if (get_option(self::OPTION, null) !== $result) {
            return new \WP_Error('yagent_config_write', 'ذخیره تنظیمات مصرف انجام نشد.', ['status'=>503]);
        }
        return $result;
    }

    private function closed(): array
    {
        $value = self::defaults();
        $value['budgets']['daily_requests'] = 0;
        $value['budgets']['daily_usd'] = 0.0;
        return $value;
    }

    private function merge(array $base, array $input): array
    {
        foreach ($input as $key => $value) {
            if ($key !== 'models' && isset($base[$key]) && is_array($base[$key]) && is_array($value)) {
                $base[$key] = array_replace($base[$key], $value);
            } else { $base[$key] = $value; }
        }
        return $base;
    }

    private function validate(array $value): array|\WP_Error
    {
        $bad = static fn() => new \WP_Error('yagent_invalid_consumption', 'تنظیمات مصرف معتبر نیست.', ['status'=>400]);
        if (array_diff(array_keys($value), array_keys(self::defaults())) || !is_bool($value['read_only']) || !is_bool($value['auto_install_plugins'])) { return $bad(); }
        if (!is_array($value['models']) || count($value['models']) > 100) { return $bad(); }
        foreach ($value['models'] as $id => $profile) {
            if (!is_string($id) || !preg_match('/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/D', $id) || !is_array($profile)) { return $bad(); }
            $fields = ['provider', 'model', 'input_price', 'output_price', 'supports_tools', 'thinking_kind', 'thinking_levels'];
            if (array_diff(array_keys($profile), $fields) || array_diff(['provider','model'], array_keys($profile))) { return $bad(); }
            $profile = array_replace(['input_price'=>null,'output_price'=>null,'supports_tools'=>false,'thinking_kind'=>'none','thinking_levels'=>[]], $profile);
            foreach (['provider','model'] as $field) {
                if (!is_string($profile[$field]) || !preg_match('/^[a-zA-Z0-9][a-zA-Z0-9_.:\/-]{0,199}$/D', $profile[$field]) || str_contains($profile[$field], '..')) { return $bad(); }
            }
            foreach (['input_price','output_price'] as $field) {
                if ($profile[$field] !== null) {
                    if (!$this->number($profile[$field], 0, 1000000000)) { return $bad(); }
                    $profile[$field] = (float) $profile[$field];
                }
            }
            if (!is_bool($profile['supports_tools']) || !in_array($profile['thinking_kind'], ['none','openai_effort','gemini_level','gemini_budget'], true) || !is_array($profile['thinking_levels'])) { return $bad(); }
            if (count($profile['thinking_levels']) > 10) { return $bad(); }
            foreach ($profile['thinking_levels'] as $level => $wire) {
                if (!in_array($level, ['low','medium','high','minimal','none','off'], true)) { return $bad(); }
                if ($profile['thinking_kind'] === 'gemini_budget') {
                    if (!is_int($wire) || $wire < 0 || $wire > 1048576) { return $bad(); }
                } elseif (!is_string($wire) || !preg_match('/^[a-zA-Z0-9_-]{1,32}$/D', $wire)) { return $bad(); }
            }
            if ($profile['thinking_kind'] === 'none' && $profile['thinking_levels'] !== []) { return $bad(); }
            $value['models'][$id] = $profile;
        }
        foreach (['routing','budgets','retry','memory','task_limits'] as $section) {
            if (!is_array($value[$section]) || array_diff(array_keys($value[$section]), array_keys(self::defaults()[$section])) || array_diff(array_keys(self::defaults()[$section]), array_keys($value[$section]))) { return $bad(); }
        }
        foreach (['enabled','allow_powerful'] as $field) { if (!is_bool($value['routing'][$field])) { return $bad(); } }
        foreach (['economic','balanced','powerful'] as $tier) {
            $id = $value['routing'][$tier];
            if ($id !== null && (!is_string($id) || !isset($value['models'][$id]))) { return $bad(); }
        }
        if (!$this->integer($value['routing']['long_prompt_chars'], 1, 1000000)) { return $bad(); }
        foreach ($value['budgets'] as $field => $limit) {
            if ($limit === null) { continue; }
            if (str_ends_with($field, '_requests')) {
                if (!$this->integer($limit, 0, 1000000000)) { return $bad(); }
            } else {
                if (!$this->number($limit, 0, 1000000000)) { return $bad(); }
                $value['budgets'][$field] = (float) $limit;
            }
        }
        if (!is_bool($value['retry']['enabled']) || !$this->integer($value['retry']['max_retries'], 0, 2) || !$this->integer($value['retry']['base_delay_seconds'], 0, 60) || !$this->integer($value['retry']['max_delay_seconds'], 0, 300) || $value['retry']['max_delay_seconds'] < $value['retry']['base_delay_seconds']) { return $bad(); }
        if (!is_bool($value['memory']['summarize'])) { return $bad(); }
        foreach (['context_tokens'=>[256,2000000], 'max_output_tokens'=>[1,1000000], 'recent_turns'=>[0,100], 'summary_max_tokens'=>[1,100000]] as $field => [$min,$max]) {
            if (!$this->integer($value['memory'][$field], $min, $max)) { return $bad(); }
        }
        if ($value['memory']['max_output_tokens'] >= $value['memory']['context_tokens'] || $value['memory']['summary_max_tokens'] >= $value['memory']['context_tokens']) { return $bad(); }
        foreach (['max_model_calls'=>[1,100], 'max_tool_calls'=>[0,1000], 'max_seconds'=>[1,3600]] as $field => [$min,$max]) {
            if (!$this->integer($value['task_limits'][$field], $min, $max)) { return $bad(); }
        }
        return $value;
    }

    private function integer(mixed $value, int $min, int $max): bool { return is_int($value) && $value >= $min && $value <= $max; }
    private function number(mixed $value, float $min, float $max): bool { return (is_int($value) || is_float($value) || (is_string($value) && is_numeric($value))) && is_finite((float)$value) && (float)$value >= $min && (float)$value <= $max; }
}
