<?php
namespace YAgent\Providers;
use YAgent\Attachments;
use YAgent\Transport;
if (!defined('ABSPATH')) { exit; }

final class Gemini implements Provider
{
    public function __construct(private Transport $transport) {}

    public function chat(array $connection,array $messages): array|\WP_Error
    {
        $result=$this->exchange($connection,$messages);
        return !is_wp_error($result) && trim($result['content'])==='' ? $this->emptyResponse($result['usage']) : $result;
    }

    public function payload(array $connection,array $messages,array $tools=[],array $options=[]): array|\WP_Error
    {
        $contents=[]; $system=[]; $names=[]; $toolGroup=false;
        foreach ($messages as $message) {
            if (!is_array($message) || !in_array($message['role']??null,['system','user','assistant','tool'],true)) { return $this->invalid(false); }
            $role=$message['role']; $text=$message['content']??'';
            if (!is_string($text) && $text!==null) { return $this->invalid(false); }
            if (array_key_exists('attachments',$message)) { return $this->invalid(false); }
            $media=[];
            if (array_key_exists('media',$message)) {
                if ($role!=='user') { return $this->invalid(false); }
                $media=Attachments::nativeMedia($message['media'],'gemini');
                if (is_wp_error($media)) { return $media; }
            }
            if ($role==='system') { if ($text!=='') { $system[]=['text'=>$text]; } continue; }
            if ($role==='tool') {
                $id=$message['tool_call_id']??null; $name=$message['name']??($names[$id??'']??null);
                if (!$this->identifier($id) || !$this->name($name) || !isset($names[$id]) || $names[$id]!==$name) { return $this->invalid(false); }
                $response=json_decode((string)$text,true);
                if (!is_array($response) || ($response && array_is_list($response))) { $response=['result'=>$text]; }
                $part=['functionResponse'=>['id'=>$id,'name'=>$name,'response'=>(object)$response]];
                if ($toolGroup) { $contents[count($contents)-1]['parts'][]=$part; }
                else { $contents[]=['role'=>'user','parts'=>[$part]]; }
                $toolGroup=true; continue;
            }
            $toolGroup=false; $parts=[];
            if ($role==='assistant') {
                $calls=$this->normalizeCalls($message['tool_calls']??[],false);
                if (is_wp_error($calls)) { return $calls; }
                $byId=[];
                foreach ($calls as $call) { $names[$call['id']]=$call['name']; $byId[$call['id']]=$call; }
                $saved=$message['provider_data']['gemini_parts']??null;
                if (is_array($saved) && array_is_list($saved) && $saved) {
                    foreach ($saved as $part) {
                        if (!is_array($part)) { return $this->invalid(false); }
                        $clean=[];
                        if (isset($part['functionCall'])) {
                            $native=$part['functionCall']; $id=$native['id']??null;
                            if (!is_array($native) || !$this->identifier($id) || !isset($byId[$id]) || ($native['name']??null)!==$byId[$id]['name']) { return $this->invalid(false); }
                            $call=$byId[$id];
                            $clean['functionCall']=['id'=>$id,'name'=>$call['name'],'args'=>(object)$call['arguments']];
                            unset($byId[$id]);
                        } elseif (empty($part['thought']) && is_string($part['text']??null)) { $clean['text']=$part['text']; }
                        if (isset($part['thoughtSignature']) && is_string($part['thoughtSignature']) && strlen($part['thoughtSignature'])<=131072) { $clean['thoughtSignature']=$part['thoughtSignature']; }
                        if ($clean) { $parts[]=$clean; }
                    }
                    if ($byId) { return $this->invalid(false); }
                } else {
                    if (is_string($text) && $text!=='') { $parts[]=['text'=>$text]; }
                    foreach ($calls as $call) { $parts[]=['functionCall'=>['id'=>$call['id'],'name'=>$call['name'],'args'=>(object)$call['arguments']]]; }
                }
            } elseif ($text!=='' && $text!==null) { $parts[]=['text'=>$text]; }
            foreach ($media as $part) { $parts[]=['inlineData'=>['mimeType'=>$part['mime'],'data'=>$part['data_base64']]]; }
            if (!$parts) { $parts[]=['text'=>'']; }
            $contents[]=['role'=>$role==='assistant'?'model':'user','parts'=>$parts];
        }
        $body=['contents'=>$contents];
        if (($options['unrestricted_output']??false)!==true) { $body['generationConfig']=['maxOutputTokens'=>$connection['max_tokens']]; }
        if ($system) { $body['systemInstruction']=['parts'=>$system]; }
        if ($tools) {
            if (count($tools)>32) { return $this->invalid(false); }
            $declarations=[];
            foreach ($tools as $tool) {
                $tool=is_array($tool['function']??null)?$tool['function']:$tool;
                if (!is_array($tool) || !$this->name($tool['name']??null) || !is_array($tool['parameters']??null)) { return $this->invalid(false); }
                $definition=['name'=>$tool['name'],'parameters'=>$this->schema($tool['parameters'])];
                if (isset($tool['description']) && is_string($tool['description'])) { $definition['description']=$tool['description']; }
                $declarations[]=$definition;
            }
            $body['tools']=[['functionDeclarations'=>$declarations]];
        }
        if (isset($options['thinking']['thinkingConfig'])) { $body['generationConfig']['thinkingConfig']=$options['thinking']['thinkingConfig']; }
        return $body;
    }

