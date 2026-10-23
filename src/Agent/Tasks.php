<?php
namespace YAgent\Agent;
use YAgent\Settings;
use YAgent\AI\{Config,Gateway};
use YAgent\Infrastructure\{Store,Lock};
use YAgent\Memory\Conversations;
if (!defined('ABSPATH')) { exit; }

final class Tasks
{
    public const TERMINAL=['completed','failed','cancelled','needs_review'];
    public function __construct(private Store $store,private Config $config,private Settings $settings,private Gateway $gateway,private Conversations $conversations){}
    public function create(int $owner,string $prompt,array $options=[]):array|\WP_Error
    {
        if(!user_can($owner,'manage_options'))return $this->error('forbidden','مجوز اجرای کار را ندارید.',403);
        if(trim($prompt)===''||strlen($prompt)>(\YAgent\AI\ConsumptionMode::enabled()?131072:64000)||!preg_match('//u',$prompt)||str_contains($prompt,"\0"))return $this->error('invalid_prompt','متن درخواست معتبر نیست یا بسیار طولانی است.');
        foreach(['profile_id','conversation_id','request_id','thinking','mode','provider','tier']as$key)if(isset($options[$key])&&!is_string($options[$key]))return $this->error('invalid_task','گزینه کار معتبر نیست.');
        foreach(['read_only','allow_powerful']as$key)if(isset($options[$key])&&!is_bool($options[$key]))return $this->error('invalid_task','گزینه کار معتبر نیست.');
        if(isset($options['attachments'])){
            if(!is_array($options['attachments'])||!array_is_list($options['attachments'])||count($options['attachments'])>20)return $this->error('invalid_attachment','فهرست پیوست معتبر نیست.');
            $uploads=new \YAgent\Attachments($this->store);$seen=[];
            foreach($options['attachments']as$upload){if(!is_string($upload)||isset($seen[$upload]))return $this->error('invalid_attachment','شناسه پیوست معتبر نیست.');$meta=$uploads->metadata($upload,$owner);if(is_wp_error($meta))return $meta;$seen[$upload]=true;}
        }
        $mode=$options['mode']??'agent';if(!in_array($mode,['agent','chat'],true))return $this->error('invalid_task','حالت کار معتبر نیست.');
        $requestId=$options['request_id']??wp_generate_uuid4();if(!preg_match('/^[A-Za-z0-9_-]{1,64}$/D',$requestId))return $this->error('invalid_task','شناسه درخواست معتبر نیست.');
        $requestOptions=$options;unset($requestOptions['request_id']);ksort($requestOptions);$requestHash=hash('sha256',wp_json_encode([$prompt,$requestOptions]));
        $id=hash('sha256',$owner.'|'.$requestId);$existing=$this->store->get('task',$id,$owner);
        if(!is_wp_error($existing))return ($existing['data']['request_hash']??'')===$requestHash?$existing:$this->error('conflict','این شناسه برای درخواست دیگری استفاده شده است.',409);
        $selection=$this->gateway->select($prompt,array_replace($options,['requires_tools'=>$mode==='agent']));if(is_wp_error($selection))return $selection;
        $connection=$this->settings->connection($selection['provider']);if(is_wp_error($connection))return $connection;
        $conversationId=$options['conversation_id']??'';
        if($conversationId===''){$c=$this->conversations->create($owner);if(is_wp_error($c))return $c;$conversationId=$c['id'];}
        $canonical=$this->conversations->get($conversationId,$owner);if(is_wp_error($canonical))return $canonical;$conversationId=$canonical['id'];
        $lock=new Lock();$token=$lock->acquire('conversation:'.$conversationId);if(is_wp_error($token))return $token;
        try{
            $conversation=$this->conversations->get($conversationId,$owner);if(is_wp_error($conversation))return $conversation;
            $active=$conversation['data']['active_task_id']??'';
            if($active){$other=$this->get($active,$owner);if(!is_wp_error($other)&&!in_array($other['data']['status'],self::TERMINAL,true))return $this->error('conversation_busy','این گفتگو کار ناتمام دارد؛ ابتدا آن را تمام یا لغو کنید.',409);}
            $safe=array_intersect_key($options,array_flip(['profile_id','allow_powerful','thinking','provider','tier']));$safe['mode']=$mode;
            $data=['request_hash'=>$requestHash,'status'=>'pending','phase'=>'context','prompt'=>$prompt,'conversation_id'=>$conversationId,'options'=>$safe,'selection'=>$selection,'connection_hash'=>self::connectionHash($connection),
              'read_only'=>$this->config->get()['read_only']||($options['read_only']??true),'started_at'=>time(),'deadline'=>time()+$this->config->get()['task_limits']['max_seconds'],
              'model_calls'=>0,'tool_calls'=>0,'transcript'=>[],'pending_tools'=>[],'tool_cursor'=>0,'seen_calls'=>[],'counted_calls'=>[],'results'=>[],'approval_ids'=>[],'usage_ids'=>[],'output'=>'','error'=>null,'context'=>null,'retry_attempt'=>1,'retry_at'=>0];
            $task=$this->store->create('task',$owner,$data,$id);if(is_wp_error($task))return $task;
            $cd=$conversation['data'];$cd['active_task_id']=$id;$saved=$this->store->update('conversation',$conversationId,$conversation['version'],$cd);
            if(is_wp_error($saved)){$data['status']='failed';$this->store->update('task',$id,$task['version'],$data);return $saved;}
            $append=$this->conversations->append($conversationId,$owner,['id'=>$id.'_user','role'=>'user','content'=>$prompt]+(empty($options['attachments'])?[]:['attachments'=>$options['attachments']]));
            if(is_wp_error($append)){$data['status']='failed';$this->store->update('task',$id,$task['version'],$data);return $append;}
            return $task;
        }finally{$lock->release('conversation:'.$conversationId,$token);}
    }
    public static function connectionHash(array $c):string{return hash_hmac('sha256',wp_json_encode([$c['provider'],$c['base_url'],$c['api_key']??'']),wp_salt('auth'));}
    public function get(string $id,int $owner):array|\WP_Error{return $this->store->get('task',$id,$owner);}
    public function listing(int $owner):array{return $this->store->listing('task',$owner,100);}
    public function cancel(string $id,int $owner):array|\WP_Error
    {
        $task=$this->get($id,$owner);if(is_wp_error($task)||in_array($task['data']['status'],self::TERMINAL,true))return $task;
        $id=$task['id'];
        $marker=$this->store->get('task_cancel',$id,$owner);
        if(is_wp_error($marker)){$marker=$this->store->create('task_cancel',$owner,['requested_at'=>time()],$id);if(is_wp_error($marker))return $marker;}
        $task['data']['cancel_requested']=true;return $task;
    }
    public static function publicRecord(array $t):array
    {
        if(($t['data']['phase']??null)==='tools'){
            $call=$t['data']['pending_tools'][$t['data']['tool_cursor']??0]??null;
            if(is_array($call)&&($call['name']??null)==='build_plugin'&&is_string($call['id']??null)){
                $progress=(new \YAgent\Artifacts\Deployment(new Store()))->progress(hash('sha256',$t['id'].'|'.$call['id']),$t['owner']);
                if($progress!==null)$t['data']['deployment_progress']=$progress;
            }
        }
        unset($t['data']['transcript'],$t['data']['selection']['profile'],$t['data']['connection_hash'],$t['data']['seen_calls'],$t['data']['counted_calls']);return $t;
    }
    private function error(string $c,string $m,int $s=400):\WP_Error{return new \WP_Error('yagent_'.$c,$m,['status'=>$s]);}
}
