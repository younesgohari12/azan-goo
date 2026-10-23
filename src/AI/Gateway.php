<?php
namespace YAgent\AI;
use YAgent\Settings;
use YAgent\Transport;
use YAgent\Infrastructure\Store;
use YAgent\Providers\Gemini;
use YAgent\Providers\OpenAICompatible;
use YAgent\Agent\ToolRegistry;
if (!defined('ABSPATH')) { exit; }

/** The only metered, bounded path to a provider. Construction never performs HTTP. */
final class Gateway
{
    private Transport $transport;
    public function __construct(private Settings $settings,private Config $config,private Store $store,?Transport $transport=null)
    { $this->transport=$transport??new Transport(); }

    public function select(string $prompt,array $request=[]): array|\WP_Error
    {
        $config=$this->config->get();
        if (($request['legacy']??false)!==true && (array_key_exists('profile_id',$request) || $config['routing']['enabled'])) { return (new Router($this->config))->select($prompt,$request); }
        $provider=$request['provider']??($this->settings->publicData()['active_provider']??'');
        if (!is_string($provider)) { return $this->error('invalid_provider','سرویس انتخاب‌شده معتبر نیست.'); }
        $connection=$this->settings->connection($provider);
        if (is_wp_error($connection)) { return $connection; }
        $profile=['provider'=>$provider,'model'=>$connection['model'],'input_price'=>null,'output_price'=>null,'supports_tools'=>false,'thinking_kind'=>'none','thinking_levels'=>[]];
        $id=null;
        foreach ($config['models'] as $candidateId=>$candidate) {
            if ($candidate['provider']===$provider && $candidate['model']===$connection['model']) { $profile=$candidate; $id=$candidateId; break; }
        }
        if (($request['requires_tools']??false)===true && ($id===null || !$profile['supports_tools'])) { return $this->error('tools_unsupported','برای اجرای ابزار، یک پروفایل مدل با پشتیبانی صریح ابزار تنظیم کنید.'); }
        return ['profile_id'=>$id,'provider'=>$provider,'model'=>$connection['model'],'reason'=>($request['legacy']??false)===true?'legacy_provider':'saved_connection','profile'=>$profile];
    }

