<?php
namespace YAgent\Agent;
use YAgent\Infrastructure\Lock;
use YAgent\Infrastructure\Store;
if (!defined('ABSPATH')) { exit; }

/** A bounded immutable plan. Only an explicit approve decision invokes its write. */
final class Approvals
{
    private Lock $lock;
    public function __construct(private Store $store, private ToolExecutor $executor) { $this->lock = new Lock(); }

    public static function planHash(array $data): string
    {
        $immutable = [];
        foreach (['owner', 'task_id', 'call_id', 'tool', 'args', 'args_hash', 'request_args_hash', 'action_id', 'preview', 'expires_at'] as $key) {
            $immutable[$key] = $data[$key] ?? null;
        }
        return ToolExecutor::argumentsHash($immutable);
    }

    public function prepare(string $taskId, string $callId, string $tool, array $args, int $userId, bool $readOnly): array|\WP_Error
    {
        if ($taskId === '' || $callId === '' || strlen($taskId) > 200 || strlen($callId) > 200
            || preg_match('/[\x00-\x1f]/', $taskId . $callId)) {
            return self::error('yagent_tool_args', 'شناسه کار و فراخوانی معتبر لازم است.', 400);
        }
        $permission = $this->permission($tool, $args, $userId, $readOnly);
        if (is_wp_error($permission)) { return $permission; }
        try { $requestHash = ToolExecutor::argumentsHash($args); }
        catch (\Throwable $e) { return self::error('yagent_tool_args', 'پارامترهای ابزار معتبر نیستند.', 400); }
        $id = hash('sha256', $userId . "\0" . $taskId . "\0" . $callId);
        $token = $this->lock->acquire('approval:' . $id);
        if (is_wp_error($token)) { return $token; }
        try {
            // Resolve the bound request before looking at the current target. A completed or uncertain
            // write must remain visible even after its target changes or disappears.
            $existing = $this->store->get('approval', $id, $userId);
            if (!is_wp_error($existing)) {
                $data = $existing['data'];
                if (!$this->valid($existing, $userId) || ($data['task_id'] ?? null) !== $taskId
                    || ($data['call_id'] ?? null) !== $callId || ($data['tool'] ?? null) !== $tool
                    || !is_string($data['request_args_hash'] ?? null)
                    || !hash_equals($data['request_args_hash'], $requestHash)) {
                    return self::error('yagent_action_conflict', 'این فراخوانی به برنامه دیگری تعلق دارد.', 409);
                }
                return $existing;
            }
            if ($existing->get_error_code() !== 'yagent_not_found') { return $existing; }
            $preview = $this->executor->preview($tool, $args, $userId, $readOnly);
            if (is_wp_error($preview)) { return $preview; }
            $data = ['owner' => $userId, 'task_id' => $taskId, 'call_id' => $callId, 'tool' => $tool,
                'args' => $preview['args'], 'args_hash' => ToolExecutor::argumentsHash($preview['args']),
                'request_args_hash' => $requestHash, 'action_id' => $id, 'preview' => $preview,
                'status' => 'pending', 'expires_at' => time() + 900, 'result' => null, 'error' => null];
            $data['plan_hash'] = self::planHash($data);
            return $this->store->create('approval', $userId, $data, $id);
        } finally { $this->lock->release('approval:' . $id, $token); }
    }

