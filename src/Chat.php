<?php
namespace YAgent;
use YAgent\Providers\Gemini;
use YAgent\Providers\OpenAICompatible;
if (!defined('ABSPATH')) { exit; }

final class Chat
{
    public function __construct(private Settings $settings,private Transport $transport,private RequestGuard $guard,private ?AI\Gateway $gateway=null) {}

    public function send(string $provider,array $messages,int $userId,string $purpose='chat'): array|\WP_Error
    {
        $valid = $this->validateMessages($messages);
        if (is_wp_error($valid)) { return $valid; }
        $messages = array_map(static fn(array $m): array => ['role'=>$m['role'],'content'=>$m['content']],$messages);
        $connection = $this->settings->connection($provider);
        if (is_wp_error($connection)) { return $connection; }
        $token = $this->guard->acquire($userId);
        if (is_wp_error($token)) { return $token; }
        $start = microtime(true);
        try {
            array_unshift($messages,['role'=>'system','content'=>'You are YAgent AI, a WordPress admin assistant. Reply in the user language. This beta provides text chat only: you have no tools, no access to site data, and cannot perform site changes. Never claim you inspected or changed the site. Do not request API keys in chat.']);
            $gateway=$this->gateway??new AI\Gateway($this->settings,new AI\Config(),new Infrastructure\Store(),$this->transport);
            $selection=$gateway->select(end($messages)['content'],['provider'=>$provider,'legacy'=>true]);
            $result=is_wp_error($selection)?$selection:$gateway->request($selection,$messages,$userId,['task_id'=>wp_generate_uuid4(),'purpose'=>$purpose==='test'?'health':'chat']+((AI\ConsumptionMode::enabled()&&$purpose!=='test')?[]:['max_output_tokens'=>$connection['max_tokens']]));
            if(!is_wp_error($result)&&$result['tool_calls'])$result=new \WP_Error('yagent_tools_disabled','چت متنی اجازه اجرای ابزار ندارد.',['status'=>400]);
            if(!is_wp_error($result))unset($result['provider_data']);
            $this->record($provider,$purpose,is_wp_error($result)?$result->get_error_code():'ok',$start);
            return is_wp_error($result) ? $result : $result+['provider'=>$provider,'model'=>$connection['model'],'duration_ms'=>(int)round((microtime(true)-$start)*1000)];
        } catch (\Throwable $e) {
            $this->record($provider,$purpose,'yagent_internal',$start);
            return new \WP_Error('yagent_internal','در پردازش پاسخ خطایی رخ داد. درخواست جدید را پس از بررسی تنظیمات ارسال کنید.',['status'=>500]);
        } finally { $this->guard->release($userId,$token); }
    }

    private function validateMessages(array $messages): bool|\WP_Error
    {
        $error = new \WP_Error('yagent_invalid_messages','مکالمه باید ۱ تا ۲۰ پیام متنی و حداکثر ۳۲۰۰۰ نویسه داشته باشد و با پیام کاربر تمام شود.',['status'=>400]);
        if (!$messages || (!AI\ConsumptionMode::enabled()&&count($messages)>20) || !array_is_list($messages)) { return $error; }
        $chars=0;
        foreach ($messages as $message) {
            if (!is_array($message) || !in_array($message['role']??null,['user','assistant'],true) || !is_string($message['content']??null) || trim($message['content'])==='') { return $error; }
            $length=preg_match_all('/./us',$message['content']);
            if ($length===false) { return $error; }
            $chars+=$length;
            if (!AI\ConsumptionMode::enabled()&&$chars>32000) { return $error; }
        }
        return end($messages)['role']==='user' ? true : $error;
    }

    private function record(string $provider,string $purpose,string $code,float $start): void
    {
        $events=get_option('yagent_ai_events',[]);
        $events=is_array($events)?$events:[];
        array_unshift($events,['time'=>gmdate('c'),'provider'=>$provider,'purpose'=>$purpose==='test'?'test':'chat','code'=>$code,'duration_ms'=>(int)round((microtime(true)-$start)*1000)]);
        update_option('yagent_ai_events',array_slice($events,0,30),false);
    }
}
