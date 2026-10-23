<?php
if (!defined('ABSPATH')) { exit; }
$user = wp_get_current_user();
$base = plugins_url('assets/workspace/', YAGENT_AI_FILE);
$boot = wp_json_encode([
    'rest' => esc_url_raw(rest_url('yagent/v1/')),
    'nonce' => wp_create_nonce('wp_rest'),
    'userId' => get_current_user_id(),
    'userName' => $user->display_name,
    'siteName' => get_bloginfo('name'),
    'settingsUrl' => admin_url('admin.php?page=yagent-ai-settings'),
    'dashboardUrl' => admin_url(),
    'version' => YAGENT_AI_VERSION,
], JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT);
ob_start();
?>
<!doctype html>
<html lang="fa" dir="rtl">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
    <meta name="color-scheme" content="dark">
    <title>YAgent — دستیار وردپرس</title>
    <link rel="stylesheet" href="<?php echo esc_url($base . 'css/fonts.css'); ?>">
    <link rel="stylesheet" href="<?php echo esc_url($base . 'css/app.css'); ?>?ver=<?php echo esc_attr(YAGENT_AI_VERSION); ?>">
    <link rel="stylesheet" href="<?php echo esc_url($base . 'css/workspace.css'); ?>?ver=<?php echo esc_attr(YAGENT_AI_VERSION); ?>">
    <script>window.YAgentUI = <?php echo $boot; // JSON is HEX encoded above. ?>;</script>
</head>
<body>
    <div id="root"><p class="startup" role="status">در حال آماده‌سازی YAgent…</p></div>
    <noscript>برای استفاده از دستیار، جاوااسکریپت مرورگر را فعال کنید.</noscript>
    <script type="module" src="<?php echo esc_url($base . 'js/app.js'); ?>?ver=<?php echo esc_attr(YAGENT_AI_VERSION); ?>"></script>
</body>
</html>
<?php $document = ob_get_clean(); ?>
<div id="yagent-workspace-host">
    <iframe id="yagent-workspace-frame" title="محیط گفتگو و کارهای YAgent" srcdoc="<?php echo esc_attr($document); ?>" allow="fullscreen; clipboard-write" allowfullscreen></iframe>
</div>
