<?php
namespace YAgent\Memory;

use YAgent\Infrastructure\Store;

if (!defined('ABSPATH')) { exit; }

/** Templates are opaque user text; storing one never grants any capability. */
final class Templates
{
    private const KIND = 'template';

    public function __construct(private Store $store) {}

    public function create(int $owner, string $title, string $prompt): array|\WP_Error
    {
        $valid = $this->validate($owner, $title, $prompt);
        return is_wp_error($valid) ? $valid : $this->store->create(self::KIND, $owner, ['title' => $title, 'prompt' => $prompt]);
    }

    public function save(string $id, int $owner, string $title, string $prompt): array|\WP_Error
    {
        $valid = $this->validate($owner, $title, $prompt);
        if (is_wp_error($valid)) { return $valid; }
        for ($attempt = 0; $attempt < 4; ++$attempt) {
            $row = $this->get($id, $owner);
            if (is_wp_error($row)) { return $row; }
            $data = $row['data'];
            $data['title'] = $title;
            $data['prompt'] = $prompt;
            $saved = $this->store->update(self::KIND, $id, (int) $row['version'], $data);
            if (!is_wp_error($saved) || $saved->get_error_code() !== 'yagent_conflict') { return $saved; }
        }
        return new \WP_Error('yagent_conflict', 'الگو هم‌زمان تغییر کرده است؛ دوباره تلاش کنید.', ['status' => 409]);
    }

    public function get(string $id, int $owner): array|\WP_Error
    {
        return $owner < 1 ? $this->notFound() : $this->store->get(self::KIND, $id, $owner);
    }

    public function listing(int $owner): array|\WP_Error
    {
        return $owner < 1 ? $this->notFound() : $this->store->listing(self::KIND, $owner, 200);
    }

    public function delete(string $id, int $owner): bool|\WP_Error
    {
        return $owner < 1 ? $this->notFound() : $this->store->delete(self::KIND, $id, $owner);
    }

    private function validate(int $owner, string $title, string $prompt): bool|\WP_Error
    {
        $length = preg_match_all('/./us', $title);
        if ($owner < 1 || trim($title) === '' || $length === false || $length > 200 || trim($prompt)==='' || str_contains($title,"\0") || str_contains($prompt,"\0") || strlen($prompt) > 32768 || preg_match('//u', $prompt) !== 1) {
            return new \WP_Error('yagent_invalid_template', 'عنوان الگو باید ۱ تا ۲۰۰ نویسه و متن آن UTF-8 و حداکثر ۳۲ کیلوبایت باشد.', ['status' => 400]);
        }
        return true;
    }

    private function notFound(): \WP_Error
    {
        return new \WP_Error('yagent_not_found', 'الگو پیدا نشد.', ['status' => 404]);
    }
}
