<?php
namespace YAgent;
if (!defined('ABSPATH')) { exit; }

final class Admin
{
    public function register(): void
    {
        add_action('admin_menu',[$this,'menu']);
        add_action('admin_enqueue_scripts',[$this,'assets']);
    }
    public function menu(): void
    {
        add_menu_page('YAgent AI','YAgent AI','manage_options','yagent-ai',[$this,'render'],'dashicons-format-chat',58);
        add_submenu_page('yagent-ai','گفتگو با YAgent','گفتگو','manage_options','yagent-ai',[$this,'render']);
        add_submenu_page('yagent-ai','تنظیمات و مدیریت YAgent','تنظیمات و مدیریت','manage_options','yagent-ai-settings',[$this,'settings']);
    }
    public function assets(string $hook): void
    {
        if ($hook==='toplevel_page_yagent-ai') {
            wp_enqueue_style('yagent-ai-workspace-host',plugins_url('assets/workspace/host.css',YAGENT_AI_FILE),[],YAGENT_AI_VERSION);
            return;
        }
        if ($hook!=='yagent-ai_page_yagent-ai-settings') { return; }
        wp_enqueue_style('yagent-ai-admin',plugins_url('assets/admin.css',YAGENT_AI_FILE),[],YAGENT_AI_VERSION);
        wp_enqueue_script('yagent-ai-admin',plugins_url('assets/admin.js',YAGENT_AI_FILE),[],YAGENT_AI_VERSION,true);
        wp_add_inline_script('yagent-ai-admin','window.YAgentUI = '.wp_json_encode(['rest'=>esc_url_raw(rest_url('yagent/v1/')),'nonce'=>wp_create_nonce('wp_rest')]).';','before');
        wp_enqueue_style('yagent-ai-activity',plugins_url('assets/activity.css',YAGENT_AI_FILE),['yagent-ai-admin'],YAGENT_AI_VERSION);
        wp_enqueue_script('yagent-ai-activity',plugins_url('assets/activity.js',YAGENT_AI_FILE),['yagent-ai-admin'],YAGENT_AI_VERSION,true);
        wp_enqueue_script('yagent-ai-chat-agent',plugins_url('assets/chat-agent.js',YAGENT_AI_FILE),['yagent-ai-admin','yagent-ai-activity'],YAGENT_AI_VERSION,true);
        wp_enqueue_style('yagent-ai-backend',plugins_url('assets/backend.css',YAGENT_AI_FILE),[],YAGENT_AI_VERSION);
        wp_enqueue_script('yagent-ai-backend',plugins_url('assets/backend.js',YAGENT_AI_FILE),['yagent-ai-admin'],YAGENT_AI_VERSION,true);
    }
    public function render(): void
    {
        if (!current_user_can('manage_options')) { wp_die('دسترسی مجاز نیست.'); }
        require dirname(__DIR__).'/views/workspace.php';
    }
    public function settings(): void
    {
        if (!current_user_can('manage_options')) { wp_die('دسترسی مجاز نیست.'); }
        require dirname(__DIR__).'/views/admin.php';
        require dirname(__DIR__).'/views/backend.php';
    }
}
