<?php
namespace YAgent\Providers;
use YAgent\Attachments;
use YAgent\Transport;
if (!defined('ABSPATH')) { exit; }

final class OpenAICompatible implements Provider
{
    public function __construct(private Transport $transport) {}

    public function chat(array $connection,array $messages): array|\WP_Error
    {
        $result=$this->exchange($connection,$messages);
        return !is_wp_error($result) && trim($result['content'])==='' ? $this->emptyResponse($result['usage']) : $result;
    }

    /** Build exactly the payload used by exchange, so the gateway can bound the final wire size. */
    public function payload(array $connection,array $messages,array $tools=[],array $options=[]): array|\WP_Error
    {
        $wire=[];
        foreach ($messages as $message) {
            if (!is_array($message) || !in_array($message['role']??null,['system','user','assistant','tool'],true)) { return $this->invalid('ساختار پیام مدل معتبر نیست.',false); }
            $m=['role'=>$message['role'],'content'=>$message['content']??''];
            if (!is_string($m['content']) && $m['content']!==null) { return $this->invalid('متن پیام مدل معتبر نیست.',false); }
            if (array_key_exists('attachments',$message)) { return $this->invalid('پیوست باید پیش از ارسال با مالکیت معتبر خوانده شود.',false); }
            if (array_key_exists('media',$message)) {
                if ($message['role']!=='user') { return $this->invalid('رسانه فقط برای پیام کاربر معتبر است.',false); }
                $media=Attachments::nativeMedia($message['media'],'openai');
                if (is_wp_error($media)) { return $media; }
                if ($media) {
                    $parts=[['type'=>'text','text'=>$m['content']??'']];
                    foreach ($media as $part) {
                        $mime=$part['mime']; $data=$part['data_base64'];
                        if (str_starts_with($mime,'image/')) { $parts[]=['type'=>'image_url','image_url'=>['url'=>'data:'.$mime.';base64,'.$data]]; }
                        elseif ($mime==='application/pdf') { $parts[]=['type'=>'file','file'=>['filename'=>$part['name'],'file_data'=>'data:application/pdf;base64,'.$data]]; }
                        else { $parts[]=['type'=>'input_audio','input_audio'=>['data'=>$data,'format'=>$mime==='audio/wav'?'wav':'mp3']]; }
                    }
                    $m['content']=$parts;
                }
            }
            if ($message['role']==='tool') {
                if (!$this->identifier($message['tool_call_id']??null)) { return $this->invalid('شناسه نتیجه ابزار معتبر نیست.',false); }
                $m['tool_call_id']=$message['tool_call_id'];
            }
            if ($message['role']==='assistant' && !empty($message['tool_calls'])) {
                $calls=$this->calls($message['tool_calls'],false);
                if (is_wp_error($calls)) { return $calls; }
                $m['tool_calls']=[];
                foreach ($calls as $call) {
                    $m['tool_calls'][]=['id'=>$call['id'],'type'=>'function','function'=>['name'=>$call['name'],'arguments'=>wp_json_encode((object)$call['arguments'])]];
                }
            }
            $wire[]=$m;
        }
        $parameter=($connection['token_parameter']??'max_tokens')==='max_completion_tokens'?'max_completion_tokens':'max_tokens';
        $body=['model'=>$connection['model'],'messages'=>$wire,'stream'=>false];
        if (($options['unrestricted_output']??false)!==true) { $body[$parameter]=$connection['max_tokens']; }
        if ($tools) {
            if (count($tools)>32) { return $this->invalid('تعداد تعریف ابزار بیش از حد مجاز است.',false); }
            $definitions=[];
            foreach ($tools as $tool) {
                $tool=is_array($tool['function']??null)?$tool['function']:$tool;
                if (!is_array($tool) || !$this->name($tool['name']??null) || !is_array($tool['parameters']??null)) { return $this->invalid('تعریف ابزار معتبر نیست.',false); }
                $definition=['name'=>$tool['name'],'parameters'=>$this->schema($tool['parameters'])];
                if (isset($tool['description']) && is_string($tool['description'])) { $definition['description']=$tool['description']; }
                $definitions[]=['type'=>'function','function'=>$definition];
            }
            $body['tools']=$definitions;
        }
        if (isset($options['thinking']['reasoning_effort'])) { $body['reasoning_effort']=$options['thinking']['reasoning_effort']; }
        return $body;
    }

