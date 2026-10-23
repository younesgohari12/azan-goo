<?php
namespace YAgent\Artifacts;
use YAgent\AI\Config;
use YAgent\Infrastructure\{Store,Lock};
if (!defined('ABSPATH')) { exit; }

/** New generated packages only. WordPress plugin activation executes PHP, without isolation. */
final class Deployment
{
    private const TERMINAL=['active_verified','failed','failed_deactivated','needs_review'];
    public function __construct(private Store $store) {}
    public static function id(string $action,int $owner):string{return hash('sha256',$owner.'|deployment|'.$action);}

    public static function policy(array $args,int $owner,bool $readOnly):bool|\WP_Error
    {
        // A long-running model/tool worker must observe revocation from another request,
        // including sites using WordPress's default request-local object cache.
        wp_cache_delete(Config::OPTION,'options');
        wp_cache_delete('alloptions','options');
        wp_cache_delete('notoptions','options');
        $cfg=(new Config())->get();$ro=$readOnly||$cfg['read_only'];
        $requested=$args['auto_install']??($cfg['auto_install_plugins']&&!$ro);
        if(!$requested)return false;
        if($ro)return new \WP_Error('yagent_read_only','در حالت فقط خواندنی نصب و فعال‌سازی افزونه مجاز نیست.',['status'=>403]);
        if(!$cfg['auto_install_plugins'])return new \WP_Error('yagent_deployment_disabled','مدیر سایت نصب خودکار افزونه‌های ساخته‌شده را فعال نکرده است.',['status'=>403]);
        if($owner>0)clean_user_cache($owner);
        wp_roles()->for_site();
        $actor=$owner>0?get_userdata($owner):false;
        if(!$actor||!user_can($actor,'manage_options')||!user_can($actor,'install_plugins')||!user_can($actor,'activate_plugins'))return new \WP_Error('yagent_forbidden','مجوز نصب و فعال‌سازی افزونه را ندارید.',['status'=>403]);
        if(is_multisite())return new \WP_Error('yagent_deployment_multisite','نصب خودکار در وردپرس شبکه پشتیبانی نمی‌شود.',['status'=>403]);
        if((defined('DISALLOW_FILE_MODS')&&DISALLOW_FILE_MODS)||!wp_is_file_mod_allowed('yagent_generated_plugins'))return new \WP_Error('yagent_file_mods_disabled','تغییر فایل افزونه‌ها در وردپرس غیرفعال است.',['status'=>403]);
        return true;
    }

    public static function artifactOnly(array $artifact):array
    {
        return array_replace($artifact,['status'=>'artifact_only','installed'=>false,'activated'=>false,'health_verified'=>false,'plugin_file'=>null,'deployment'=>[
            'status'=>'artifact_only','installed'=>false,'activated'=>false,'health_verified'=>false,'plugin_file'=>null,
            'events'=>[['stage'=>'build','status'=>'completed','message'=>'بسته افزونه آماده دانلود است؛ نصب خودکار انجام نشد.','at'=>gmdate('c')]],
        ]]);
    }

