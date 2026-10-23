<?php
namespace YAgent\Providers;
if (!defined('ABSPATH')) { exit; }

interface Provider
{
    public function exchange(array $connection,array $messages,array $tools=[],array $options=[]): array|\WP_Error;
    public function chat(array $connection,array $messages): array|\WP_Error;
}
