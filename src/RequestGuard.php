<?php
namespace YAgent;
if (!defined('ABSPATH')) { exit; }

final class RequestGuard
{
    public function acquire(int $userId): string|\WP_Error
    {
        if ($userId<1) { return new \WP_Error('yagent_unauthorized','ورود به حساب مدیر لازم است.',['status'=>401]); }
        $name = 'yagent_ai_lock_'.$userId;
        $old = get_option($name);
        if (is_array($old) && ($old['expires'] ?? 0)<time()) { $this->deleteOwned($name,$old); }
        $token = wp_generate_uuid4();
        if (!add_option($name,['token'=>$token,'expires'=>time()+120],'',false)) { return new \WP_Error('yagent_busy','یک درخواست از این حساب در حال اجراست. تا پایان آن صبر کنید.',['status'=>409]); }
        if(\YAgent\AI\ConsumptionMode::enabled())return $token;
        $rate = get_user_meta($userId,'yagent_ai_rate',true);
        if (!is_array($rate) || ($rate['start']??0)<time()-60) { $rate=['start'=>time(),'count'=>0]; }
        if (($rate['count']??0)>=12) { $this->release($userId,$token); return new \WP_Error('yagent_rate_limit','سقف بتا ۱۲ درخواست در دقیقه برای هر مدیر است. کمی بعد دوباره تلاش کنید.',['status'=>429]); }
        $rate['count']++;
        update_user_meta($userId,'yagent_ai_rate',$rate);
        return $token;
    }

    public function release(int $userId,string $token): void
    {
        $name='yagent_ai_lock_'.$userId; $value=get_option($name);
        if (is_array($value) && hash_equals((string)($value['token']??''),$token)) { $this->deleteOwned($name,$value); }
    }

    private function deleteOwned(string $name,array $value): void
    {
        global $wpdb;
        $wpdb->delete($wpdb->options,['option_name'=>$name,'option_value'=>maybe_serialize($value)],['%s','%s']);
        wp_cache_delete($name,'options');
        wp_cache_delete('notoptions','options');
    }
}