    public function exchange(array $connection,array $messages,array $tools=[],array $options=[]): array|\WP_Error
    {
        $body=$this->payload($connection,$messages,$tools,$options);
        if (is_wp_error($body)) { return $body; }
        $model=preg_replace('/^models\//','',$connection['model']);
        $url='https://generativelanguage.googleapis.com/v1beta/models/'.rawurlencode($model).':generateContent';
        $data=$this->transport->post($url,$body,['x-goog-api-key'=>$connection['api_key']],$connection['timeout'],true);
        if (is_wp_error($data)) { return $data; }
        $candidate=is_array($data['candidates'][0]??null)?$data['candidates'][0]:[];
        $reason=$candidate['finishReason']??'';
        $usage=$this->usage(is_array($data['usageMetadata']??null)?$data['usageMetadata']:[]);
        if (!empty($data['promptFeedback']['blockReason']) || in_array($reason,['SAFETY','RECITATION','BLOCKLIST','PROHIBITED_CONTENT','SPII'],true)) { return new \WP_Error('yagent_blocked','سرویس Gemini درخواست یا پاسخ را مسدود کرد.',['status'=>400,'http_status'=>200,'uncertain_billing'=>true,'usage'=>$usage]); }
        $parts=$candidate['content']['parts']??[];
        if (!is_array($parts) || !array_is_list($parts)) { return $this->emptyResponse($usage); }
        $text=''; $nativeCalls=[]; $saved=[];
        foreach ($parts as $index=>$part) {
            if (!is_array($part)) { return $this->invalidUsage($usage); }
            $clean=[];
            if (isset($part['functionCall'])) {
                $function=$part['functionCall'];
                if (!is_array($function)) { return $this->invalidUsage($usage); }
                $id=$function['id']??('gemini_'.bin2hex(random_bytes(12)).'_'.$index);
                $nativeCalls[]=['id'=>$id,'name'=>$function['name']??null,'arguments'=>$function['args']??null];
                $clean['functionCall']=['id'=>$id,'name'=>$function['name']??null,'args'=>$function['args']??null];
            } elseif (empty($part['thought']) && is_string($part['text']??null)) { $text.=$part['text']; $clean['text']=$part['text']; }
            if (isset($part['thoughtSignature'])) {
                if (!is_string($part['thoughtSignature']) || strlen($part['thoughtSignature'])>131072) { return $this->invalidUsage($usage); }
                $clean['thoughtSignature']=$part['thoughtSignature'];
            }
            if ($clean) { $saved[]=$clean; }
        }
        $calls=$this->normalizeCalls($nativeCalls,true);
        if (is_wp_error($calls)) { $calls->add_data(array_merge((array)$calls->get_error_data(),['usage'=>$usage])); return $calls; }
        if (trim($text)==='' && !$calls && $reason!=='MAX_TOKENS') { return $this->emptyResponse($usage); }
        return ['content'=>$text,'truncated'=>$reason==='MAX_TOKENS','tool_calls'=>$calls,'provider_data'=>['gemini_parts'=>$saved],'usage'=>$usage];
    }

    private function invalidUsage(array $usage): \WP_Error
    {
        $error=$this->invalid(true);$error->add_data(array_merge((array)$error->get_error_data(),['usage'=>$usage]));return $error;
    }

    private function usage(array $usage): array
    {
        $input=$this->number($usage['promptTokenCount']??null); $candidates=$this->number($usage['candidatesTokenCount']??null); $thinking=$this->number($usage['thoughtsTokenCount']??null);
        $output=$candidates===null?null:$candidates+($thinking??0);
        $total=$this->number($usage['totalTokenCount']??null);
        if ($total===null && $input!==null && $output!==null) { $total=$input+$output; }
        return ['input_tokens'=>$input,'output_tokens'=>$output,'total_tokens'=>$total,'thinking_tokens'=>$thinking,'cached_tokens'=>$this->number($usage['cachedContentTokenCount']??null)];
    }

    private function normalizeCalls($calls,bool $response): array|\WP_Error
    {
        if (!is_array($calls) || !array_is_list($calls) || count($calls)>8) { return $this->invalid($response); }
        $result=[]; $ids=[];
        foreach ($calls as $call) {
            if (!is_array($call)) { return $this->invalid($response); }
            $id=$call['id']??null; $name=$call['name']??null; $arguments=$call['arguments']??null;
            if ($response && !$arguments instanceof \stdClass) { return $this->invalid(true); }
            if ($arguments instanceof \stdClass) { $arguments=json_decode(wp_json_encode($arguments),true); }
            if (!$this->identifier($id) || isset($ids[$id]) || !$this->name($name) || !is_array($arguments) || ($arguments && array_is_list($arguments)) || strlen((string)wp_json_encode((object)$arguments))>262144) { return $this->invalid($response); }
            $ids[$id]=true; $result[]=['id'=>$id,'name'=>$name,'arguments'=>$arguments];
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
    private function invalid(bool $response): \WP_Error { return new \WP_Error('yagent_invalid_tool_calls','ساختار فراخوانی یا پارامترهای ابزار Gemini معتبر نیست.',['status'=>$response?502:400]+($response?['http_status'=>200,'uncertain_billing'=>true]:[])); }
    private function emptyResponse(array $usage=[]): \WP_Error { return new \WP_Error('yagent_empty_response','Gemini پاسخ متنی قابل‌نمایش نداد؛ مدل و سقف توکن را بررسی کنید.',['status'=>502,'http_status'=>200,'uncertain_billing'=>true]+($usage?['usage'=>$usage]:[])); }
}
