<?php
/** Remove only YAgent's own settings and metadata on explicit plugin deletion. */
if (!defined('WP_UNINSTALL_PLUGIN')) { exit; }
$yagent_cleanup = static function (): void {
    global $wpdb;
    delete_option('yagent_ai_settings');
    delete_option('yagent_ai_events');
    delete_option('yagent_ai_version');
    delete_option('yagent_ai_open_consumption');delete_option('yagent_ai_schema');delete_option('yagent_ai_consumption');
    $wpdb->query("DROP TABLE IF EXISTS {$wpdb->prefix}yagent_records");
    $pattern = $wpdb->esc_like('yagent_ai_lock_') . '%';
    $names = $wpdb->get_col($wpdb->prepare("SELECT option_name FROM {$wpdb->options} WHERE option_name LIKE %s",$pattern));
    foreach ($names as $name) { delete_option($name); }
    $pattern = $wpdb->esc_like('yagent_ai_v2_lock_') . '%';
    $names = $wpdb->get_col($wpdb->prepare("SELECT option_name FROM {$wpdb->options} WHERE option_name LIKE %s",$pattern));
    foreach ($names as $name) { delete_option($name); }
    delete_metadata('user',0,'yagent_ai_rate','',true);
};
// Network installs are deliberately unsupported in this beta; clean the current site only.
$yagent_cleanup();
unset($yagent_cleanup);
