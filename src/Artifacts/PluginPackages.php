<?php
namespace YAgent\Artifacts;
use YAgent\Infrastructure\{Store,Lock};
if (!defined('ABSPATH')) { exit; }

/** Builds private, validated source ZIPs; deployment is a separate policy-controlled step. */
final class PluginPackages
{
    public function __construct(private Store $store) {}

    public static function normalize(array $args): array|\WP_Error
    {
        $bad=static fn()=>new \WP_Error('yagent_package_invalid','بسته باید slug معتبر، فایل اصلی هم‌نام دارای Plugin Name، و ۱ تا ۲۰ فایل متنی مجاز داشته باشد؛ هر فایل حداکثر ۶۴ و مجموع ۱۲۸ کیلوبایت.',['status'=>400]);
        if(array_diff(array_keys($args),['slug','files','auto_install']) || (array_key_exists('auto_install',$args)&&!is_bool($args['auto_install'])) || !is_string($args['slug']??null)
            || !preg_match('/^[a-z][a-z0-9-]{1,59}$/D',$args['slug']) || $args['slug']==='yagent-ai'
            || !is_array($args['files']??null) || !array_is_list($args['files']) || count($args['files'])<1 || count($args['files'])>20)return $bad();
        $seen=[];$total=0;$entry=null;
        foreach($args['files'] as$file){
            if(!is_array($file)||array_diff(array_keys($file),['path','content'])||count($file)!==2||!is_string($file['path']??null)||!is_string($file['content']??null))return $bad();
            $path=$file['path'];$text=$file['content'];$parts=explode('/',$path);$base=array_pop($parts);
            if(strlen($path)>150||!preg_match('/^[A-Za-z0-9][A-Za-z0-9_-]*(?:\.[A-Za-z0-9_-]+)*\.(php|css|js|json|txt|md|html)$/iD',$base))return $bad();
            foreach($parts as$part)if(!preg_match('/^[A-Za-z0-9][A-Za-z0-9_-]*$/D',$part))return $bad();
            $lower=strtolower($path);if(isset($seen[$lower]))return $bad();$seen[$lower]=true;
            if(str_contains($text,"\0")||!preg_match('//u',$text)||strlen($text)>65536)return $bad();
            $total+=strlen($text);if($total>131072)return $bad();
            if(str_ends_with($lower,'.php')){
                if(!preg_match('/^<\?php\s/',$text)||!function_exists('token_get_all'))return $bad();
                try{token_get_all($text,TOKEN_PARSE);}catch(\Throwable $e){return new \WP_Error('yagent_package_php','خطای نحوی PHP در فایل '.$path.'؛ کد اجرا نشده است.',['status'=>400,'file'=>$path]);}
            }elseif(stripos($text,'<?')!==false)return $bad();
            if($path===$args['slug'].'.php'){
                if(!preg_match('/^[ \t\/*#@]*Plugin Name:[ \t]*(.+)$/mi',substr($text,0,8192),$match)||trim(sanitize_text_field($match[1]))==='')return $bad();
                $entry=$path;
            }
        }
        if($entry===null)return $bad();
        usort($args['files'],static fn($a,$b)=>strcmp($a['path'],$b['path']));
        return $args;
    }

    public function create(array $args,int $owner,string $actionId):array|\WP_Error
    {
        if(!$this->allowed($owner))return $this->forbidden();
        $args=self::normalize($args);if(is_wp_error($args))return $args;
        // A deployment instruction is not part of the ZIP or its source identity.
        unset($args['auto_install']);
        $id=hash('sha256',$owner.'|package|'.$actionId);$hash=hash('sha256',wp_json_encode($args));
        $lock=new Lock();$token=$lock->acquire('package:'.$id);if(is_wp_error($token))return $token;
        try{
            $old=$this->store->get('plugin_artifact',$id,$owner);
            if(!is_wp_error($old))return hash_equals($old['data']['source_hash'],$hash)?$this->metadata($old):new \WP_Error('yagent_action_conflict','شناسه ساخت به فایل‌های دیگری تعلق دارد.',['status'=>409]);
            if($old->get_error_code()!=='yagent_not_found')return $old;
            $zip=self::zip($args);$manifest=[];
            foreach($args['files']as$f)$manifest[]=['path'=>$args['slug'].'/'.$f['path'],'size'=>strlen($f['content']),'sha256'=>hash('sha256',$f['content'])];
            $r=$this->store->create('plugin_artifact',$owner,['slug'=>$args['slug'],'files'=>$args['files'],'source_hash'=>$hash,'manifest'=>$manifest,'sha256'=>hash('sha256',$zip),'size'=>strlen($zip),'validation'=>['php_syntax'=>'passed_on_'.PHP_VERSION,'executed'=>false,'security_audited'=>false]],$id);
            return is_wp_error($r)?$r:$this->metadata($r);
        }finally{$lock->release('package:'.$id,$token);}
    }
    public function listing(int $owner):array|\WP_Error
    {
        if(!$this->allowed($owner))return $this->forbidden();
        return array_map([$this,'metadata'],$this->store->listing('plugin_artifact',$owner,100));
    }
    public function download(string $id,int $owner):array|\WP_Error
    {
        if(!$this->allowed($owner))return $this->forbidden();
        $r=$this->store->get('plugin_artifact',$id,$owner);if(is_wp_error($r))return $r;
        $zip=self::zip($r['data']);
        if(!hash_equals($r['data']['sha256'],hash('sha256',$zip)))return new \WP_Error('yagent_package_integrity','یکپارچگی بسته تأیید نشد.',['status'=>409]);
        return $this->metadata($r)+['content_base64'=>base64_encode($zip),'mime_type'=>'application/zip'];
    }
    public function delete(string $id,int $owner):bool|\WP_Error
    {
        if(!$this->allowed($owner))return $this->forbidden();
        return $this->store->delete('plugin_artifact',$id,$owner);
    }
    public function metadata(array $r):array
    {
        $d=$r['data'];return ['artifact_id'=>$r['id'],'filename'=>$d['slug'].'.zip','slug'=>$d['slug'],'manifest'=>$d['manifest'],'sha256'=>$d['sha256'],'size'=>$d['size'],'created_at'=>$r['created_at'],'validation'=>$d['validation'],'installed'=>false,'activated'=>false];
    }
    /** ZIP STORE entries: no extension, subprocess, temporary files or public URLs. */
    private static function zip(array $args):string
    {
        $body='';$central='';$count=0;
        foreach($args['files']as$f){
            $name=$args['slug'].'/'.$f['path'];$text=$f['content'];$len=strlen($text);$crc=crc32($text);$offset=strlen($body);$n=strlen($name);
            $body.=pack('VvvvvvVVVvv',0x04034b50,20,0,0,0,33,$crc,$len,$len,$n,0).$name.$text;
            $central.=pack('VvvvvvvVVVvvvvvVV',0x02014b50,20,20,0,0,0,33,$crc,$len,$len,$n,0,0,0,0,0,$offset).$name;$count++;
        }
        return $body.$central.pack('VvvvvVVv',0x06054b50,0,0,$count,$count,strlen($central),strlen($body),0);
    }
    private function allowed(int $owner):bool{return $owner>0&&user_can($owner,'manage_options')&&user_can($owner,'install_plugins');}
    private function forbidden():\WP_Error{return new \WP_Error('yagent_forbidden','مجوز دسترسی به بسته افزونه را ندارید.',['status'=>403]);}
}
