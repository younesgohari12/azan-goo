<?php
namespace YAgent\Agent;
if (!defined('ABSPATH')) { exit; }

/** Installed plugins only. The executor owns approvals, serialization and durable receipts. */
final class PluginManager
{
    private const MAX_FILES = 5000;
    private const MAX_ENTRIES = 10000;
    private const MAX_FILE_BYTES = 67108864;
    private const MAX_TOTAL_BYTES = 134217728;

    public static function normalize(array $args): array|\WP_Error
    {
        if (count($args) !== 2 || !isset($args['action'], $args['plugin'])
            || !is_string($args['action']) || !is_string($args['plugin'])
            || !in_array($args['action'], ['activate', 'deactivate', 'delete'], true)
            || strlen($args['plugin']) > 255
            || !preg_match('~\A[A-Za-z0-9][A-Za-z0-9._-]*(?:/[A-Za-z0-9][A-Za-z0-9._-]*)?\.php\z~D', $args['plugin'])) {
            return self::error('yagent_tool_args', 'عملیات و نام دقیق فایل افزونه معتبر نیستند.', 400);
        }
        return ['action' => $args['action'], 'plugin' => $args['plugin']];
    }

    public static function preview(array $args, int $userId): array|\WP_Error
    {
        $args = self::normalize($args);
        if (is_wp_error($args)) { return $args; }
        $allowed = self::authorize($args, $userId);
        if (is_wp_error($allowed)) { return $allowed; }
        $before = self::state($args['plugin']);
        if (is_wp_error($before)) { return $before; }
        if ($before['network_only']) {
            return self::error('yagent_plugin_network_only', 'مدیریت افزونه مخصوص شبکه در این ابزار پشتیبانی نمی‌شود.', 409);
        }
        if ($args['action'] === 'delete' && ($before['active'] || $before['active_siblings'])) {
            return self::error('yagent_plugin_active', 'پیش از حذف، افزونه و افزونه‌های هم‌پوشه آن باید غیرفعال باشند.', 409);
        }
        if (($args['action'] !== 'activate' && $before['active_dependents'])
            || ($args['action'] === 'activate' && $before['unmet_dependencies'])) {
            return self::error('yagent_plugin_dependency', 'وابستگی افزونه‌ها اجازه این عملیات را نمی‌دهد؛ ابتدا وابستگی‌ها را بررسی کنید.', 409);
        }
        if ($args['action'] === 'activate' && !$before['requirements_met']) {
            return self::error('yagent_plugin_requirements', 'نسخه وردپرس یا PHP با نیازمندی افزونه سازگار نیست.', 409);
        }
        if ($args['action'] === 'delete') {
            $direct = self::directFilesystem(false);
            if (is_wp_error($direct)) { return $direct; }
        }
        return ['args' => $args, 'before' => $before, 'after' => self::summary($args, $before),
            'before_hash' => ToolExecutor::argumentsHash($before)];
    }

