<?php
namespace YAgent\AI;
if (!defined('ABSPATH')) { exit; }

/** Separate explicit receipt: advanced JSON cannot silently opt a site into open spending. */
final class ConsumptionMode
{
    public const OPTION='yagent_ai_open_consumption';
    public static function enabled():bool
    {
        $r=get_option(self::OPTION,[]);
        return is_array($r)&&($r['enabled']??null)===true&&($r['notice_version']??null)===1
            &&is_int($r['accepted_by']??null)&&$r['accepted_by']>0&&is_string($r['accepted_at']??null);
    }
    public static function read():array
    {
        $r=get_option(self::OPTION,[]);
        return ['enabled'=>self::enabled(),'accepted_by'=>is_array($r)?($r['accepted_by']??null):null,'accepted_at'=>is_array($r)?($r['accepted_at']??null):null,'notice_version'=>1];
    }
    public static function save(bool $enabled,bool $consent,int $owner):array|\WP_Error
    {
        if(!current_user_can('manage_options')||!user_can($owner,'manage_options'))return new \WP_Error('yagent_forbidden','مجوز تنظیم مصرف را ندارید.',['status'=>403]);
        if($enabled&&!self::enabled()&&!$consent)return new \WP_Error('yagent_consumption_consent','برای مصرف بدون سقف داخلی، پذیرش هزینه سرویس لازم است.',['status'=>400]);
        $r=self::read();$r['enabled']=$enabled;
        if($enabled&&!self::enabled()){$r['accepted_by']=$owner;$r['accepted_at']=gmdate('c');}
        update_option(self::OPTION,$r,false);
        if(get_option(self::OPTION)!==$r)return new \WP_Error('yagent_consumption_write','ذخیره حالت مصرف انجام نشد.',['status'=>503]);
        return self::read();
    }
}
