<?php
namespace YAgent;
use YAgent\Agent\{Tasks,ToolRegistry};
use YAgent\Infrastructure\Lock;
if (!defined('ABSPATH')) { exit; }

final class RestV2
{
    public function __construct(private Core $core,private $permission){}
    public function register():void{add_action('rest_api_init',[$this,'routes']);}
    public function routes():void
    {
        $routes=['config'=>['GET','POST'],'conversations'=>['GET','POST'],'conversations/(?P<id>[A-Za-z0-9_-]{1,64})'=>['GET','POST','DELETE'],'conversations/(?P<id>[A-Za-z0-9_-]{1,64})/clear'=>['POST'],'templates'=>['GET','POST'],'templates/(?P<id>[A-Za-z0-9_-]{1,64})'=>['GET','POST','DELETE'],'tasks'=>['GET','POST'],'tasks/(?P<id>[A-Za-z0-9_-]{1,64})'=>['GET'],'tasks/(?P<id>[A-Za-z0-9_-]{1,64})/(?P<action>step|cancel)'=>['POST'],'approvals'=>['GET'],'approvals/(?P<id>[A-Za-z0-9_-]{1,64})'=>['GET'],'approvals/(?P<id>[A-Za-z0-9_-]{1,64})/decision'=>['POST'],'receipts/(?P<id>[A-Za-z0-9_-]{1,64})/rollback'=>['POST'],'tools'=>['GET'],'usage'=>['GET'],'export'=>['GET'],'health'=>['POST']];
        foreach($routes as$path=>$methods)register_rest_route('yagent/v1','/v2/'.$path,['methods'=>$methods,'permission_callback'=>$this->permission,'callback'=>[$this,'dispatch']]);
        foreach(['assistant/consumption'=>['GET','POST'],'models'=>['GET'],'uploads'=>['POST'],'uploads/(?P<id>[A-Za-z0-9_-]{1,64})'=>['GET','DELETE'],'assistant/settings'=>['GET','POST'],'requests/(?P<id>[A-Za-z0-9_-]{1,64})'=>['GET'],'artifacts'=>['GET'],'artifacts/(?P<id>[A-Za-z0-9_-]{1,64})'=>['DELETE'],'artifacts/(?P<id>[A-Za-z0-9_-]{1,64})/download'=>['GET']]as$path=>$methods)register_rest_route('yagent/v1','/v2/'.$path,['methods'=>$methods,'permission_callback'=>$this->permission,'callback'=>[$this,'dispatch']]);
    }
    public function dispatch(\WP_REST_Request $r):\WP_REST_Response|\WP_Error
    {
        $b=[];if($r->get_method()==='POST'&&!str_ends_with($r->get_route(),'/uploads')){$b=$this->input($r);if(is_wp_error($b))return $b;}
        try{$data=$this->handle($r,$b);}catch(\Throwable $e){return $this->error('storage_unavailable','دسترسی به داده‌ها کامل نشد؛ وضعیت درخواست را پیش از تکرار بررسی کنید.',503);}
        if(is_wp_error($data))return $data;$response=new \WP_REST_Response($data,200);$response->header('Cache-Control','private, no-store, max-age=0');return $response;
    }
    private function handle(\WP_REST_Request $r,array $b):array|\WP_Error
    {
        $c=$this->core;$owner=get_current_user_id();$id=(string)($r['id']??'');$method=$r->get_method();$path=substr($r->get_route(),strlen('/yagent/v1/v2/'));$root=explode('/',$path)[0];
        if($root==='requests'){$task=$c->tasks->get(hash('sha256',$owner.'|'.$id),$owner);return is_wp_error($task)?$task:Tasks::publicRecord($task);}
        if($root==='models')return (new Providers\Discovery($c->settings,$c->store))->models((string)($r->get_param('provider')??$c->settings->publicData()['active_provider']),$r->get_param('refresh')==='true');
        if($root==='uploads'){
            $uploads=new Attachments($c->store);
            if($method==='GET')return $uploads->metadata($id,$owner);
            if($method==='DELETE'){$deleted=$uploads->delete($id,$owner);return is_wp_error($deleted)?$deleted:['deleted'=>$deleted];}
            return $uploads->upload($owner,$r->get_file_params()['file']??[]);
        }
        if($root==='assistant'&&str_ends_with($r->get_route(),'/consumption')){
            if($method==='GET')return AI\ConsumptionMode::read();
            if(array_diff(array_keys($b),['enabled','consent'])||!is_bool($b['enabled']??null)||(isset($b['consent'])&&!is_bool($b['consent'])))return $this->error('invalid_request','تنظیم مصرف معتبر نیست.');
            return AI\ConsumptionMode::save($b['enabled'],$b['consent']??false,$owner);
        }
        if($root==='assistant'){
            $setup=new AssistantSetup($c->settings,$c->config);$provider=$r->get_param('provider')??$c->settings->publicData()['active_provider'];
            return $method==='POST'?$setup->save($b):(is_string($provider)?$setup->read($provider):$this->error('invalid_provider','سرویس معتبر نیست.'));
        }
        if($root==='artifacts'){
            $packages=new Artifacts\PluginPackages($c->store);
            if(!$id){$items=$packages->listing($owner);return is_wp_error($items)?$items:['items'=>$items];}
            if($method==='DELETE'){$deleted=$packages->delete($id,$owner);return is_wp_error($deleted)?$deleted:['deleted'=>$deleted];}
            return $packages->download($id,$owner);
        }
        if(in_array($root,['conversations','templates'],true))foreach(['title','prompt']as$key)if(array_key_exists($key,$b)&&!is_string($b[$key]))return $this->error('invalid_request','عنوان و متن باید رشته باشند.');
        if($root==='config')return $method==='GET'?$c->config->get():$c->config->save($b);
        if($root==='conversations'){
            if(!$id)return $method==='GET'?['items'=>$c->conversations->listing($owner)]:$c->conversations->create($owner,$b['title']??'گفت‌وگوی جدید');
            $record=$c->conversations->get($id,$owner);if(is_wp_error($record))return $record;if($method==='GET')return $record+['usage'=>$c->usage->summary($owner,$id)];
            $id=$record['id'];
            $lock=new Lock();$token=$lock->acquire('conversation:'.$id);if(is_wp_error($token))return $token;
            try{
                $record=$c->conversations->get($id,$owner);if(is_wp_error($record))return $record;
                if(($method==='DELETE'||str_ends_with($path,'/clear'))&&$this->conversationBusy($record))return $this->error('conversation_busy','ابتدا کار ناتمام گفتگو را لغو یا تمام کنید.',409);
                if($method==='DELETE'){$deleted=$c->conversations->delete($id,$owner);return is_wp_error($deleted)?$deleted:['deleted'=>$deleted];}
                return str_ends_with($path,'/clear')?$c->conversations->clear($id,$owner):$c->conversations->rename($id,$owner,$b['title']??'');
            }finally{$lock->release('conversation:'.$id,$token);}
        }
        if($root==='templates'){
            if(!$id)return $method==='GET'?['items'=>$c->templates->listing($owner)]:$c->templates->create($owner,$b['title']??'',$b['prompt']??'');
            if($method==='GET')return $c->templates->get($id,$owner);
            if($method==='DELETE'){$deleted=$c->templates->delete($id,$owner);return is_wp_error($deleted)?$deleted:['deleted'=>$deleted];}
            return $c->templates->save($id,$owner,$b['title']??'',$b['prompt']??'');
        }
        if($root==='tasks'){
            if(!$id){
                if($method==='GET')return ['items'=>array_map([Tasks::class,'publicRecord'],$c->tasks->listing($owner))];
                if(array_diff(array_keys($b),['prompt','attachments','conversation_id','profile_id','mode','thinking','read_only','allow_powerful','request_id','provider','tier'])||!is_string($b['prompt']??null))return $this->error('invalid_task','فیلدهای کار معتبر نیست.');
                $options=$b;unset($options['prompt']);$task=$c->tasks->create($owner,$b['prompt'],$options);
            }elseif(($r['action']??'')==='step')$task=$c->runner->step($id,$owner);
            elseif(($r['action']??'')==='cancel'){$task=$c->tasks->cancel($id,$owner);if(!is_wp_error($task)){$finished=$c->runner->step($id,$owner);if(!is_wp_error($finished))$task=$finished;}}
            else $task=$c->tasks->get($id,$owner);
            return is_wp_error($task)?$task:Tasks::publicRecord($task);
        }
        if($root==='approvals'){
            if(!$id)return ['items'=>$c->store->listing('approval',$owner,100)];
            return $method==='GET'?$c->store->get('approval',$id,$owner):$this->decision($id,$owner,$b);
        }
        if($root==='receipts'){
            if(($b['confirm']??null)!==true)return $this->error('confirmation_required','بازگردانی به تأیید صریح نیاز دارد.');
            if($c->config->get()['read_only'])return $this->error('read_only','بازگردانی در حالت فقط‌خواندنی غیرفعال است.',403);
            $receipt=$c->store->get('tool_receipt',$id,$owner);if(is_wp_error($receipt))return $receipt;return $c->executor->rollback(['receipt_id'=>$id],$owner);
        }
        if($root==='tools')return ['items'=>ToolRegistry::available($c->config->get()['read_only'],$owner)];
        if($root==='usage'){
            $conv=$r->get_param('conversation_id');if($conv!==null){if(!is_string($conv))return $this->error('invalid_request','شناسه گفتگو معتبر نیست.');$record=$c->conversations->get($conv,$owner);if(is_wp_error($record))return $record;}
            $site=$c->usage->summary(0);$savedLimits=$c->config->get()['budgets'];$limits=AI\ConsumptionMode::enabled()?array_fill_keys(array_keys($savedLimits),null):$savedLimits;$warnings=[];
            foreach(['daily'=>['by_day',gmdate('Y-m-d')],'monthly'=>['by_month',gmdate('Y-m')]]as$period=>$window){
                $totals=$site[$window[0]][$window[1]]??[];
                foreach(['usd'=>'estimated_cost_usd','requests'=>'requests']as$kind=>$field){$cap=$limits[$period.'_'.$kind];$used=$totals[$field]??null;if($cap!==null&&$cap>0&&$used!==null&&$used/$cap>=0.8)$warnings[]=['period'=>$period,'limit'=>$kind,'used'=>$used,'cap'=>$cap,'message'=>'مصرف ثبت‌شده به ۸۰٪ سقف یا بیشتر رسیده است.'];}
            }
            return ['site'=>$site,'personal'=>$c->usage->summary($owner,$conv),'limits'=>$limits,'saved_limits'=>$savedLimits,'open_consumption'=>AI\ConsumptionMode::enabled(),'warnings'=>$warnings];
        }
        if($root==='export')return $this->export((string)($r->get_param('format')??'json'),$owner);
        if($root==='health')return $this->health($owner,$b);
        return $this->error('not_found','مسیر پیدا نشد.',404);
    }
    private function decision(string $id,int $owner,array $b):array|\WP_Error
    {
        $c=$this->core;$a=$c->store->get('approval',$id,$owner);if(is_wp_error($a))return $a;
        if(!is_string($b['plan_hash']??null)||!hash_equals($a['data']['plan_hash'],$b['plan_hash']))return $this->error('plan_mismatch','پیش‌نمایش عملیات تغییر کرده است؛ دوباره بررسی کنید.',409);
        if(!is_string($b['decision']??null)||!in_array($b['decision'],['approve','reject','cancel'],true))return $this->error('invalid_decision','تصمیم معتبر نیست.');
        $taskId=$a['data']['task_id'];$lock=new Lock();$token=$lock->acquire('task:'.$taskId);if(is_wp_error($token))return $token;
        try{
            $task=$c->tasks->get($taskId,$owner);if(is_wp_error($task))return $task;$d=$task['data'];
            if(!is_wp_error($c->store->get('task_cancel',$taskId,$owner))||in_array($d['status'],Tasks::TERMINAL,true))return $this->error('task_closed','این کار پایان یافته یا لغو شده است.',409);
            if(!\YAgent\AI\ConsumptionMode::enabled()&&min($d['deadline'],$d['started_at']+$c->config->get()['task_limits']['max_seconds'])<=time())return $this->error('task_timeout','مهلت کار تمام شده است.',409);
            if(!in_array($id,$d['approval_ids'],true)||$d['status']!=='awaiting_approval')return $this->error('approval_state','این عملیات منتظر تأیید این کار نیست.',409);
            return $c->approvals->decide($id,$owner,$b['decision'],$d['read_only']||$c->config->get()['read_only']);
        }finally{$lock->release('task:'.$taskId,$token);}
    }
    private function health(int $owner,array $b):array|\WP_Error
    {
        foreach(['profile_id','provider','thinking']as$key)if(isset($b[$key])&&!is_string($b[$key]))return $this->error('invalid_request','گزینه آزمایش معتبر نیست.');
        $selection=$this->core->gateway->select('Connection health check',$b+['legacy'=>empty($b['profile_id'])]);if(is_wp_error($selection))return $selection;
        $guard=new RequestGuard();$token=$guard->acquire($owner);if(is_wp_error($token))return $token;$start=microtime(true);
        try{$result=$this->core->gateway->request($selection,[['role'=>'user','content'=>'Reply with a short greeting.']],$owner,['purpose'=>'health','task_id'=>wp_generate_uuid4(),'max_output_tokens'=>64,'thinking'=>$b['thinking']??'auto']);}finally{$guard->release($owner,$token);}
        $errorData=is_wp_error($result)?$result->get_error_data():[];
        $data=['checked_at'=>gmdate('c'),'duration_ms'=>(int)round((microtime(true)-$start)*1000),'provider'=>$selection['provider'],'model'=>$selection['model'],'profile_id'=>$selection['profile_id'],'connection_verified'=>!is_wp_error($result),'tools_verified'=>false,'thinking_requested'=>$b['thinking']??'auto','thinking_verified'=>false,'error'=>is_wp_error($result)?$result->get_error_code():null,'usage_record_id'=>is_wp_error($result)?(is_array($errorData)?($errorData['usage_record_id']??null):null):$result['usage_record_id']];
        $id=hash('sha256',$owner.'|'.$selection['provider'].'|'.$selection['model']);$old=$this->core->store->get('health',$id,$owner);$saved=is_wp_error($old)?$this->core->store->create('health',$owner,$data,$id):$this->core->store->update('health',$id,$old['version'],$data);return is_wp_error($saved)?$saved:$data;
    }
    private function export(string $format,int $owner):array|\WP_Error
    {
        if(!in_array($format,['json','csv'],true))return $this->error('invalid_format','فرمت باید json یا csv باشد.');$records=$this->core->usage->export($owner);if(is_wp_error($records))return $records;
        $usage=array_map(static fn(array $row):array=>['event_type'=>'usage','id'=>$row['id'],'user_id'=>$row['owner']]+$row['data'],$records);
        $operations=[];
        foreach($this->core->store->listing('tool_receipt',$owner,200)as$receipt){$d=$receipt['data'];$operations[]=['event_type'=>'tool','id'=>$receipt['id'],'user_id'=>$receipt['owner'],'action_id'=>$d['action_id']??'','tool'=>$d['tool']??'','status'=>$d['status']??'','rollback_status'=>$d['rollback_status']??null,'created_at'=>$receipt['created_at'],'updated_at'=>$receipt['updated_at']];}
        $rows=array_merge($usage,$operations);
        if($format==='json')$content=wp_json_encode(['version'=>YAGENT_AI_VERSION,'timezone'=>'UTC','usage'=>$usage,'operations'=>$operations],JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE);
        else{$stream=fopen('php://temp','r+');$columns=[];foreach($rows as$row)foreach(array_keys($row)as$key)$columns[$key]=true;$keys=$columns?array_keys($columns):['id','user_id','provider','model','status','created_at'];fputcsv($stream,$keys);foreach($rows as$row){$safe=[];foreach($keys as$key){$v=$row[$key]??'';if(is_array($v)||is_object($v))$v=wp_json_encode($v);if(is_string($v)&&preg_match('/^[=+@\\-\\t\\r]/',$v))$v="'".$v;$safe[]=$v;}fputcsv($stream,$safe);}rewind($stream);$content=stream_get_contents($stream);fclose($stream);}
        return ['filename'=>'yagent-report-'.gmdate('Ymd-His').'.'.$format,'format'=>$format,'content'=>$content,'limit'=>10000,'truncated'=>count($usage)>=10000,'operations_limit'=>200,'operations_truncated'=>count($operations)>=200];
    }
    private function conversationBusy(array $r):bool{$id=$r['data']['active_task_id']??'';if(!$id)return false;$t=$this->core->tasks->get($id,$r['owner']);return !is_wp_error($t)&&!in_array($t['data']['status'],Tasks::TERMINAL,true);}
    private function input(\WP_REST_Request $r):array|\WP_Error
    {
        if(strlen($r->get_body())>180000)return $this->error('request_too_large','اندازه درخواست بیش از حد مجاز است.',413);
        $o=json_decode($r->get_body());$b=$r->get_json_params();return is_object($o)&&is_array($b)?$b:$this->error('invalid_request','بدنه درخواست باید شیء JSON باشد.');
    }
    private function error(string $c,string $m,int $s=400):\WP_Error{return new \WP_Error('yagent_'.$c,$m,['status'=>$s]);}
}
