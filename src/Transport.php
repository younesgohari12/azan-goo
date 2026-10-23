<?php
namespace YAgent;
if (!defined('ABSPATH')) { exit; }

final class Transport
{
    public function post(string $url,array $body,array $headers,int $timeout,bool $preserveFunctionArguments=false): array|\WP_Error
    {
        if (!Settings::validUrl($url)) { return $this->error('invalid_url','آدرس API معتبر یا عمومی نیست.',400); }
        $encoded=wp_json_encode($body);
        if (!is_string($encoded)) { return $this->error('invalid_request','ساختار درخواست JSON معتبر نیست.',400); }
        $response=wp_safe_remote_post($url,[
            'headers'=>array_merge(['Content-Type'=>'application/json','Accept'=>'application/json'],$headers),
            'body'=>$encoded,'timeout'=>max(10,min(90,$timeout)),
            'redirection'=>0,'sslverify'=>true,'limit_response_size'=>524289,
        ]);
        if (is_wp_error($response)) { return $this->error('network','ارتباط با سرویس برقرار نشد یا زمان انتظار تمام شد. آدرس API، شبکه هاست و دسترسی سرویس را بررسی کنید.',502,['uncertain_billing'=>true]); }
        $status=(int)wp_remote_retrieve_response_code($response); $details=['http_status'=>$status];
        $retry=wp_remote_retrieve_header($response,'retry-after');
        if (is_string($retry) && trim($retry)!=='') { $details['retry_after']=substr(trim($retry),0,256); }
        if ($status<200 || $status>=300) {
            $errors=[
                401=>['auth','کلید API نامعتبر است یا اعتبار آن تمام شده است.',400],
                403=>['forbidden','سرویس دسترسی این کلید، مدل یا موقعیت سرور را نپذیرفت.',400],
                402=>['credit','اعتبار حساب سرویس کافی نیست.',400],
                404=>['not_found','مدل یا مسیر API پیدا نشد. شناسه مدل و Base URL را بررسی کنید.',400],
                429=>['provider_rate_limit','سقف درخواست یا سهمیه سرویس پر شده است؛ بعداً دوباره تلاش کنید.',429],
            ];
            $e=$errors[$status]??($status>=300&&$status<400?['redirect','سرویس پاسخ انتقال آدرس داد. آدرس نهایی HTTPS را در تنظیمات ثبت کنید.',400]:['provider_error','سرویس پاسخ موفق نداد. وضعیت سرویس و پارامترهای مدل را بررسی کنید.',502]);
            return $this->error($e[0],$e[1].' (HTTP '.$status.')',$e[2],$details);
        }
        $raw=wp_remote_retrieve_body($response); $details['uncertain_billing']=true;
        if (strlen($raw)>524288) { return $this->error('response_too_large','پاسخ سرویس از محدودیت اندازه بتا بزرگ‌تر بود.',502,$details); }
        $data=json_decode($raw,true);
        if (!is_array($data) || json_last_error()!==JSON_ERROR_NONE || isset($data['error'])) { return $this->error('invalid_response','پاسخ سرویس JSON معتبر یا ساختار موفق مورد انتظار ندارد.',502,$details); }
        // Preserve the JSON object/array distinction for native function arguments, including {} versus [].
        if ($preserveFunctionArguments) {
            $objects=json_decode($raw);
            foreach (($objects->candidates??[]) as $i=>$candidate) {
                foreach (($candidate->content->parts??[]) as $j=>$part) {
                    if (isset($part->functionCall) && property_exists($part->functionCall,'args')) { $data['candidates'][$i]['content']['parts'][$j]['functionCall']['args']=$part->functionCall->args; }
                }
            }
        }
        return $data;
    }
    private function error(string $code,string $message,int $status,array $details=[]): \WP_Error { return new \WP_Error('yagent_'.$code,$message,['status'=>$status]+$details); }
}
