<?php
declare(strict_types=1);
namespace YAgent\AI;

final class Router
{
    public function __construct(private Config $config) {}

    public function select(string $prompt, array $request = []): array|\WP_Error
    {
        $config = $this->config->get();
        $routing = $config['routing'];
        $id = $request['profile_id'] ?? null;
        $reason = 'manual';
        $tier = $request['tier'] ?? null;
        if ($id !== null && (!is_string($id) || $id === '')) { return $this->error('yagent_profile_required'); }
        if (isset($request['requires_tools']) && !is_bool($request['requires_tools'])) { return $this->error('yagent_invalid_route'); }
        if (isset($request['allow_powerful']) && !is_bool($request['allow_powerful'])) { return $this->error('yagent_invalid_route'); }
        if ($tier !== null && !in_array($tier, ['economic','balanced','powerful'], true)) { return $this->error('yagent_invalid_route'); }
        if ($id === null) {
            if (!$routing['enabled']) { return $this->error('yagent_profile_required'); }
            if ($tier === null) {
                $length = function_exists('mb_strlen') ? mb_strlen($prompt, 'UTF-8') : strlen($prompt);
                $tier = $length >= $routing['long_prompt_chars'] ? 'balanced' : 'economic';
                $reason = $tier === 'balanced' ? 'long_prompt' : 'economic_default';
            } else { $reason = 'requested_tier'; }
            $id = $routing[$tier];
        }
        if (!is_string($id) || !isset($config['models'][$id])) { return $this->error('yagent_profile_unavailable'); }
        if (($tier === 'powerful' || ($routing['powerful'] !== null && $id === $routing['powerful'])) && (!$routing['allow_powerful'] || ($request['allow_powerful'] ?? false) !== true)) { return $this->error('yagent_powerful_disabled'); }
        $profile = $config['models'][$id];
        if (($request['requires_tools'] ?? false) && !$profile['supports_tools']) { return $this->error('yagent_tools_unsupported'); }
        return ['profile_id'=>$id, 'provider'=>$profile['provider'], 'model'=>$profile['model'], 'reason'=>$reason, 'profile'=>$profile];
    }

    private function error(string $code): \WP_Error { return new \WP_Error($code, 'پروفایل مناسب و مجاز برای این درخواست در دسترس نیست.', ['status'=>400]); }
}