    public function deploy(array $artifact,int $owner,string $action,bool $readOnly=false):array|\WP_Error
    {
        $id=self::id($action,$owner);$existing=$this->store->get('plugin_deployment',$id,$owner);
        if(!is_wp_error($existing)){
            if(($existing['data']['artifact']['artifact_id']??null)!==$artifact['artifact_id']||($existing['data']['artifact']['sha256']??null)!==$artifact['sha256'])return new \WP_Error('yagent_action_conflict','شناسه نصب به بسته دیگری تعلق دارد.',['status'=>409]);
            return $this->recover($action,$owner);
        }
        if($existing->get_error_code()!=='yagent_not_found')return $existing;
        $row=$this->store->create('plugin_deployment',$owner,[
            'action_id'=>$action,'artifact'=>$artifact,'plugin_file'=>$artifact['slug'].'/'.$artifact['slug'].'.php',
            'status'=>'building','installed'=>false,'activated'=>false,'health_verified'=>false,'owns_target'=>false,
            'activation_started'=>false,'health_token_hash'=>null,'health_expires_at'=>0,'events'=>[],
        ],$id);
        if(is_wp_error($row))return $row;
        $guard=(object)['armed'=>true,'row'=>$row,'temp'=>null,'stage'=>null,'buffer'=>ob_get_level(),'reserve'=>str_repeat('x',131072)];
        $lock=new Lock();$lockToken=null;
        // exit(), fatal errors and a terminated activation can bypass finally. Leave the target inactive
        // and a durable failed receipt whenever shutdown still has working PHP/DB resources.
        register_shutdown_function(function()use($guard,$owner,$action,$lock,&$lockToken):void{
            if(!$guard->armed)return;$guard->reserve='';
            while(ob_get_level()>$guard->buffer)@ob_end_clean();
            try{$this->failure($guard->row,'yagent_deployment_interrupted','نصب یا فعال‌سازی متوقف شد؛ افزونه غیرفعال شد و نتیجه را بررسی کنید.');$this->fallbackReceipt($guard->row,$owner,$action);}catch(\Throwable $ignored){}
            if(is_string($guard->temp)&&is_file($guard->temp))@unlink($guard->temp);
            $this->cleanStage($guard->stage);
            if(is_string($lockToken))try{$lock->release('generated-plugin-deployment',$lockToken);}catch(\Throwable $ignored){}
        });
        try{
            $this->event($guard->row,'build','completed','بسته ZIP ساخته و یکپارچگی آن ثبت شد.');
            $lockToken=$lock->acquire('generated-plugin-deployment',120);
            if(is_wp_error($lockToken))return $this->failure($guard->row,'yagent_deployment_busy','نصب افزونه دیگری در حال اجرا است؛ این بسته نصب نشد.');
            $allowed=self::policy(['auto_install'=>true],$owner,$readOnly);
            if(is_wp_error($allowed))return $this->failure($guard->row,$allowed->get_error_code(),$allowed->get_error_message());
            require_once ABSPATH.'wp-admin/includes/file.php';
            require_once ABSPATH.'wp-admin/includes/plugin.php';
            $target=WP_PLUGIN_DIR.'/'.$artifact['slug'];
            clearstatcache(true,$target);
            if(file_exists($target)||is_link($target))return $this->failure($guard->row,'yagent_deployment_conflict','پوشه‌ای با این نام از قبل وجود دارد؛ هیچ فایل موجودی جایگزین نشد.');
            if(get_filesystem_method([],WP_PLUGIN_DIR,false)!=='direct'||!WP_Filesystem(false,WP_PLUGIN_DIR)||!($GLOBALS['wp_filesystem'] instanceof \WP_Filesystem_Direct))return $this->failure($guard->row,'yagent_deployment_filesystem','نصب مستقیم فایل‌ها در این میزبان در دسترس نیست؛ بسته آماده دانلود است.');
            $download=(new PluginPackages($this->store))->download($artifact['artifact_id'],$owner);
            if(is_wp_error($download)||!hash_equals($artifact['sha256'],$download['sha256']))return $this->failure($guard->row,'yagent_deployment_integrity','یکپارچگی بسته ساخته‌شده تأیید نشد؛ نصب انجام نشد.');
            $zip=base64_decode($download['content_base64'],true);
            if(!is_string($zip)||!hash_equals($artifact['sha256'],hash('sha256',$zip)))return $this->failure($guard->row,'yagent_deployment_integrity','یکپارچگی بسته ساخته‌شده تأیید نشد؛ نصب انجام نشد.');
            $guard->temp=wp_tempnam('yagent-generated-'.$artifact['slug'].'.zip');
            if(!$guard->temp||file_put_contents($guard->temp,$zip)!==strlen($zip))return $this->failure($guard->row,'yagent_deployment_filesystem','نوشتن فایل موقت بسته انجام نشد.');
            @chmod($guard->temp,0600);
            $this->event($guard->row,'install','running','نصب بسته ساخته‌شده در یک پوشه تازه آغاز شد.');
            // Core's ordinary upgrader permits empty destinations and uses overwrite-capable
            // copies. Extract privately, then reserve the final folder and every file exclusively.
            $guard->stage=wp_tempnam('yagent-generated-stage');
            if(!$guard->stage||!@unlink($guard->stage)||!@mkdir($guard->stage,0700))return $this->failure($guard->row,'yagent_deployment_filesystem','ساخت پوشه موقت نصب انجام نشد.');
            $extracted=unzip_file($guard->temp,$guard->stage);
            if(is_wp_error($extracted)||$extracted!==true||!$this->manifestMatches($artifact,$guard->stage))return $this->failure($guard->row,'yagent_deployment_install','استخراج یا تطبیق فایل‌های بسته کامل نشد؛ افزونه فعال نشد.');
            $allowed=self::policy(['auto_install'=>true],$owner,$readOnly);
            if(is_wp_error($allowed))return $this->failure($guard->row,$allowed->get_error_code(),$allowed->get_error_message());
            if(!@mkdir($target,0700))return $this->failure($guard->row,'yagent_deployment_conflict','پوشه افزونه از قبل وجود دارد یا قابل ایجاد نیست؛ هیچ فایل موجودی جایگزین نشد.');
            $guard->row['data']['owns_target']=true;
            $this->event($guard->row,'install','running','پوشه تازه به این استقرار اختصاص یافت؛ فایل‌ها بدون جایگزینی نوشته می‌شوند.');
            if(!$this->copyExclusive($artifact,$guard->stage,$target)||!$this->manifestMatches($artifact))return $this->failure($guard->row,'yagent_deployment_install','نوشتن یا تطبیق فایل‌های تازه کامل نشد؛ افزونه فعال نشد.');
            wp_clean_plugins_cache(false);$guard->row['data']['installed']=true;
            $this->event($guard->row,'install','completed','فایل‌های افزونه تازه نصب و با بسته ساخته‌شده تطبیق داده شدند.');
            $allowed=self::policy(['auto_install'=>true],$owner,$readOnly);
            if(is_wp_error($allowed))return $this->failure($guard->row,$allowed->get_error_code(),$allowed->get_error_message());
            $guard->row['data']['activation_started']=true;
            $this->event($guard->row,'activate','running','فعال‌سازی افزونه در وردپرس آغاز شد.');
            $base=ob_get_level();$displayErrors=ini_get('display_errors');@ini_set('display_errors','0');ob_start();$output='';
            try{$activation=activate_plugin($guard->row['data']['plugin_file'],'',false,false);}
            finally{while(ob_get_level()>$base){$output=(string)ob_get_clean().$output;}@ini_set('display_errors',(string)$displayErrors);}
            if(is_wp_error($activation)||$output!==''||!$this->active($guard->row['data']['plugin_file']))return $this->failure($guard->row,'yagent_deployment_activation','فعال‌سازی افزونه موفق نبود یا خروجی غیرمنتظره داشت؛ افزونه غیرفعال شد.');
            $guard->row['data']['activated']=true;
            $this->event($guard->row,'activate','completed','وردپرس فعال بودن افزونه را ثبت کرد.');
            $allowed=self::policy(['auto_install'=>true],$owner,$readOnly);
            if(is_wp_error($allowed))return $this->failure($guard->row,$allowed->get_error_code(),$allowed->get_error_message());
            $healthToken=bin2hex(random_bytes(32));$guard->row['data']['health_token_hash']=hash('sha256',$healthToken);$guard->row['data']['health_expires_at']=time()+60;
            $guard->row['data']['status']='verifying';
            $this->event($guard->row,'verify','running','بررسی راه‌اندازی وردپرس در یک درخواست مستقل آغاز شد.');
            $url=admin_url('admin-post.php?action=yagent_deployment_health');
            if(!$this->sameSite($url))return $this->failure($guard->row,'yagent_deployment_health','نشانی بررسی به همین سایت تعلق ندارد؛ افزونه غیرفعال شد.');
            $response=wp_remote_post($url,['timeout'=>10,'redirection'=>0,'blocking'=>true,'sslverify'=>true,'limit_response_size'=>4096,'headers'=>['X-YAgent-Health'=>$healthToken,'Cache-Control'=>'no-store'],'body'=>['deployment_id'=>$id],'cookies'=>[]]);
            $body=is_wp_error($response)?null:json_decode(wp_remote_retrieve_body($response),true);
            $proof=hash_hmac('sha256',$id.'|'.$guard->row['data']['plugin_file'],$healthToken);
            $fresh=$this->store->get('plugin_deployment',$id,$owner);
            if(!is_wp_error($fresh))$guard->row=$fresh;
            $allowed=self::policy(['auto_install'=>true],$owner,$readOnly);
            if(is_wp_error($allowed))return $this->failure($guard->row,$allowed->get_error_code(),$allowed->get_error_message());
            if(is_wp_error($response)||wp_remote_retrieve_response_code($response)!==200||!is_array($body)||($body['yagent_deployment_health']??null)!==1||($body['deployment_id']??null)!==$id||($body['plugin_file']??null)!==$guard->row['data']['plugin_file']||($body['active']??null)!==true||!is_string($body['proof']??null)||!hash_equals($proof,$body['proof'])||empty($guard->row['data']['health_consumed'])||!$this->active($guard->row['data']['plugin_file']))return $this->failure($guard->row,'yagent_deployment_health','راه‌اندازی مستقل وردپرس تأیید نشد؛ افزونه غیرفعال شد.');
            $guard->row['data']['health_verified']=true;$guard->row['data']['status']='active_verified';$guard->row['data']['health_token_hash']=null;$guard->row['data']['health_expires_at']=0;
            $this->event($guard->row,'verify','completed','راه‌اندازی مستقل وردپرس با افزونه فعال تأیید شد.');
            return $this->result($guard->row);
        }catch(\Throwable $e){
            return $this->failure($guard->row,'yagent_deployment_exception','نصب یا فعال‌سازی به خطا رسید؛ وضعیت غیرفعال بودن افزونه بررسی شد.');
        }finally{
            $guard->armed=false;$guard->reserve='';
            if(is_string($guard->temp)&&is_file($guard->temp))@unlink($guard->temp);
            $this->cleanStage($guard->stage);
            if(is_string($lockToken))$lock->release('generated-plugin-deployment',$lockToken);
        }
    }

