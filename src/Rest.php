<?php
namespace YAgent;
if (!defined('ABSPATH')) { exit; }

final class Rest
{
    public function __construct(private Settings $settings,private Chat $chat) {}
    public function register(): void { add_action('rest_api_init',[$this,'routes']); }
    public function routes(): void
    {
        $permission=[$this,'permission'];
        register_rest_route('yagent/v1','/settings',[
            ['methods'=>'GET','permission_callback'=>$permission,'callback'=>fn()=> $this->response($this->settings->publicData())],
            ['methods'=>'POST','permission_callback'=>$permission,'callback'=>[$this,'save']],
        ]);
        register_rest_route('yagent/v1','/chat',['methods'=>'POST','permission_callback'=>$permission,'callback'=>fn($r)=>$this->send($r,false)]);
        register_rest_route('yagent/v1','/test',['methods'=>'POST','permission_callback'=>$permission,'callback'=>fn($r)=>$this->send($r,true)]);
        register_rest_route('yagent/v1','/status',['methods'=>'GET','permission_callback'=>$permission,'callback'=>fn()=> $this->response(['version'=>YAGENT_AI_VERSION,'mode'=>'text_chat','max_messages'=>20,'max_characters'=>32000,'events'=>get_option('yagent_ai_events',[])])]);
    }
    public function permission(\WP_REST_Request $request): bool|\WP_Error
    {
        if (!is_user_logged_in()) { return new \WP_Error('yagent_not_logged_in','ورود به حساب مدیر لازم است.',['status'=>401]); }
        if (!current_user_can('manage_options')) { return new \WP_Error('yagent_forbidden','مجوز مدیریت YAgent را ندارید.',['status'=>403]); }
        if (!wp_verify_nonce($request->get_header('X-WP-Nonce'),'wp_rest')) { return new \WP_Error('rest_cookie_invalid_nonce','نشست معتبر نیست یا منقضی شده است؛ صفحه را دوباره بارگذاری کنید.',['status'=>403]); }
        return true;
    }
    public function save(\WP_REST_Request $request): \WP_REST_Response|\WP_Error
    {
        $input=$this->input($request);
        return is_wp_error($input)?$input:$this->response($this->settings->save($input));
    }
    private function send(\WP_REST_Request $request,bool $test): \WP_REST_Response|\WP_Error
    {
        $input=$this->input($request);
        if (is_wp_error($input)) { return $input; }
        $provider=$input['provider']??null;
        $messages=$test ? [['role'=>'user','content'=>'Reply with a very short greeting in Persian. This is a connection test.']] : ($input['messages']??null);
        if (!is_string($provider) || !is_array($messages)) { return new \WP_Error('yagent_invalid_request','سرویس و آرایه پیام‌های معتبر لازم است.',['status'=>400]); }
        return $this->response($this->chat->send($provider,$messages,get_current_user_id(),$test?'test':'chat'));
    }
    private function input(\WP_REST_Request $request): array|\WP_Error
    {
        if (strlen($request->get_body())>180000) { return new \WP_Error('yagent_request_too_large','اندازه درخواست بیش از حد مجاز است.',['status'=>413]); }
        $input=$request->get_json_params();
        return is_array($input) && !array_is_list($input) ? $input : new \WP_Error('yagent_invalid_request','بدنه درخواست باید یک شیء JSON باشد.',['status'=>400]);
    }
    private function response(array|\WP_Error $data): \WP_REST_Response|\WP_Error
    {
        if (is_wp_error($data)) { return $data; }
        $response=new \WP_REST_Response($data,200);
        $response->header('Cache-Control','private, no-store, max-age=0');
        return $response;
    }
}