    public static function execute(array $args, int $userId): array|\WP_Error
    {
        $preview = self::preview($args, $userId);
        if (is_wp_error($preview)) { return $preview; }
        $args = $preview['args']; $before = $preview['before'];
        $plugin = $args['plugin']; $action = $args['action'];
        $base = ob_get_level(); $output = ''; $result = null; $displayErrors = null;
        $guard = (object) ['armed' => false, 'buffer' => $base];
        // exit() and fatal plugin errors bypass finally. Keep their buffered output out of the
        // tool response; the executor's existing incomplete receipt prevents automatic replay.
        register_shutdown_function(static function () use ($guard): void {
            if ($guard->armed) { while (ob_get_level() > $guard->buffer) { if (!@ob_end_clean()) { break; } } }
        });
        $credentialFilter = static fn($credentials): array => [];
        $methodFilter = static fn(): string => 'direct';
        try {
            if ($action === 'delete') {
                $direct = self::directFilesystem(true);
                if (is_wp_error($direct)) { return $direct; }
            }
            // Reauthorize immediately before calling code belonging to another plugin.
            $allowed = self::authorize($args, $userId);
            if (is_wp_error($allowed)) { return $allowed; }
            $displayErrors = ini_get('display_errors');
            @ini_set('display_errors', '0');
            ob_start(); $guard->armed = true;
            if ($action === 'activate') {
                $result = activate_plugin($plugin, '', false, false);
            } elseif ($action === 'deactivate') {
                deactivate_plugins($plugin, false, false);
            } else {
                // Core normally offers an interactive credential form. The direct-method preflight
                // above is mandatory; short-circuit the form and pin that checked method for this call.
                add_filter('request_filesystem_credentials', $credentialFilter, PHP_INT_MAX);
                add_filter('filesystem_method', $methodFilter, PHP_INT_MAX);
                $result = delete_plugins([$plugin]);
            }
        } catch (\Throwable $e) {
            return self::error('yagent_needs_review', 'عملیات افزونه متوقف شد؛ وضعیت سایت و رسید را بررسی کنید و درخواست را تکرار نکنید.', 409);
        } finally {
            remove_filter('request_filesystem_credentials', $credentialFilter, PHP_INT_MAX);
            remove_filter('filesystem_method', $methodFilter, PHP_INT_MAX);
            while (ob_get_level() > $base) {
                $chunk = ob_get_clean();
                if ($chunk === false) { $output = 'unclosed_output_buffer'; break; }
                $output = $chunk . $output;
            }
            $guard->armed = false;
            if (is_string($displayErrors)) { @ini_set('display_errors', $displayErrors); }
        }
        self::fresh();
        if (is_wp_error($result) || $output !== '') {
            // WP_Error data may contain arbitrary plugin output, paths or credentials.
            return self::error($action === 'activate' && !is_plugin_active($plugin) ? 'yagent_plugin_activation_failed' : 'yagent_needs_review',
                'نتیجه عملیات افزونه تأیید نشد؛ وضعیت افزونه و رسید را بررسی کنید.', 409);
        }
        if ($action === 'delete') {
            $target = self::target($plugin);
            if ($result !== true || file_exists($target) || is_link($target) || is_plugin_active($plugin)
                || isset(get_plugins()[$plugin])) {
                return self::error('yagent_needs_review', 'حذف کامل افزونه تأیید نشد؛ فایل‌ها و رسید را بررسی کنید.', 409);
            }
            $after = self::summary($args, $before);
        } else {
            $after = self::state($plugin);
            if (is_wp_error($after) || $after['active'] !== ($action === 'activate') || $after['network_active']) {
                return self::error('yagent_needs_review', 'وضعیت نهایی افزونه با درخواست تطبیق ندارد؛ سایت و رسید را بررسی کنید.', 409);
            }
        }
        return self::summary($args, $before) + ['changed' => $action === 'delete' || $before['active'] !== ($action === 'activate'),
            'before' => $before, 'after' => $after];
    }