    /** Authenticates a one-use deployment-specific probe after a complete WordPress bootstrap. */
    public function health(string $id,string $token):array|\WP_Error
    {
        $forbidden=static fn()=>new \WP_Error('yagent_health_forbidden','درخواست بررسی معتبر نیست.',['status'=>403]);
        if(!preg_match('/^[a-f0-9]{64}$/D',$id)||!preg_match('/^[a-f0-9]{64}$/D',$token))return $forbidden();
        $row=$this->store->get('plugin_deployment',$id);
        if(is_wp_error($row))return $forbidden();$data=$row['data'];
        if(is_wp_error(self::policy(['auto_install'=>true],$row['owner'],false)))return $forbidden();
        if(($data['status']??null)!=='verifying'||empty($data['owns_target'])||!is_string($data['health_token_hash']??null)||!hash_equals($data['health_token_hash'],hash('sha256',$token))||($data['health_expires_at']??0)<time()||!$this->active($data['plugin_file']))return $forbidden();
        $entry=realpath(WP_PLUGIN_DIR.'/'.$data['plugin_file']);
        if($entry===false||!in_array($entry,array_map('realpath',get_included_files()),true))return $forbidden();
        $data['health_token_hash']=null;$data['health_expires_at']=0;$data['health_consumed']=true;
        $saved=$this->store->update('plugin_deployment',$id,$row['version'],$data);if(is_wp_error($saved))return $forbidden();
        return ['yagent_deployment_health'=>1,'deployment_id'=>$id,'plugin_file'=>$data['plugin_file'],'active'=>true,'proof'=>hash_hmac('sha256',$id.'|'.$data['plugin_file'],$token)];
    }

