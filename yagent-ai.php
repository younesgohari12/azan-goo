<?php
/**
 * Plugin Name: YAgent AI
 * Description: هسته ماژولار YAgent و اتصال امن به سرویس‌های هوش مصنوعی؛ بتای ایجنت با تأیید عملیات و کنترل مصرف.
 * Version: 0.7.0-beta.1
 * Requires at least: 6.6
 * Requires PHP: 8.1
 * Author: Younes
 * License: GPL-2.0-or-later
 * Text Domain: yagent-ai
 */
if (!defined('ABSPATH')) { exit; }
define('YAGENT_AI_VERSION', '0.7.0-beta.1');
define('YAGENT_AI_FILE', __FILE__);
spl_autoload_register(static function (string $class): void {
    if (str_starts_with($class, 'YAgent\\')) {
        $relative = substr($class, 7);
        if (!preg_match('/^[A-Za-z0-9_\\\\]+$/', $relative)) { return; }
        $path = __DIR__ . '/src/' . str_replace('\\', '/', $relative) . '.php';
        if (is_file($path)) { require_once $path; }
    }
});
register_activation_hook(__FILE__, [YAgent\Plugin::class, 'activate']);
add_action('plugins_loaded', static function (): void { (new YAgent\Plugin())->boot(); });