    public function exchange(array $connection,array $messages,array $tools=[],array $options=[]): array|\WP_Error
    {
        $body=$this->payload($connection,$messages,$tools,$options);
        if (is_wp_error($body)) { return $body; }
        $base=rtrim($connection['base_url'],'/');
        $url=str_ends_with($base,'/chat/completions')?$base:$base.'/chat/completions';
        $data=$this->transport->post($url,$body,['Authorization'=>'Bearer '.$connection['api_key']],$connection['timeout']);
        if (is_wp_error($data)) { return $data; }
        $usage=$this->usage(is_array($data['usage']??null)?$data['usage']:[]);
        $choice=$data['choices'][0]??null;
        if (!is_array($choice) || !is_array($choice['message']??null)) { return $this->emptyResponse($usage); }
        if (($choice['finish_reason']??'')==='content_filter' || (is_string($choice['message']['refusal']??null) && trim($choice['message']['refusal'])!=='')) { return new \WP_Error('yagent_blocked','سرویس پاسخ را به دلیل سیاست محتوایی مسدود کرد.',['status'=>400,'http_status'=>200,'uncertain_billing'=>true,'usage'=>$usage]); }
        $message=$choice['message']; $content=$message['content']??'';
        if (is_array($content)) {
            $text='';
            foreach ($content as $part) {
                if (is_array($part) && ($part['type']??'')==='refusal' && is_string($part['refusal']??null) && trim($part['refusal'])!=='') { return new \WP_Error('yagent_blocked','سرویس پاسخ را به دلیل سیاست محتوایی مسدود کرد.',['status'=>400,'http_status'=>200,'uncertain_billing'=>true,'usage'=>$usage]); }
                if (is_array($part) && ($part['type']??'')==='text' && is_string($part['text']??null)) { $text.=$part['text']; }
            }
            $content=$text;
        }
        if (!is_string($content)) { return $this->emptyResponse($usage); }
        $native=$message['tool_calls']??[];
        // Older Chat Completions responses use a single function_call without an ID.
        if (!$native && isset($message['function_call'])) {
            $function=$message['function_call'];
            $native=[['id'=>'legacy_'.substr(hash('sha256',(string)wp_json_encode($function)),0,24),'type'=>'function','function'=>$function]];
        }
        $calls=$this->calls($native,true);
        if (is_wp_error($calls)) { $details=$calls->get_error_data(); $details['usage']=$usage; $calls->add_data($details); return $calls; }
        if ($tools && $calls) {
            $allowed=[];
            foreach ($tools as $tool) { $definition=is_array($tool['function']??null)?$tool['function']:$tool; $allowed[]=$definition['name']; }
            foreach ($calls as $call) { if (!in_array($call['name'],$allowed,true)) { $error=$this->invalid('ابزار درخواست‌شده در این نوبت مجاز نیست.',true); $details=$error->get_error_data(); $details['usage']=$usage; $error->add_data($details); return $error; } }
        }
        if (trim($content)==='' && !$calls && ($choice['finish_reason']??'')!=='length') { return $this->emptyResponse($usage); }
        return ['content'=>$content,'truncated'=>($choice['finish_reason']??'')==='length','tool_calls'=>$calls,'provider_data'=>[],'usage'=>$usage];
    }

    private function usage(array $usage): array
    {
        $input=$this->number($usage['prompt_tokens']??null); $output=$this->number($usage['completion_tokens']??null);
        $total=$this->number($usage['total_tokens']??null);
        if ($total===null && $input!==null && $output!==null) { $total=$input+$output; }
        return ['input_tokens'=>$input,'output_tokens'=>$output,'total_tokens'=>$total,'thinking_tokens'=>$this->number($usage['completion_tokens_details']['reasoning_tokens']??null),'cached_tokens'=>$this->number($usage['prompt_tokens_details']['cached_tokens']??null)];
    }

    private function calls($calls,bool $response): array|\WP_Error
    {
        if (!is_array($calls) || !array_is_list($calls) || count($calls)>8) { return $this->invalid('ساختار فراخوانی ابزار معتبر نیست.',$response); }
        $result=[]; $ids=[];
        foreach ($calls as $call) {
            if (!is_array($call) || ($response && isset($call['type']) && $call['type']!=='function')) { return $this->invalid('ساختار فراخوانی ابزار معتبر نیست.',$response); }
            $id=$call['id']??null; $function=$response?($call['function']??[]):$call;
            if (!is_array($function) || !$this->identifier($id) || isset($ids[$id]) || !$this->name($function['name']??null)) { return $this->invalid('شناسه یا نام فراخوانی ابزار معتبر نیست.',$response); }
            $arguments=$function['arguments']??null;
            if ($response) {
                if (is_string($arguments)) {
                    if (strlen($arguments)>262144) { return $this->invalid('پارامترهای ابزار باید یک شیء JSON محدود باشند.',$response); }
                    $object=json_decode($arguments);
                    if (!$object instanceof \stdClass || json_last_error()!==JSON_ERROR_NONE) { return $this->invalid('پارامترهای ابزار باید یک شیء JSON معتبر باشند.',$response); }
                    $arguments=json_decode($arguments,true);
                } elseif (!is_array($arguments) || !$arguments || array_is_list($arguments)) {
                    // Transport decodes objects as associative arrays. Empty arrays remain ambiguous;
                    // only the canonical JSON string "{}" can safely express empty arguments here.
                    return $this->invalid('پارامترهای ابزار باید یک شیء JSON محدود باشند.',$response);
                }
            }
            if (!is_array($arguments) || ($arguments && array_is_list($arguments)) || strlen((string)wp_json_encode((object)$arguments))>262144) { return $this->invalid('پارامترهای ابزار باید یک شیء JSON محدود باشند.',$response); }
            $ids[$id]=true; $result[]=['id'=>$id,'name'=>$function['name'],'arguments'=>$arguments];
        }
        return $result;
    }
    private function schema(array $schema): array
    {
        if (isset($schema['properties']) && $schema['properties']===[]) { $schema['properties']=(object)[]; }
        return $schema;
    }
    private function identifier($v): bool { return is_string($v) && strlen($v)>=1 && strlen($v)<=128 && (bool)preg_match('/^[A-Za-z0-9_.:\-]+$/D',$v); }
    private function name($v): bool { return is_string($v) && (bool)preg_match('/^[A-Za-z_][A-Za-z0-9_.:\-]{0,63}$/D',$v); }
    private function number($v): ?int { return is_int($v) && $v>=0?$v:null; }
    private function invalid(string $message,bool $response): \WP_Error { return new \WP_Error('yagent_invalid_tool_calls',$message,['status'=>$response?502:400]+($response?['http_status'=>200,'uncertain_billing'=>true]:[])); }
    private function emptyResponse(array $usage=[]): \WP_Error { return new \WP_Error('yagent_empty_response','مدل پاسخ متنی قابل‌نمایش نداد؛ پشتیبانی مدل از Chat Completions و سقف توکن را بررسی کنید.',['status'=>502,'http_status'=>200,'uncertain_billing'=>true]+($usage?['usage'=>$usage]:[])); }
}
