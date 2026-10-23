<?php
namespace YAgent\Memory;

use YAgent\Infrastructure\Store;

if (!defined('ABSPATH')) { exit; }

/** Durable transcripts. Compaction only changes the derived summary cache. */
final class Conversations
{
    private const KIND = 'conversation';
    private const MAX_MESSAGES = 2000;
    private const MAX_MESSAGE_BYTES = 131072;
    private const RETRIES = 4;

    public function __construct(private Store $store) {}

    public function create(int $owner, string $title = 'گفت‌وگوی جدید'): array|\WP_Error
    {
        if ($owner < 1 || !$this->validTitle($title)) {
            return $this->error('yagent_invalid_conversation', 'عنوان گفت‌وگو یا مالک آن معتبر نیست.', 400);
        }
        return $this->store->create(self::KIND, $owner, ['title' => $title, 'messages' => [], 'summary_cache' => null]);
    }

    public function get(string $id, int $owner): array|\WP_Error
    {
        if ($owner < 1) { return $this->notFound(); }
        return $this->store->get(self::KIND, $id, $owner);
    }

    public function listing(int $owner): array|\WP_Error
    {
        return $owner < 1 ? $this->notFound() : $this->store->listing(self::KIND, $owner, 200);
    }

    public function rename(string $id, int $owner, string $title): array|\WP_Error
    {
        if (!$this->validTitle($title)) { return $this->error('yagent_invalid_title', 'عنوان باید بین ۱ تا ۲۰۰ نویسه باشد.', 400); }
        return $this->mutate($id, $owner, static function (array $data) use ($title): array {
            $data['title'] = $title;
            return $data;
        });
    }

    public function append(string $id, int $owner, array $message): array|\WP_Error
    {
        $message = $this->message($message);
        if (is_wp_error($message)) { return $message; }
        if(!empty($message['attachments']))foreach($message['attachments']as$attachmentId){$meta=(new \YAgent\Attachments($this->store))->metadata($attachmentId,$owner);if(is_wp_error($meta))return $meta;}
        return $this->mutate($id, $owner, function (array $data) use ($message): array|\WP_Error {
            $messages = $data['messages'] ?? [];
            if (!is_array($messages) || !array_is_list($messages)) {
                return $this->error('yagent_invalid_conversation', 'آرشیو گفت‌وگو قابل خواندن نیست.', 500);
            }
            foreach ($messages as $existing) {
                if (($existing['id'] ?? null) !== $message['id']) { continue; }
                if (($existing['role'] ?? null) === $message['role'] && ($existing['content'] ?? null) === $message['content'] && ($existing['status'] ?? 'completed') === $message['status'] && ($existing['attachments']??[])===($message['attachments']??[])) {
                    return $data;
                }
                return $this->error('yagent_message_conflict', 'این شناسه قبلاً برای پیام دیگری ثبت شده است.', 409);
            }
            if (!\YAgent\AI\ConsumptionMode::enabled() && count($messages) >= self::MAX_MESSAGES) {
                return $this->error('yagent_conversation_full', 'گفت‌وگو به سقف ۲۰۰۰ پیام رسیده است؛ گفت‌وگوی تازه‌ای بسازید.', 400);
            }
            $data['messages'][] = $message;
            return $data;
        });
    }

    public function clear(string $id, int $owner): array|\WP_Error
    {
        return $this->mutate($id, $owner, static function (array $data): array {
            $data['messages'] = [];
            $data['summary_cache'] = null;
            return $data;
        });
    }

    public function delete(string $id, int $owner): bool|\WP_Error
    {
        if ($owner < 1) { return $this->notFound(); }
        return $this->store->delete(self::KIND, $id, $owner);
    }

    /** The caller must prove that the cached prefix belongs to this version. */
    public function cacheSummary(string $id, int $owner, int $version, array $cache): array|\WP_Error
    {
        $row = $this->get($id, $owner);
        if (is_wp_error($row)) { return $row; }
        if ((int) $row['version'] !== $version) {
            return $this->error('yagent_conflict', 'گفت‌وگو هم‌زمان تغییر کرده است؛ دوباره تلاش کنید.', 409);
        }
        $data = $row['data'];
        $data['summary_cache'] = $cache;
        return $this->store->update(self::KIND, $id, $version, $data);
    }

    private function mutate(string $id, int $owner, callable $change): array|\WP_Error
    {
        for ($attempt = 0; $attempt < self::RETRIES; ++$attempt) {
            $row = $this->get($id, $owner);
            if (is_wp_error($row)) { return $row; }
            $data = $change($row['data']);
            if (is_wp_error($data)) { return $data; }
            if ($data === $row['data']) { return $row; }
            $saved = $this->store->update(self::KIND, $id, (int) $row['version'], $data);
            if (!is_wp_error($saved) || $saved->get_error_code() !== 'yagent_conflict') { return $saved; }
        }
        return $this->error('yagent_conflict', 'گفت‌وگو هم‌زمان تغییر کرده است؛ دوباره تلاش کنید.', 409);
    }

    private function message(array $message): array|\WP_Error
    {
        $id = $message['id'] ?? (function_exists('wp_generate_uuid4') ? wp_generate_uuid4() : bin2hex(random_bytes(16)));
        $status = $message['status'] ?? 'completed';
        $created = $message['created_at'] ?? gmdate('c');
        if (!is_string($id) || !preg_match('/^[A-Za-z0-9_-]{1,128}$/D', $id)
            || !in_array($message['role'] ?? null, ['user', 'assistant'], true)
            || !is_string($message['content'] ?? null) || trim($message['content']) === ''
            || strlen($message['content']) > self::MAX_MESSAGE_BYTES || preg_match('//u', $message['content']) !== 1
            || !in_array($status, ['completed', 'pending', 'failed', 'cancelled'], true)
            || !is_string($created) || strlen($created) > 40 || strtotime($created) === false) {
            return $this->error('yagent_invalid_message', 'پیام باید متن معتبر UTF-8 تا ۱۲۸ کیلوبایت و نقش و وضعیت معتبر داشته باشد.', 400);
        }
        $attachments=$message['attachments']??[];
        if(!is_array($attachments)||!array_is_list($attachments)||count($attachments)>20||($attachments&&$message['role']!=='user'))return $this->error('yagent_invalid_attachment','پیوست پیام معتبر نیست.',400);
        foreach($attachments as$attachment)if(!is_string($attachment)||!preg_match('/^[A-Za-z0-9_-]{1,64}$/D',$attachment))return $this->error('yagent_invalid_attachment','شناسه پیوست معتبر نیست.',400);
        return (empty($attachments)?[]:['attachments'=>$attachments])+['id' => $id, 'role' => $message['role'], 'content' => $message['content'], 'status' => $status, 'created_at' => $created];
    }

    private function validTitle(string $title): bool
    {
        $length = preg_match_all('/./us', $title);
        return trim($title) !== '' && $length !== false && $length <= 200;
    }

    private function notFound(): \WP_Error { return $this->error('yagent_not_found', 'گفت‌وگو پیدا نشد.', 404); }

    private function error(string $code, string $message, int $status): \WP_Error
    {
        return new \WP_Error($code, $message, ['status' => $status]);
    }
}