    private static function authorize(array $args, int $userId): bool|\WP_Error
    {
        require_once ABSPATH . 'wp-admin/includes/plugin.php';
        if (is_multisite()) {
            return self::error('yagent_plugin_multisite', 'مدیریت خودکار افزونه در وردپرس شبکه پشتیبانی نمی‌شود.', 403);
        }
        if ($userId > 0) { clean_user_cache($userId); }
        foreach (['alloptions', 'notoptions', wp_roles()->role_key] as $key) { wp_cache_delete($key, 'options'); }
        wp_roles()->for_site();
        $actor = $userId > 0 ? get_userdata($userId) : false;
        $cap = $args['action'] === 'deactivate' ? 'deactivate_plugin' : 'activate_plugin';
        if (!$actor || !user_can($actor, 'manage_options') || !user_can($actor, 'activate_plugins')
            || !user_can($actor, $cap, $args['plugin'])) {
            return self::error('yagent_forbidden', 'مجوز مدیریت افزونه‌ها را ندارید.', 403);
        }
        if ($args['action'] === 'delete') {
            if ((defined('DISALLOW_FILE_MODS') && DISALLOW_FILE_MODS) || !wp_is_file_mod_allowed('yagent_plugin_management')) {
                return self::error('yagent_file_mods_disabled', 'تغییر فایل افزونه‌ها در وردپرس غیرفعال است.', 403);
            }
            if (!user_can($actor, 'delete_plugins')) {
                return self::error('yagent_forbidden', 'مجوز حذف افزونه را ندارید.', 403);
            }
        }
        $protected = ['yagent-ai/yagent-ai.php'];
        if (defined('YAGENT_AI_FILE')) { $protected[] = plugin_basename(YAGENT_AI_FILE); }
        if (in_array($args['plugin'], $protected, true)) {
            return self::error('yagent_plugin_protected', 'این افزونه برای ادامه کار YAgent محافظت شده است.', 403);
        }
        // A second main file in YAgent's own folder must never become a deletion route.
        foreach ($protected as $self) {
            if (str_contains($self, '/') && dirname($self) === dirname($args['plugin'])) {
                return self::error('yagent_plugin_protected', 'پوشه افزونه YAgent محافظت شده است.', 403);
            }
        }
        return true;
    }

    private static function fresh(): void
    {
        foreach (['active_plugins', 'alloptions', 'notoptions'] as $key) { wp_cache_delete($key, 'options'); }
        wp_clean_plugins_cache(false);
        clearstatcache();
    }

    private static function state(string $plugin): array|\WP_Error
    {
        self::fresh();
        // Validate paths before consulting get_plugins(), which follows links while scanning headers.
        $safe = self::safePath($plugin);
        if (is_wp_error($safe)) { return $safe; }
        $plugins = get_plugins();
        if (!isset($plugins[$plugin])) {
            return self::error('yagent_plugin_not_found', 'افزونه نصب‌شده با این نام دقیق فایل پیدا نشد.', 404);
        }
        if (is_plugin_active_for_network($plugin)) {
            return self::error('yagent_plugin_multisite', 'افزونه فعال در شبکه با این ابزار قابل مدیریت نیست.', 403);
        }
        $manifest = self::manifest($plugin);
        if (is_wp_error($manifest)) { return $manifest; }
        $meta = $plugins[$plugin]; $dependencies = []; $unmet = []; $dependents = []; $siblings = [];
        foreach (self::dependencySlugs($meta['RequiresPlugins'] ?? '') as $slug) {
            $matches = [];
            foreach ($plugins as $candidate => $header) {
                if (self::slug($candidate) === $slug) { $matches[$candidate] = is_plugin_active($candidate); }
            }
            ksort($matches, SORT_STRING);
            $dependencies[$slug] = $matches;
            if (!in_array(true, $matches, true)) { $unmet[] = $slug; }
        }
        foreach ($plugins as $candidate => $header) {
            if ($candidate === $plugin) { continue; }
            if (is_plugin_active($candidate) && in_array(self::slug($plugin), self::dependencySlugs($header['RequiresPlugins'] ?? ''), true)) {
                $dependents[] = $candidate;
            }
            if (str_contains($plugin, '/') && dirname($candidate) === dirname($plugin) && is_plugin_active($candidate)) {
                $siblings[] = $candidate;
            }
        }
        sort($dependents, SORT_STRING); sort($siblings, SORT_STRING); ksort($dependencies, SORT_STRING);
        $requiresWp = self::text((string) ($meta['RequiresWP'] ?? '')); $requiresPhp = self::text((string) ($meta['RequiresPHP'] ?? ''));
        $requirementsMet = ($requiresWp === '' || version_compare(get_bloginfo('version'), $requiresWp, '>='))
            && ($requiresPhp === '' || version_compare(PHP_VERSION, $requiresPhp, '>='));
        $state = ['plugin' => $plugin, 'name' => self::text($meta['Name'] ?? ''), 'version' => self::text($meta['Version'] ?? ''),
            'installed' => true, 'active' => is_plugin_active($plugin), 'network_active' => false,
            'network_only' => !empty($meta['Network']), 'requires_wordpress' => $requiresWp, 'requires_php' => $requiresPhp,
            'requirements_met' => $requirementsMet, 'dependencies' => $dependencies, 'unmet_dependencies' => $unmet,
            'active_dependents' => $dependents, 'active_siblings' => $siblings,
            'file_count' => count($manifest['files']), 'total_bytes' => $manifest['bytes'],
            // Keep the exact canonical tree fingerprint, without copying thousands of file rows
            // into the preview, approval, execution result and durable receipt.
            'manifest_sha256' => ToolExecutor::argumentsHash($manifest['files'])];
        try { if (strlen(ToolExecutor::canonical($state)) > 65536) { return self::limit(); } }
        catch (\Throwable $e) { return self::error('yagent_plugin_unsafe_path', 'اطلاعات افزونه برای ثبت امن برنامه معتبر نیست.', 409); }
        return $state;
    }

