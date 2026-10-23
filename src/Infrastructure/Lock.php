<?php
namespace YAgent\Infrastructure;
if (!defined('ABSPATH')) { exit; }

final class Lock
{
    public function acquire(string $name,int $ttl=120):string|\WP_Error
    {
        $key='yagent_ai_v2_lock_'.hash('sha256',$name);
        wp_cache_delete($key,'options');wp_cache_delete('notoptions','options');$old=get_option($key);
        if(is_array($old)&&($old['expires']??0)<time())$this->delete($key,$old);
        $token=wp_generate_uuid4();
        if(!add_option($key,['token'=>$token,'expires'=>time()+max(5,min(300,$ttl))],'',false))return new \WP_Error('yagent_busy','عملیات دیگری در حال اجرا است؛ وضعیت را بازخوانی کنید.',['status'=>409]);
        return $token;
    }
    public function release(string $name,string $token):void
    {
        $key='yagent_ai_v2_lock_'.hash('sha256',$name);wp_cache_delete($key,'options');$value=get_option($key);
        if(is_array($value)&&hash_equals((string)($value['token']??''),$token))$this->delete($key,$value);
    }
    private function delete(string $name,array $value):void
    {
        global $wpdb;$wpdb->delete($wpdb->options,['option_name'=>$name,'option_value'=>maybe_serialize($value)],['%s','%s']);wp_cache_delete($name,'options');wp_cache_delete('notoptions','options');
    }
}
