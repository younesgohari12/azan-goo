<?php
namespace YAgent;
use YAgent\Providers\Catalog;
if (!defined('ABSPATH')) { exit; }

final class Settings
{
    public const OPTION = 'yagent_ai_settings';
    public function __construct(private Secrets $secrets) {}

    private function data(): array
    {
        $stored = get_option(self::OPTION, []);
        $stored = is_array($stored) ? $stored : [];
        $data = ['active_provider'=>$stored['active_provider'] ?? 'gemini','providers'=>[]];
        foreach (Catalog::all() as $id=>$preset) {
            $saved = $stored['providers'][$id] ?? [];
            $data['providers'][$id] = array_merge(['base_url'=>$preset['base_url'],'model'=>'','timeout'=>45,'max_tokens'=>2048,'token_parameter'=>'max_tokens','key_cipher'=>''], is_array($saved) ? $saved : []);
        }
        return $data;
    }

    public function publicData(): array
    {
        $data = $this->data();
        foreach ($data['providers'] as $id=>&$c) {
            $c = array_intersect_key($c, array_flip(['base_url','model','timeout','max_tokens','token_parameter'])) + ['has_key'=>!empty($c['key_cipher']), 'label'=>Catalog::all()[$id]['label']];
        }
        return $data;
    }

    public static function validUrl(string $url): bool
    {
        $p = wp_parse_url($url);
        if (!is_array($p) || ($p['scheme'] ?? '') !== 'https' || empty($p['host']) || isset($p['user']) || isset($p['pass']) || isset($p['query']) || isset($p['fragment']) || (isset($p['port']) && $p['port'] !== 443)) { return false; }
        $host = strtolower(trim($p['host'], '[]'));
        if (filter_var($host, FILTER_VALIDATE_IP)) {
            return (bool) filter_var($host, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE);
        }
        return (bool) preg_match('/^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,63}$/i', $host)
            && !preg_match('/\.(?:localhost|local|internal|test|invalid)$/i', $host);
    }

    public function save(array $input): array|\WP_Error
    {
        $id = $input['provider'] ?? '';
        if (!is_string($id) || !isset(Catalog::all()[$id])) { return $this->error('invalid_provider','سرویس انتخاب‌شده معتبر نیست.'); }
        $data = $this->data(); $old = $data['providers'][$id];
        $model = $input['model'] ?? $old['model'];
        if (!is_string($model) || ($model==='' ? (($input['discovery_only']??false)!==true) : !preg_match('/^[a-zA-Z0-9][a-zA-Z0-9._:\/-]{0,127}$/D', $model) || str_contains($model,'..'))) { return $this->error('invalid_model','شناسه دقیق مدل را وارد کنید؛ فاصله و پارامتر URL مجاز نیست.'); }
        $url = $input['base_url'] ?? $old['base_url'];
        if (!is_string($url)) { return $this->error('invalid_url','آدرس API معتبر نیست.'); }
        $url = rtrim(trim($url), '/');
        if (!self::validUrl($url) || ($id === 'gemini' && $url !== Catalog::all()['gemini']['base_url'])) { return $this->error('invalid_url','آدرس API باید HTTPS و عمومی باشد؛ آدرس Gemini ثابت است.'); }
        $key = $input['api_key'] ?? '';
        if (!is_string($key) || strlen($key)>4096 || preg_match('/[\x00-\x20\x7F]/', $key)) { return $this->error('invalid_key','کلید API نباید فاصله، خط جدید یا نویسه کنترلی داشته باشد.'); }
        $remove = ($input['remove_key'] ?? false) === true;
        if ($remove && $key !== '') { return $this->error('invalid_key','حذف کلید و ثبت کلید جدید را هم‌زمان انتخاب نکنید.'); }
        if ($url !== $old['base_url'] && $old['key_cipher'] !== '' && $key === '' && !$remove) { return $this->error('new_key_required','پس از تغییر آدرس API، کلید را دوباره وارد کنید.'); }
        $timeout = $input['timeout'] ?? $old['timeout']; $tokens = $input['max_tokens'] ?? $old['max_tokens'];
        if (!is_int($timeout) || $timeout<10 || $timeout>90 || !is_int($tokens) || $tokens<64 || $tokens>1000000) { return $this->error('invalid_limit','زمان انتظار باید ۱۰ تا ۹۰ ثانیه و سقف خروجی ۶۴ تا ۱۰۰۰۰۰۰ توکن باشد.'); }
        $param = $input['token_parameter'] ?? $old['token_parameter'];
        if (!in_array($param,['max_tokens','max_completion_tokens'],true)) { return $this->error('invalid_limit','نام پارامتر محدودیت توکن معتبر نیست.'); }
        $cipher = $remove ? '' : $old['key_cipher'];
        if ($key !== '') { $cipher = $this->secrets->encrypt($key); if (is_wp_error($cipher)) { return $cipher; } }
        $data['providers'][$id] = ['base_url'=>$url,'model'=>$model,'timeout'=>$timeout,'max_tokens'=>$tokens,'token_parameter'=>$param,'key_cipher'=>$cipher];
        $data['active_provider'] = $id;
        update_option(self::OPTION, $data, false);
        if(get_option(self::OPTION)!==$data)return $this->error('settings_write','ذخیره اتصال انجام نشد؛ تنظیمات ذخیره‌شده را بازخوانی کنید.');
        return $this->publicData();
    }

    public function connection(string $id,bool $requireModel=true): array|\WP_Error
    {
        if (!isset(Catalog::all()[$id])) { return $this->error('invalid_provider','سرویس انتخاب‌شده معتبر نیست.'); }
        $c = $this->data()['providers'][$id];
        if ($requireModel && $c['model'] === '') { return $this->error('invalid_model','ابتدا شناسه مدل را در تنظیمات ذخیره کنید.'); }
        if ($c['key_cipher'] === '') { return $this->error('missing_key','ابتدا کلید API این سرویس را ذخیره کنید.'); }
        $key = $this->secrets->decrypt($c['key_cipher']);
        if (is_wp_error($key)) { return $key; }
        unset($c['key_cipher']);
        return $c + ['api_key'=>$key,'provider'=>$id,'protocol'=>Catalog::all()[$id]['protocol']];
    }

    private function error(string $code,string $message): \WP_Error { return new \WP_Error('yagent_'.$code,$message,['status'=>400]); }
}