    public static function registerProbe():void
    {
        $handler=static function():void{
            nocache_headers();
            if(($_SERVER['REQUEST_METHOD']??'')!=='POST'){wp_send_json(['error'=>'forbidden'],403);}
            $id=$_POST['deployment_id']??null;$token=$_SERVER['HTTP_X_YAGENT_HEALTH']??null;
            if(!is_string($id)||!is_string($token)){wp_send_json(['error'=>'forbidden'],403);}
            try{$result=(new self(new Store()))->health($id,$token);}catch(\Throwable $e){$result=new \WP_Error('yagent_health_forbidden');}
            wp_send_json(is_wp_error($result)?['error'=>'forbidden']:$result,is_wp_error($result)?403:200);
        };
        add_action('admin_post_yagent_deployment_health',$handler);
        add_action('admin_post_nopriv_yagent_deployment_health',$handler);
    }

    /** Never restart a partially completed deployment or reactivate on a replay. */
    public function recover(string $action,int $owner):array|\WP_Error
    {
        $row=$this->store->get('plugin_deployment',self::id($action,$owner),$owner);
        if(is_wp_error($row))return $row;
        if(in_array($row['data']['status'],self::TERMINAL,true))return $this->result($row);
        return $this->failure($row,'yagent_deployment_interrupted','اجرای قبلی نیمه‌تمام ماند؛ افزونه غیرفعال شد و دوباره اجرا نمی‌شود.');
    }