    public function request(array $selection,array $messages,int $userId,array $meta=[],array $tools=[]): array|\WP_Error
    {
        if (!current_user_can('manage_options') || $userId<1 || !user_can($userId,'manage_options')) { return $this->error('forbidden','اجازه استفاده از دستیار را ندارید.',403); }
        $config=$this->config->get();
        $provider=$selection['provider']??null; $model=$selection['model']??null;
        if (!is_string($provider) || !is_string($model) || !preg_match('/^[A-Za-z0-9][A-Za-z0-9._:\/-]{0,199}$/D',$model) || str_contains($model,'..')) { return $this->error('invalid_profile','پروفایل انتخاب‌شده معتبر نیست.'); }
        $connection=$this->settings->connection($provider);
        if (is_wp_error($connection)) { return $connection; }
        $id=$selection['profile_id']??null;
        if ($id!==null) {
            if (!is_string($id) || !isset($config['models'][$id]) || $config['models'][$id]['provider']!==$provider || $config['models'][$id]['model']!==$model) { return $this->error('invalid_profile','پروفایل انتخاب‌شده در تنظیمات وجود ندارد.'); }
            $profile=$config['models'][$id];
        } else {
            if ($model!==$connection['model']) { return $this->error('invalid_profile','مدل انتخاب‌شده در تنظیمات وجود ندارد.'); }
            $profile=['provider'=>$provider,'model'=>$model,'input_price'=>null,'output_price'=>null,'supports_tools'=>false,'thinking_kind'=>'none','thinking_levels'=>[]];
            foreach ($config['models'] as $configuredId=>$candidate) {
                if ($candidate['provider']===$provider && $candidate['model']===$model) { $profile=$candidate; $id=$configuredId; break; }
            }
        }
        $connection['model']=$model;
        if ($id!==null) { $profile['profile_id']=$id; }
        if ($tools && !$profile['supports_tools']) { return $this->error('tools_unsupported','این مدل برای فراخوانی ابزار تنظیم نشده است.'); }
        $tools=$this->declaredTools($tools,(bool)$config['read_only']);
        if (is_wp_error($tools)) { return $tools; }
        if (!array_is_list($messages) || !$messages || (!ConsumptionMode::enabled()&&count($messages)>128)) { return $this->error('invalid_messages','مکالمه باید ۱ تا ۱۲۸ پیام معتبر داشته باشد.'); }
        foreach ($messages as $message) {
            if (!is_array($message) || !is_string($message['content']??'') || !preg_match('//u',$message['content']??'')) { return $this->error('invalid_messages','متن پیام باید UTF-8 معتبر باشد.'); }
        }
        $unrestricted=ConsumptionMode::enabled()&&!array_key_exists('max_output_tokens',$meta);
        $hasAttachments=(bool)array_filter($messages,static fn($message)=>!empty($message['attachments']));
        if(class_exists(\YAgent\Attachments::class)){
            $messages=(new \YAgent\Attachments($this->store))->hydrate($messages,$userId,$connection['protocol']);
            if(is_wp_error($messages))return $messages;
        }
        $maximum=min((int)$connection['max_tokens'],(int)$config['memory']['max_output_tokens']);
        if (array_key_exists('max_output_tokens',$meta)) {
            if (!is_int($meta['max_output_tokens']) || $meta['max_output_tokens']<1) { return $this->error('invalid_limit','سقف خروجی معتبر نیست.'); }
            $maximum=min((int)$connection['max_tokens'],$meta['max_output_tokens']);
        }
        if($unrestricted)$maximum=1000000;
        $connection['max_tokens']=$maximum;
        if (array_key_exists('remaining_seconds',$meta)) {
            if ((!is_int($meta['remaining_seconds']) && !is_float($meta['remaining_seconds'])) || !is_finite((float)$meta['remaining_seconds']) || $meta['remaining_seconds']<10) { return $this->error('time_limit','زمان باقی‌مانده برای درخواست مدل کافی نیست.'); }
            $connection['timeout']=min((int)$connection['timeout'],(int)floor($meta['remaining_seconds']));
        }
        $level=$meta['thinking']??($meta['thinking_level']??'auto');
        if (!is_string($level)) { return $this->error('thinking_unsupported','سطح تفکر معتبر نیست.'); }
        $thinking=Thinking::parameters($profile,$level);
        if (is_wp_error($thinking)) { return $thinking; }
        if (isset($thinking['thinkingConfig']['thinkingBudget']) && $thinking['thinkingConfig']['thinkingBudget']>$maximum) { return $this->error('thinking_budget_limit','سقف توکن تفکر از سقف خروجی این درخواست بیشتر است.'); }
        if (($connection['protocol']==='gemini' && isset($thinking['reasoning_effort'])) || ($connection['protocol']!=='gemini' && isset($thinking['thinkingConfig']))) { return $this->error('thinking_unsupported','پارامتر تفکر با سرویس انتخاب‌شده سازگار نیست.'); }
        $adapter=$connection['protocol']==='gemini'?new Gemini($this->transport):new OpenAICompatible($this->transport);
        $options=['thinking'=>$thinking,'unrestricted_output'=>$unrestricted];
        $body=$adapter->payload($connection,$messages,$tools,$options);
        if (is_wp_error($body)) { return $body; }
        $wire=wp_json_encode($body,JSON_UNESCAPED_UNICODE);
        if (!is_string($wire) || !preg_match('//u',$wire) || strlen($wire)>(($hasAttachments||array_filter($messages,static fn($m)=>!empty($m['media'])))?28*1048576:1048576)) { return $this->error('request_too_large','اندازه درخواست مدل از حد مجاز بیشتر است.'); }
        $inputUpper=strlen($wire)+512;
        $contextUpper=$inputUpper;
        if(array_filter($messages,static fn($m)=>!empty($m['media']))){
            $plain=$messages;$mediaCount=0;
            foreach($plain as&$message){$mediaCount+=count($message['media']??[]);unset($message['media']);}unset($message);
            $textBody=$adapter->payload($connection,$plain,$tools,$options);
            $contextUpper=strlen(wp_json_encode($textBody,JSON_UNESCAPED_UNICODE))+512+$mediaCount*4096;
        }
        if (!ConsumptionMode::enabled()&&$contextUpper+$maximum>min(32000,(int)$config['memory']['context_tokens'])) { return $this->error('context_limit','مکالمه و سقف خروجی از ظرفیت مجاز زمینه بیشتر است؛ مکالمه را کوتاه کنید.'); }
        $taskId=$meta['task_id']??''; $conversationId=$meta['conversation_id']??'';
        $purpose=$meta['purpose']??'chat'; $reason=$selection['reason']??'manual'; $attempt=$meta['attempt']??1;
        foreach ([$taskId,$conversationId,$purpose,$reason] as $value) { if (!is_string($value) || strlen($value)>256 || preg_match('/[\x00-\x1f\x7f]/',$value)) { return $this->error('invalid_metadata','اطلاعات درخواست معتبر نیست.'); } }
        if (!is_int($attempt) || $attempt<1 || $attempt>100) { return $this->error('invalid_metadata','شماره تلاش معتبر نیست.'); }
        $budget=new Budget($this->config,new UsageLedger($this->store),$this->store);
        $reservation=$budget->reserve($profile,$inputUpper,$maximum,$userId,$taskId,$conversationId);
        if (is_wp_error($reservation)) { return $reservation; }
        $start=microtime(true);
        try { $result=$adapter->exchange($connection,$messages,$tools,$options); }
        catch (\Throwable $exception) { $result=$this->error('provider_exception','پردازش پاسخ سرویس انجام نشد؛ وضعیت مصرف را پیش از تلاش بعدی بررسی کنید.',502,['uncertain_billing'=>true]); }
        if (!is_wp_error($result)) {
            $allowed=array_column($tools,'name');
            foreach ($result['tool_calls'] as $call) {
                if (!in_array($call['name'],$allowed,true)) { $result=$this->error('undeclared_tool','مدل ابزاری خارج از فهرست مجاز درخواست کرد.',502,['http_status'=>200,'uncertain_billing'=>true,'usage'=>$result['usage']]); break; }
            }
        }
        $duration=(int)round((microtime(true)-$start)*1000);
        $errorData=is_wp_error($result)?$result->get_error_data():[];
        if (!is_array($errorData)) { $errorData=[]; }
        $uncertain=is_wp_error($result)?!empty($errorData['uncertain_billing']):false;
        $transportUncertain=$uncertain;
        // An HTTP error does not report generation usage. Do not invent zero
        // tokens/cost; retain the reservation until billing can be reconciled.
        $usage=is_wp_error($result)?['input_tokens'=>null,'output_tokens'=>null,'total_tokens'=>null,'thinking_tokens'=>null,'cached_tokens'=>null]:$result['usage'];
        // A valid HTTP200 response can lack visible output while still reporting
        // generation usage. Keep that actual usage instead of inventing an unknown bill.
        if(is_wp_error($result)&&($errorData['http_status']??0)===200&&is_array($errorData['usage']??null)){
            $reported=$errorData['usage'];$valid=true;
            foreach(array_keys($usage)as$key)if(isset($reported[$key])&&(!is_int($reported[$key])||$reported[$key]<0))$valid=false;
            if($valid&&isset($reported['input_tokens'],$reported['output_tokens'])){
                $usage=array_replace($usage,array_intersect_key($reported,$usage));$uncertain=false;$transportUncertain=false;
            }
        }
        $cost=$this->cost($profile,$usage);
        $uncertain=$uncertain || $usage['input_tokens']===null || $usage['output_tokens']===null || $cost===null;
        $entry=$usage+['duration_ms'=>$duration,'status'=>is_wp_error($result)?($transportUncertain?'uncertain':'failed'):'ok','attempt'=>$attempt,'profile_id'=>$id,'purpose'=>$purpose,'source'=>$purpose,'routing_reason'=>$reason,'thinking_level'=>$level,'billing_uncertain'=>$uncertain,'estimated_cost_usd'=>$cost];
        if ($id===null) { unset($entry['profile_id']); }
        if (is_wp_error($result)) { $entry['error_code']=$result->get_error_code(); }
        if (isset($errorData['http_status'])) { $entry['http_status']=(int)$errorData['http_status']; }
        else if (!is_wp_error($result)) { $entry['http_status']=200; }
        try { $record=$budget->settle($reservation,$entry); }
        catch (\Throwable $exception) { $record=$this->error('accounting_pending','ثبت نهایی مصرف انجام نشد.',503); }
        if (is_wp_error($record)) { return $this->error('accounting_pending','پاسخ سرویس دریافت شد اما ثبت نهایی مصرف انجام نشد؛ برای جلوگیری از هزینه تکراری، درخواست را خودکار تکرار نکنید.',503,['reservation_id'=>$reservation['id'],'uncertain_billing'=>true]); }
        $metadata=['usage_record_id'=>$record['id'],'estimated_cost_usd'=>$record['data']['estimated_cost_usd'],'provider'=>$provider,'model'=>$model,'duration_ms'=>$duration,'routing_reason'=>$reason,'billing_uncertain'=>$uncertain];
        if (is_wp_error($result)) { return new \WP_Error($result->get_error_code(),$result->get_error_message(),$errorData+$metadata); }
        return $result+$metadata;
    }

