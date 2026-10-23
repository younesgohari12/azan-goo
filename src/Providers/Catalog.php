<?php
namespace YAgent\Providers;
if (!defined('ABSPATH')) { exit; }

final class Catalog
{
    public static function all(): array
    {
        return [
            'gemini'=>['label'=>'Google AI Studio / Gemini', 'base_url'=>'https://generativelanguage.googleapis.com/v1beta', 'protocol'=>'gemini'],
            'gapgpt'=>['label'=>'گپ جی‌پی‌تی — GapGPT', 'base_url'=>'https://api.gapgpt.app/v1', 'protocol'=>'openai'],
            'avalai'=>['label'=>'اول ای‌آی — AvalAI', 'base_url'=>'https://api.avalai.ir/v1', 'protocol'=>'openai'],
            'arvancloud'=>['label'=>'آروان‌کلاد — AIaaS', 'base_url'=>'', 'protocol'=>'openai'],
        ];
    }
}