    public function progress(string $action,int $owner):?array
    {
        $row=$this->store->get('plugin_deployment',self::id($action,$owner),$owner);
        return is_wp_error($row)?null:$this->publicData($row);
    }

    private function failure(array &$row,string $code,string $message):array
    {
        $d=&$row['data'];$started=!empty($d['activation_started']);$inactive=true;
        if(!empty($d['owns_target'])){
            try{require_once ABSPATH.'wp-admin/includes/plugin.php';deactivate_plugins($d['plugin_file'],true,false);$inactive=!$this->active($d['plugin_file']);}catch(\Throwable $e){$inactive=false;}
        }
        $d['activated']=!$inactive;$d['health_verified']=false;$d['health_token_hash']=null;$d['health_expires_at']=0;
        $d['status']=$inactive?($started?'failed_deactivated':'failed'):'needs_review';$d['deactivation_verified']=$started&&$inactive;
        $d['error']=['code'=>sanitize_key($code),'message'=>$inactive?$message:'غیرفعال بودن افزونه تأیید نشد؛ وضعیت افزونه را دستی بررسی کنید.'];
        $this->event($row,$started?'deactivate':'deploy','failed',$d['error']['message']);
        return $this->result($row);
    }

    private function event(array &$row,string $stage,string $status,string $message):void
    {
        $row['data']['events'][]=['stage'=>$stage,'status'=>$status,'message'=>$message,'at'=>gmdate('c')];
        $row['data']['events']=array_slice($row['data']['events'],-20);
        if(!in_array($row['data']['status'],self::TERMINAL,true)&&$row['data']['status']!=='verifying')$row['data']['status']=$stage==='activate'?'activating':($stage==='install'?'installing':'building');
        $saved=$this->store->update('plugin_deployment',$row['id'],$row['version'],$row['data']);
        if(is_wp_error($saved))throw new \RuntimeException('Deployment receipt write failed');$row=$saved;
    }

    private function result(array $row):array
    {
        $d=$this->publicData($row);
        return array_replace($row['data']['artifact'],['status'=>$d['status'],'installed'=>$d['installed'],'activated'=>$d['activated'],'health_verified'=>$d['health_verified'],'plugin_file'=>$d['plugin_file'],'deployment'=>$d]);
    }