    private function declaredTools(array $tools,bool $readOnly): array|\WP_Error
    {
        if (!array_is_list($tools) || count($tools)>32) { return $this->error('invalid_tools','فهرست ابزار معتبر نیست.'); }
        if (!$tools) { return []; }
        $allowed=[];
        foreach (ToolRegistry::definitions($readOnly) as $definition) { $allowed[$definition['name']]=$definition; }
        $result=[]; $seen=[];
        foreach ($tools as $tool) {
            if (!is_array($tool)) { return $this->error('invalid_tools','تعریف ابزار معتبر نیست.'); }
            $tool=is_array($tool['function']??null)?$tool['function']:$tool;
            $name=$tool['name']??null;
            if (!is_string($name) || !isset($allowed[$name]) || isset($seen[$name])) { return $this->error('undeclared_tool','ابزار درخواست‌شده در فهرست مجاز وجود ندارد.'); }
            $definition=$allowed[$name];
            if (!current_user_can($definition['capability']) || ($tool['parameters']??null)!==$definition['parameters'] || ($tool['description']??'')!==$definition['description']) { return $this->error('invalid_tools','تعریف یا دسترسی ابزار با فهرست ثابت مجاز سازگار نیست.'); }
            $result[]=['name'=>$name,'description'=>$definition['description'],'parameters'=>$definition['parameters']]; $seen[$name]=true;
        }
        return $result;
    }
    private function cost(array $profile,array $usage): ?float
    {
        if (!isset($usage['input_tokens'],$usage['output_tokens'],$profile['input_price'],$profile['output_price'])) { return null; }
        $amount=($usage['input_tokens']*$profile['input_price']+$usage['output_tokens']*$profile['output_price'])/1000000;
        return is_finite($amount)&&$amount>=0&&$amount<=1000000000?ceil(round($amount*1000000,8))/1000000:null;
    }
    private function error(string $code,string $message,int $status=400,array $details=[]): \WP_Error { return new \WP_Error('yagent_'.$code,$message,['status'=>$status]+$details); }
}
