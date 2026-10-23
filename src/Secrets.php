<?php
namespace YAgent;
if (!defined('ABSPATH')) { exit; }

final class Secrets
{
    private function key(): string
    {
        return hash('sha256', wp_salt('auth') . wp_salt('secure_auth') . ':yagent-ai-v1', true);
    }

    public function encrypt(string $plain): string|\WP_Error
    {
        if (!function_exists('openssl_encrypt')) {
            return new \WP_Error('yagent_crypto_missing', 'افزونه OpenSSL روی هاست فعال نیست.', ['status'=>503]);
        }
        try {
            $iv = random_bytes(12);
            $tag = '';
            $cipher = openssl_encrypt($plain, 'aes-256-gcm', $this->key(), OPENSSL_RAW_DATA, $iv, $tag, 'yagent-ai:credentials:v1');
            if ($cipher === false) { throw new \RuntimeException(); }
            return 'v1.' . base64_encode($iv . $tag . $cipher);
        } catch (\Throwable $e) {
            return new \WP_Error('yagent_crypto_failed', 'رمزگذاری کلید انجام نشد؛ تنظیمات ذخیره نشد.', ['status'=>500]);
        }
    }

    public function decrypt(string $encoded): string|\WP_Error
    {
        $data = str_starts_with($encoded, 'v1.') ? base64_decode(substr($encoded, 3), true) : false;
        $plain = false;
        if ($data !== false && strlen($data) > 28 && function_exists('openssl_decrypt')) {
            $plain = openssl_decrypt(substr($data, 28), 'aes-256-gcm', $this->key(), OPENSSL_RAW_DATA, substr($data, 0, 12), substr($data, 12, 16), 'yagent-ai:credentials:v1');
        }
        return $plain === false ? new \WP_Error('yagent_key_unreadable', 'کلید ذخیره‌شده قابل خواندن نیست. پس از تغییر کلیدهای امنیتی وردپرس، API Key را دوباره وارد کنید.', ['status'=>400]) : $plain;
    }
}