    private function publicData(array $row):array
    {
        $data=$row['data'];$safe=array_intersect_key($data,array_flip(['status','installed','activated','health_verified','plugin_file','events','error','deactivation_verified']));
        return ['deployment_id'=>$row['id']]+$safe;
    }

    private function fallbackReceipt(array $row,int $owner,string $action):void
    {
        $receipt=$this->store->get('tool_receipt',\YAgent\Agent\ToolExecutor::receiptId($action),$owner);
        if(is_wp_error($receipt)||($receipt['data']['tool']??null)!=='build_plugin'||($receipt['data']['action_id']??null)!==$action||($receipt['data']['status']??null)==='executed')return;
        $data=$receipt['data'];$data['status']='executed';$data['result']=$this->result($row);
        $this->store->update('tool_receipt',$receipt['id'],$receipt['version'],$data);
    }

    private function active(string $file):bool
    {
        require_once ABSPATH.'wp-admin/includes/plugin.php';
        wp_cache_delete('active_plugins','options');wp_cache_delete('alloptions','options');
        return is_plugin_active($file);
    }

    /** Copy only validated manifest entries, refusing even empty existing targets. */
    private function copyExclusive(array $artifact,string $stage,string $target):bool
    {
        $made=[$target=>true];
        foreach($artifact['manifest']as$file){
            $relative=substr($file['path'],strlen($artifact['slug'])+1);$parts=explode('/',$relative);$name=array_pop($parts);$parent=$target;
            foreach($parts as$part){
                $parent.='/'.$part;
                if(!isset($made[$parent])){if(!@mkdir($parent,0700))return false;$made[$parent]=true;}
                if(is_link($parent))return false;
            }
            if(is_link($target))return false;
            $content=file_get_contents($stage.'/'.$file['path']);
            if(!is_string($content)||strlen($content)!==$file['size']||!hash_equals($file['sha256'],hash('sha256',$content)))return false;
            $handle=@fopen($parent.'/'.$name,'xb');if($handle===false)return false;
            try{$written=fwrite($handle,$content);if($written!==strlen($content))return false;}
            finally{fclose($handle);}
            @chmod($parent.'/'.$name,defined('FS_CHMOD_FILE')?FS_CHMOD_FILE:0644);
        }
        foreach(array_keys($made)as$dir)@chmod($dir,defined('FS_CHMOD_DIR')?FS_CHMOD_DIR:0755);
        return true;
    }

    private function cleanStage(?string $stage):void
    {
        if($stage!==null&&is_dir($stage)&&!is_link($stage)&&isset($GLOBALS['wp_filesystem'])&&$GLOBALS['wp_filesystem'] instanceof \WP_Filesystem_Direct)$GLOBALS['wp_filesystem']->delete($stage,true);
    }

    private function manifestMatches(array $artifact,?string $base=null):bool
    {
        $base=$base??WP_PLUGIN_DIR;$root=realpath($base);$target=$base.'/'.$artifact['slug'];
        if(!$root||is_link($target)||realpath($target)!==$root.'/'.$artifact['slug'])return false;
        foreach($artifact['manifest']as$file){
            $path=$base.'/'.$file['path'];$relative=explode('/',$file['path']);$parent=$base;
            foreach($relative as$part){$parent.='/'.$part;if(is_link($parent))return false;}
            if(!is_file($path)||filesize($path)!==$file['size']||!hash_equals($file['sha256'],hash_file('sha256',$path)))return false;
        }
        return true;
    }

    private function sameSite(string $url):bool
    {
        $site=wp_parse_url(site_url('/'));$probe=wp_parse_url($url);
        return is_array($site)&&is_array($probe)&&empty($probe['user'])&&empty($probe['pass'])&&in_array($probe['scheme']??null,['http','https'],true)&&strtolower($site['host']??'')===strtolower($probe['host']??'')&&($site['scheme']??null)===($probe['scheme']??null)&&($site['port']??null)===($probe['port']??null);
    }
}
