<?php
namespace YAgent;
if (!defined('ABSPATH')) { exit; }

final class Plugin
{
    public static function activate(bool $networkWide = false): void
    {
        if ($networkWide || is_multisite()) {
            wp_die('نسخه بتای YAgent فعلاً از وردپرس شبکه پشتیبانی نمی‌کند.','YAgent AI',['response'=>400,'back_link'=>true]);
        }
        try{self::migrate();}catch(\Throwable $e){wp_die('ساخت جدول YAgent انجام نشد؛ مجوز دیتابیس را بررسی کنید.','YAgent AI',['response'=>500,'back_link'=>true]);}
    }

    public function boot(): void
    {
        Artifacts\Deployment::registerProbe();
        try{self::migrate();}catch(\Throwable $e){add_action('admin_notices',static function():void{echo '<div class="notice notice-error"><p>YAgent: ارتقای دیتابیس انجام نشد؛ مجوز ساخت جدول را بررسی کنید.</p></div>';});return;}
        $core=new Core();$settings=$core->settings;
        $chat = new Chat($settings, new Transport(), new RequestGuard(),$core->gateway);
        $rest=new Rest($settings, $chat);$rest->register();
        (new RestV2($core,[$rest,'permission']))->register();
        (new Admin())->register();
        do_action('yagent_ai_core_ready', $this);
    }
    private static function migrate():void
    {
        if(get_option('yagent_ai_schema')!=='2'){(new Infrastructure\Store())->install();update_option('yagent_ai_schema','2',false);}
        update_option('yagent_ai_version',YAGENT_AI_VERSION,false);
    }
}