    public function decide(string $id, int $userId, string $decision, bool $readOnly): array|\WP_Error
    {
        if (!in_array($decision, ['approve', 'reject', 'cancel'], true)) {
            return self::error('yagent_tool_args', 'تصمیم باید تأیید، رد یا لغو باشد.', 400);
        }
        $token = $this->lock->acquire('approval:' . $id);
        if (is_wp_error($token)) { return $token; }
        try {
            $approval = $this->store->get('approval', $id, $userId);
            if (is_wp_error($approval)) { return $approval; }
            if (!$this->valid($approval, $userId)) {
                return self::error('yagent_action_conflict', 'یکپارچگی برنامه تأیید نمی‌شود؛ برنامه تازه‌ای بسازید.', 409);
            }
            $data = $approval['data'];
            $permission = $this->permission($data['tool'], $data['args'], $userId, $decision === 'approve' && $readOnly);
            if (is_wp_error($permission)) { return $permission; }
            $status = $data['status'] ?? '';
            if ($status === 'executed') { return $approval; }
            $terminal = $decision === 'reject' ? 'rejected' : ($decision === 'cancel' ? 'cancelled' : null);
            if ($terminal !== null) {
                if ($status === $terminal) { return $approval; }
                if ($status !== 'pending') {
                    return self::error('yagent_approval_state', 'برنامه در این وضعیت قابل رد یا لغو نیست.', 409);
                }
                $data['status'] = $terminal;
                return $this->store->update('approval', $id, $approval['version'], $data);
            }
            if (in_array($status, ['rejected', 'cancelled'], true)) {
                return self::error('yagent_approval_state', 'برنامه رد یا لغو شده قابل اجرا نیست.', 409);
            }
            if (!in_array($status, ['pending', 'approved', 'failed'], true)) {
                return self::error('yagent_approval_state', 'وضعیت برنامه برای اجرا معتبر نیست.', 409);
            }
            if ($status === 'pending') {
                if ($data['expires_at'] <= time()) {
                    return $this->fail($approval, self::error('yagent_approval_expired', 'مهلت برنامه گذشته است؛ برنامه تازه‌ای بسازید.', 409));
                }
                $data['status'] = 'approved';
                $approval = $this->store->update('approval', $id, $approval['version'], $data);
                if (is_wp_error($approval)) { return $approval; }
            }
            // Executor independently verifies the stored approved plan, capabilities, expiry and
            // current preview under the action and post locks. A caller cannot bypass approval.
            $result = $this->executor->execute($data['tool'], $data['args'], $userId, $readOnly, $id);
            if (is_wp_error($result)) { return $this->fail($approval, $result); }
            $data = $approval['data']; $data['status'] = 'executed'; $data['result'] = $result; $data['error'] = null;
            $saved = $this->store->update('approval', $id, $approval['version'], $data);
            // A durable executed receipt remains authoritative if saving this projection fails.
            return $saved;
        } finally { $this->lock->release('approval:' . $id, $token); }
    }

    public function listing(int $owner): array|\WP_Error { return $this->store->listing('approval', $owner, 100); }

    private function valid(array $approval, int $owner): bool
    {
        $data = $approval['data'] ?? [];
        return ($approval['owner'] ?? null) === $owner && ($data['owner'] ?? null) === $owner
            && ($data['action_id'] ?? null) === ($approval['id'] ?? null)
            && is_string($data['task_id'] ?? null) && is_string($data['call_id'] ?? null)
            && hash_equals($data['action_id'], hash('sha256', $owner . "\0" . $data['task_id'] . "\0" . $data['call_id']))
            && is_array($data['args'] ?? null) && is_array($data['preview'] ?? null)
            && is_int($data['expires_at'] ?? null) && is_string($data['args_hash'] ?? null)
            && is_string($data['request_args_hash'] ?? null) && is_string($data['plan_hash'] ?? null)
            && hash_equals($data['args_hash'], ToolExecutor::argumentsHash($data['args']))
            && hash_equals($data['plan_hash'], self::planHash($data));
    }
    private function permission(string $name, array $args, int $owner, bool $readOnly): bool|\WP_Error
    {
        $tool = ToolRegistry::get($name);
        if (is_wp_error($tool)) { return $tool; }
        if (!$tool['requires_approval']) { return self::error('yagent_approval_not_required', 'این ابزار خواندنی نیاز به تأیید ندارد.', 400); }
        if ($owner < 1 || !user_can($owner, $tool['capability'])
            || (($args['post_type'] ?? '') === 'page' && !user_can($owner, 'edit_pages'))) {
            return self::error('yagent_forbidden', 'مجوز اجرای این برنامه را ندارید.', 403);
        }
        if ($readOnly) { return self::error('yagent_read_only', 'در حالت فقط خواندنی تغییر محتوا مجاز نیست.', 403); }
        return true;
    }
    private function fail(array $approval, \WP_Error $error): \WP_Error
    {
        $data = $approval['data']; $data['status'] = 'failed';
        $data['error'] = ['code' => $error->get_error_code(), 'message' => $error->get_error_message()];
        $this->store->update('approval', $approval['id'], $approval['version'], $data);
        return $error;
    }
    private static function error(string $code, string $message, int $status): \WP_Error
    {
        return new \WP_Error($code, $message, ['status' => $status]);
    }
}