    private static function safePath(string $plugin): bool|\WP_Error
    {
        $base = realpath(WP_PLUGIN_DIR);
        if ($base === false) { return self::error('yagent_plugin_unsafe_path', 'مسیر امن پوشه افزونه‌ها در دسترس نیست.', 409); }
        $path = rtrim(WP_PLUGIN_DIR, '/\\');
        foreach (explode('/', $plugin) as $segment) {
            $path .= '/' . $segment; clearstatcache(true, $path);
            if (is_link($path)) { return self::error('yagent_plugin_unsafe_path', 'مدیریت افزونه دارای پیوند نمادین مجاز نیست.', 409); }
            if (!file_exists($path)) { return self::error('yagent_plugin_not_found', 'فایل افزونه نصب‌شده پیدا نشد.', 404); }
            $resolved = realpath($path);
            if ($resolved === false || !str_starts_with($resolved, rtrim($base, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR)) {
                return self::error('yagent_plugin_unsafe_path', 'مسیر افزونه در پوشه مجاز نیست.', 409);
            }
        }
        if (!is_file($path)) { return self::error('yagent_plugin_not_found', 'فایل افزونه نصب‌شده پیدا نشد.', 404); }
        return true;
    }

    private static function target(string $plugin): string
    {
        return rtrim(WP_PLUGIN_DIR, '/\\') . '/' . (str_contains($plugin, '/') ? dirname($plugin) : $plugin);
    }

    private static function manifest(string $plugin): array|\WP_Error
    {
        $target = self::target($plugin); $files = []; $bytes = 0; $entries = 0;
        $root = realpath(WP_PLUGIN_DIR);
        $add = static function (string $path) use (&$files, &$bytes, &$entries, $root): bool|\WP_Error {
            $entries++; clearstatcache(true, $path);
            if ($entries > self::MAX_ENTRIES) { return self::limit(); }
            if (is_link($path)) { return self::error('yagent_plugin_unsafe_path', 'افزونه دارای پیوند نمادین است؛ عملیات متوقف شد.', 409); }
            $resolved = realpath($path);
            if ($root === false || $resolved === false || !str_starts_with($resolved, rtrim($root, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR)) {
                return self::error('yagent_plugin_unsafe_path', 'مسیر فایل افزونه امن نیست.', 409);
            }
            if (is_dir($path)) { return true; }
            if (!is_file($path) || !is_readable($path)) {
                return self::error('yagent_plugin_unsafe_path', 'خواندن امن همه فایل‌های افزونه ممکن نیست.', 409);
            }
            $size = @filesize($path);
            if (!is_int($size) || $size < 0 || $size > self::MAX_FILE_BYTES || count($files) >= self::MAX_FILES || $bytes + $size > self::MAX_TOTAL_BYTES) { return self::limit(); }
            $hash = @hash_file('sha256', $path);
            if (!is_string($hash)) { return self::error('yagent_plugin_unsafe_path', 'بررسی یکپارچگی فایل افزونه ممکن نشد.', 409); }
            clearstatcache(true, $path);
            if (is_link($path) || @filesize($path) !== $size) { return self::error('yagent_plugin_unsafe_path', 'فایل افزونه هنگام بررسی تغییر کرد؛ دوباره برنامه‌ریزی کنید.', 409); }
            $relative = substr($resolved, strlen(rtrim($root, DIRECTORY_SEPARATOR)) + 1);
            if (!preg_match('//u', $relative)) { return self::error('yagent_plugin_unsafe_path', 'نام فایل افزونه قابل بررسی نیست.', 409); }
            $files[$relative] = ['bytes' => $size, 'sha256' => $hash]; $bytes += $size;
            return true;
        };
        try {
            $result = $add($target);
            if (is_wp_error($result)) { return $result; }
            if (is_dir($target)) {
                $iterator = new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($target, \FilesystemIterator::SKIP_DOTS), \RecursiveIteratorIterator::SELF_FIRST);
                foreach ($iterator as $item) {
                    $result = $add($item->getPathname());
                    if (is_wp_error($result)) { return $result; }
                }
            }
        } catch (\Throwable $e) {
            return self::error('yagent_plugin_unsafe_path', 'بررسی کامل و امن فایل‌های افزونه ممکن نشد.', 409);
        }
        ksort($files, SORT_STRING);
        return ['files' => $files, 'bytes' => $bytes];
    }

    private static function dependencySlugs(string $header): array
    {
        $slugs = [];
        foreach (explode(',', $header) as $raw) {
            $slug = apply_filters('wp_plugin_dependencies_slug', trim($raw));
            if (is_string($slug) && preg_match('/\A[a-z0-9]+(?:-[a-z0-9]+)*\z/D', $slug)) { $slugs[] = $slug; }
        }
        $slugs = array_values(array_unique($slugs)); sort($slugs, SORT_STRING);
        return $slugs;
    }

    private static function slug(string $plugin): string
    {
        if ($plugin === 'hello.php') { return 'hello-dolly'; }
        return str_contains($plugin, '/') ? dirname($plugin) : substr($plugin, 0, -4);
    }

    private static function summary(array $args, array $before): array
    {
        return ['action' => $args['action'], 'plugin' => $args['plugin'], 'name' => $before['name'], 'version' => $before['version'],
            'installed' => $args['action'] !== 'delete', 'active' => $args['action'] === 'activate', 'network_active' => false];
    }

    private static function directFilesystem(bool $initialize): bool|\WP_Error
    {
        require_once ABSPATH . 'wp-admin/includes/file.php';
        if (get_filesystem_method([], WP_PLUGIN_DIR, false) !== 'direct' || get_filesystem_method() !== 'direct'
            || ($initialize && (!WP_Filesystem(false, WP_PLUGIN_DIR) || !($GLOBALS['wp_filesystem'] instanceof \WP_Filesystem_Direct)))) {
            return self::error('yagent_plugin_filesystem', 'حذف مستقیم فایل افزونه در این میزبان در دسترس نیست؛ عملیات انجام نشد.', 409);
        }
        return true;
    }

    private static function text(string $value): string
    {
        $value = substr(wp_strip_all_tags($value), 0, 200);
        while ($value !== '' && !preg_match('//u', $value)) { $value = substr($value, 0, -1); }
        return $value;
    }
    private static function limit(): \WP_Error { return self::error('yagent_plugin_snapshot_limit', 'حجم یا تعداد فایل افزونه برای بررسی امن بیش از حد مجاز است.', 409); }
    private static function error(string $code, string $message, int $status): \WP_Error { return new \WP_Error($code, $message, ['status' => $status]); }
}
