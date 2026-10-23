<?php
namespace YAgent;
use YAgent\AI\Config;
use YAgent\Infrastructure\Lock;
if (!defined('ABSPATH')) { exit; }

/** Small ordinary controls over the same advanced policy, with no tariff guesses. */
final class AssistantSetup
{
    public function __construct(private Settings $settings,private Config $config){}
    public function read(string $provider):array|\WP_Error
    {
        if(!isset(Providers\Catalog::all()[$provider]))return $this->invalid();
        $connection=$this->settings->publicData()['providers'][$provider];$cfg=$this->config->get();$profileId=null;$profile=null;
        foreach($cfg['models']as$id=>$candidate)if($candidate['provider']===$provider&&$candidate['model']===$connection['model']){$profileId=$id;$profile=$candidate;break;}
        return ['provider'=>$provider,'model'=>$connection['model'],'profile_id'=>$profileId,'supports_tools'=>$profile['supports_tools']??false,'allow_writes'=>!$cfg['read_only'],'auto_install_plugins'=>$cfg['auto_install_plugins'],'tools_verified'=>false,'effective_max_output_tokens'=>\YAgent\AI\ConsumptionMode::enabled()?null:min($connection['max_tokens'],$cfg['memory']['max_output_tokens']),'manual_max_output_tokens'=>min($connection['max_tokens'],$cfg['memory']['max_output_tokens']),'context_tokens'=>$cfg['memory']['context_tokens'],'open_consumption'=>\YAgent\AI\ConsumptionMode::enabled(),'capabilities'=>(new Providers\Discovery($this->settings,new \YAgent\Infrastructure\Store()))->forModel($provider,$connection['model'])];
    }
    public function save(array $input):array|\WP_Error
    {
        if(array_diff(array_keys($input),['provider','supports_tools','allow_writes','max_output_tokens','auto_install_plugins'])||!is_string($input['provider']??null)||!is_bool($input['supports_tools']??null)||!is_bool($input['allow_writes']??null)||(array_key_exists('auto_install_plugins',$input)&&!is_bool($input['auto_install_plugins'])))return $this->invalid();
        if(isset($input['max_output_tokens'])&&(!is_int($input['max_output_tokens'])||$input['max_output_tokens']<64||$input['max_output_tokens']>1000000))return $this->invalid();
        $lock=new Lock();$token=$lock->acquire('assistant-setup');if(is_wp_error($token))return $token;
        try{
            $current=$this->read($input['provider']);if(is_wp_error($current))return $current;
            if($current['model']==='')return $this->invalid();
            $cfg=$this->config->get();$id=$current['profile_id']??'chat_'.$input['provider'];
            $profile=$current['profile_id']!==null?$cfg['models'][$id]:['provider'=>$input['provider'],'model'=>$current['model'],'input_price'=>null,'output_price'=>null,'supports_tools'=>false,'thinking_kind'=>'none','thinking_levels'=>[]];
            $profile['supports_tools']=$input['supports_tools'];$cfg['models'][$id]=$profile;$cfg['read_only']=!$input['allow_writes'];
            if(array_key_exists('auto_install_plugins',$input))$cfg['auto_install_plugins']=$input['auto_install_plugins'];
            if(isset($input['max_output_tokens'])){
                if($input['max_output_tokens']>=$cfg['memory']['context_tokens'])return new \WP_Error('yagent_context_limit','سقف خروجی باید کمتر از ظرفیت زمینه در تنظیمات مصرف باشد.',['status'=>400]);
                $cfg['memory']['max_output_tokens']=$input['max_output_tokens'];
            }
            $saved=$this->config->save($cfg);return is_wp_error($saved)?$saved:$this->read($input['provider']);
        }finally{$lock->release('assistant-setup',$token);}
    }
    private function invalid():\WP_Error{return new \WP_Error('yagent_assistant_settings','تنظیمات ابزار و اجازه تغییر معتبر نیست؛ ابتدا سرویس و مدل را ذخیره کنید.',['status'=>400]);}
}
