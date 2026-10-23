<?php
namespace YAgent\Agent;
use YAgent\Infrastructure\Lock;
use YAgent\Infrastructure\Store;
if (!defined('ABSPATH')) { exit; }

/** Executes only fixed tools, with a durable, owner-bound receipt before every mutation. */
final class ToolExecutor
{
    private Lock $lock;
    public function __construct(private Store $store) { $this->lock = new Lock(); }

    public static function receiptId(string $actionId): string { return hash('sha256', "receipt\0" . $actionId); }
    public static function argumentsHash(array $args): string { return hash('sha256', self::canonical($args)); }
    public static function canonical(array $value): string
    {
        $sort = static function ($item) use (&$sort) {
            if (!is_array($item)) { return $item; }
            if (!array_is_list($item)) { ksort($item, SORT_STRING); }
            foreach ($item as $key => $child) { $item[$key] = $sort($child); }
            return $item;
        };
        return json_encode($sort($value), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
    }

    public function preview(string $name, array $args, int $userId, bool $readOnly = true): array|\WP_Error
    {
        $args = ToolRegistry::normalize($name, $args);
        if (is_wp_error($args)) { return $args; }
        $allowed = $this->authorize($name, $args, $userId, $readOnly);
        if (is_wp_error($allowed)) { return $allowed; }
        if ($name === 'manage_page') { return PageManager::preview($args,$userId); }
        if ($name === 'manage_plugin') { return PluginManager::preview($args,$userId); }
        if ($name === 'create_draft') {
            return ['args' => $args, 'before' => null, 'after' => [
                'post_type' => $args['post_type'], 'post_status' => 'draft', 'post_author' => $userId,
                'post_title' => $args['title'], 'post_content' => $args['content'], 'post_excerpt' => $args['excerpt'],
            ]];
        }
        if ($name === 'update_draft') {
            $before = $this->post($args['post_id']);
            if (!$before || !in_array($before['post_type'] ?? '', ['post', 'page'], true) || ($before['post_status'] ?? '') !== 'draft') {
                return self::error('yagent_draft_required', 'فقط پیش‌نویس نوشته یا برگه قابل ویرایش است.', 409);
            }
            if (!user_can($userId, 'edit_post', $args['post_id']) || !user_can($userId, ($before['post_type'] === 'page' ? 'edit_pages' : 'edit_posts'))) {
                return self::error('yagent_forbidden', 'مجوز ویرایش این پیش‌نویس را ندارید.', 403);
            }
            $after = $before;
            foreach (['title', 'content', 'excerpt'] as $field) {
                if (array_key_exists($field, $args)) { $after['post_' . $field] = $args[$field]; }
            }
            return ['args' => $args, 'before' => $before, 'after' => $after, 'before_hash' => self::argumentsHash($before)];
        }
        return ['args' => $args, 'before' => null, 'after' => null];
    }

    public function execute(string $name, array $args, int $userId, bool $readOnly, string $actionId): array|\WP_Error
    {
        $args = ToolRegistry::normalize($name, $args);
        if (is_wp_error($args)) { return $args; }
        $allowed = $this->authorize($name, $args, $userId, $readOnly);
        if (is_wp_error($allowed)) { return $allowed; }
        if ($actionId === '' || strlen($actionId) > 200 || preg_match('/[\x00-\x1f]/', $actionId)) {
            return self::error('yagent_action_conflict', 'شناسه اجرای معتبر لازم است.', 400);
        }
        $token = $this->lock->acquire('action:' . $actionId);
        if (is_wp_error($token)) { return $token; }
        $receipt = null; $postToken = null; $postId = null; $mutationStarted = false; $targetKey = null;
        try {
            $tool = ToolRegistry::get($name);
            $plan = $tool['requires_approval'] ? $this->approvedPlan($actionId, $name, $args, $userId) : null;
            if (is_wp_error($plan)) { return $plan; }
            $existing = $this->store->get('tool_receipt', self::receiptId($actionId), $userId);
            if (!is_wp_error($existing)) {
                if (!$this->receiptMatches($existing, $actionId, $name, $args, $userId)
                    || ($plan !== null && ($existing['data']['plan_hash'] ?? null) !== $plan['data']['plan_hash'])) {
                    return self::error('yagent_action_conflict', 'شناسه اجرا به درخواست دیگری تعلق دارد.', 409);
                }
                if ($existing['data']['status'] === 'executed') { return $this->executedResult($existing); }
                if($name==='build_plugin'){
                    $recovered=(new \YAgent\Artifacts\Deployment($this->store))->recover($actionId,$userId);
                    if(!is_wp_error($recovered)){
                        $data=$existing['data'];$data['status']='executed';$data['result']=$recovered;
                        $saved=$this->store->update('tool_receipt',$existing['id'],$existing['version'],$data);
                        if(!is_wp_error($saved))return $this->executedResult($saved);
                    }
                }
                $this->needsReview($existing);
                return self::error('yagent_needs_review', 'اجرای قبلی نتیجه قطعی ندارد؛ پیش از هر اقدام، سایت و رسید را بررسی کنید.', 409);
            }
            if ($existing->get_error_code() !== 'yagent_not_found') { return $existing; }
            if ($plan !== null) {
                if (($plan['data']['status'] ?? '') !== 'approved') {
                    return self::error('yagent_approval_required', 'تأیید صریح این برنامه پیش از اجرا لازم است.', 409);
                }
                if (($plan['data']['expires_at'] ?? 0) <= time()) {
                    return self::error('yagent_approval_expired', 'زمان تأیید برنامه گذشته است؛ برنامه تازه‌ای بسازید.', 409);
                }
            }
            if ($name === 'manage_plugin') {
                $targetKey = 'plugin-management';
                $postToken = $this->lock->acquire($targetKey);
                if (is_wp_error($postToken)) { return $postToken; }
            }
            if ($name === 'update_draft' || ($name === 'manage_page' && isset($args['post_id']))) {
                $postId = $args['post_id'];
                $targetKey = 'post:' . $postId;
                $postToken = $this->lock->acquire($targetKey);
                if (is_wp_error($postToken)) { return $postToken; }
                clean_post_cache($postId);
            }
            $preview = $this->preview($name, $args, $userId, $readOnly);
            if (is_wp_error($preview)) { return $preview; }
            if ($plan !== null && !hash_equals(self::argumentsHash($plan['data']['preview']), self::argumentsHash($preview))) {
                return self::error('yagent_stale_preview', 'هدف عملیات پس از تهیه برنامه تغییر کرده است؛ برنامه تازه‌ای بسازید.', 409);
            }
            $snapshot = ['operation' => $name, 'post_id' => $postId, 'before' => $preview['before'],
                'after' => null, 'before_hash' => $preview['before_hash'] ?? null, 'after_hash' => null];
            $receipt = $this->store->create('tool_receipt', $userId, [
                'owner' => $userId, 'action_id' => $actionId, 'tool' => $name, 'args' => $args,
                'args_hash' => self::argumentsHash($args), 'plan_hash' => $plan['data']['plan_hash'] ?? null,
                'status' => 'executing', 'result' => null, 'snapshot' => $snapshot,
                'rollback_status' => null, 'rollback_result' => null,
            ], self::receiptId($actionId));
            if (is_wp_error($receipt)) { return $receipt; }
            if (!$tool['requires_approval']) {
                if($name==='build_plugin'){
                    $artifact=(new \YAgent\Artifacts\PluginPackages($this->store))->create($args,$userId,$actionId);
                    if(is_wp_error($artifact))$result=$artifact;
                    else{
                        $deploy=\YAgent\Artifacts\Deployment::policy($args,$userId,$readOnly);
                        if(is_wp_error($deploy))$result=$deploy;
                        elseif($deploy){$mutationStarted=true;$result=(new \YAgent\Artifacts\Deployment($this->store))->deploy($artifact,$userId,$actionId,$readOnly);}
                        else $result=\YAgent\Artifacts\Deployment::artifactOnly($artifact);
                    }
                }else $result=$this->read($name, $args, $userId);
                if (is_wp_error($result)) { $this->needsReview($receipt); return $result; }
            } elseif (in_array($name,['manage_page','manage_plugin'],true)) {
                $mutationStarted = true;
                $result = $name==='manage_page' ? PageManager::execute($args,$userId) : PluginManager::execute($args,$userId);
                if (is_wp_error($result)) { $this->needsReview($receipt); return $result; }
                if ($name==='manage_plugin') { $snapshot['after']=$result['after']; $snapshot['after_hash']=self::argumentsHash($result['after']); unset($result['before'],$result['after']); }
                if ($name==='manage_page') {
                    $snapshot['post_id']=$result['post_id'];
                    $snapshot['after']=PageManager::snapshot($result['post_id']);
                    $snapshot['after_hash']=$snapshot['after']?self::argumentsHash($snapshot['after']):null;
                }
            } else {
                // From this point onward a PHP exception may follow a successful WordPress write.
                $mutationStarted = true;
                $fields = ['post_status' => 'draft'];
                foreach (['title', 'content', 'excerpt'] as $field) {
                    if (array_key_exists($field, $args)) { $fields['post_' . $field] = $args[$field]; }
                }
                if ($name === 'create_draft') {
                    $fields += ['post_type' => $args['post_type'], 'post_author' => $userId];
                    $written = wp_insert_post(wp_slash($fields), true);
                } else {
                    $fields['ID'] = $postId;
                    $written = wp_update_post(wp_slash($fields), true);
                }
                if (is_wp_error($written) || !is_int($written) || $written <= 0) {
                    $this->needsReview($receipt);
                    return self::error('yagent_needs_review', 'نتیجه نوشتن قطعی نیست؛ رسید و محتوای سایت را بررسی کنید.', 409);
                }
                $postId = $written;
                clean_post_cache($postId);
                $after = $this->post($postId);
                if (!$after || ($after['post_status'] ?? '') !== 'draft' || !in_array($after['post_type'] ?? '', ['post', 'page'], true)) {
                    $this->needsReview($receipt);
                    return self::error('yagent_needs_review', 'وضعیت نهایی پیش‌نویس نیازمند بررسی دستی است.', 409);
                }
                $snapshot['post_id'] = $postId;
                $snapshot['after'] = $after;
                $snapshot['after_hash'] = self::argumentsHash($after);
                $result = $this->summary($after);
            }
            $data = $receipt['data'];
            $data['status'] = 'executed'; $data['result'] = $result; $data['snapshot'] = $snapshot;
            $saved = $this->store->update('tool_receipt', $receipt['id'], $receipt['version'], $data);
            if (is_wp_error($saved)) {
                $this->needsReview($receipt);
                return self::error('yagent_needs_review', 'ثبت رسید نهایی نشد؛ برای جلوگیری از اجرای تکراری نتیجه را دستی بررسی کنید.', 409);
            }
            return $this->executedResult($saved);
        } catch (\Throwable $e) {
            if (is_array($receipt)) { $this->needsReview($receipt); }
            return self::error($mutationStarted ? 'yagent_needs_review' : 'yagent_tool_failed',
                $mutationStarted ? 'اجرا متوقف شد و نتیجه نیازمند بررسی دستی است؛ درخواست را تکرار نکنید.' : 'اجرای امن ابزار ممکن نشد.', 500);
        } finally {
            if (is_string($postToken) && $targetKey !== null) { $this->lock->release($targetKey, $postToken); }
            $this->lock->release('action:' . $actionId, $token);
        }
    }

    /** The caller may pass a receipt envelope or execution result; only its id is trusted. */
    public function rollback(array $supplied, int $userId): array|\WP_Error
    {
        $id = $supplied['id'] ?? $supplied['receipt_id'] ?? null;
        if (!is_string($id) || $id === '') { return self::error('yagent_rollback_conflict', 'رسید معتبر لازم است.', 400); }
        $receipt = $this->store->get('tool_receipt', $id, $userId);
        if (is_wp_error($receipt)) { return $receipt; }
        $actionId = $receipt['data']['action_id'] ?? '';
        if (!is_string($actionId) || !hash_equals(self::receiptId($actionId), $id)) {
            return self::error('yagent_rollback_conflict', 'رسید قابل بازگردانی نیست.', 409);
        }
        $token = $this->lock->acquire('action:' . $actionId);
        if (is_wp_error($token)) { return $token; }
        $postToken = null; $postId = null; $started = false;
        try {
            $receipt = $this->store->get('tool_receipt', $id, $userId);
            if (is_wp_error($receipt)) { return $receipt; }
            $data = $receipt['data'];
            if (($data['owner'] ?? null) !== $userId || ($data['status'] ?? '') !== 'executed'
                || !in_array($data['tool'] ?? '', ['create_draft', 'update_draft'], true)) {
                return self::error('yagent_rollback_conflict', 'فقط اجرای موفق ابزار نوشتن قابل بازگردانی است.', 409);
            }
            if (!user_can($userId, 'edit_posts')) { return self::error('yagent_forbidden', 'مجوز بازگردانی این تغییر را ندارید.', 403); }
            if (($data['rollback_status'] ?? '') === 'rolled_back') { return $this->rollbackResult($receipt); }
            if (in_array($data['rollback_status'] ?? '', ['executing', 'needs_review'], true)) {
                $this->needsReview($receipt, true);
                return self::error('yagent_needs_review', 'بازگردانی قبلی نتیجه قطعی ندارد؛ محتوا را دستی بررسی کنید.', 409);
            }
            $snapshot = $data['snapshot'] ?? [];
            $postId = $snapshot['post_id'] ?? null;
            if (!is_int($postId) || $postId < 1 || !is_array($snapshot['after'] ?? null)
                || !is_string($snapshot['after_hash'] ?? null)
                || !hash_equals($snapshot['after_hash'], self::argumentsHash($snapshot['after']))) {
                return self::error('yagent_rollback_conflict', 'تصویر معتبر تغییر در رسید وجود ندارد.', 409);
            }
            $postToken = $this->lock->acquire('post:' . $postId);
            if (is_wp_error($postToken)) { return $postToken; }
            clean_post_cache($postId);
            $current = $this->post($postId);
            if (!$current || ($current['post_status'] ?? '') !== 'draft'
                || !in_array($current['post_type'] ?? '', ['post', 'page'], true)
                || !hash_equals($snapshot['after_hash'], self::argumentsHash($current))) {
                return self::error('yagent_rollback_conflict', 'محتوا پس از اجرا تغییر کرده است؛ بازگردانی خودکار مجاز نیست.', 409);
            }
            if (!user_can($userId, 'edit_post', $postId)
                || !user_can($userId, $current['post_type'] === 'page' ? 'edit_pages' : 'edit_posts')) {
                return self::error('yagent_forbidden', 'مجوز بازگردانی این پیش‌نویس را ندارید.', 403);
            }
            if ($data['tool'] === 'create_draft') {
                if (!defined('EMPTY_TRASH_DAYS') || (int) EMPTY_TRASH_DAYS <= 0) {
                    return self::error('yagent_rollback_unsupported', 'زباله‌دان غیرفعال است؛ حذف دائمی خودکار مجاز نیست.', 409);
                }
                if (!user_can($userId, 'delete_post', $postId)) {
                    return self::error('yagent_forbidden', 'مجوز انتقال این پیش‌نویس به زباله‌دان را ندارید.', 403);
                }
            } else {
                if (!is_array($snapshot['before'] ?? null) || !is_string($snapshot['before_hash'] ?? null)
                    || !hash_equals($snapshot['before_hash'], self::argumentsHash($snapshot['before']))
                    || ($snapshot['before']['post_status'] ?? '') !== 'draft'
                    || ($snapshot['before']['post_type'] ?? '') !== $current['post_type']
                    || (int) ($snapshot['before']['ID'] ?? 0) !== $postId) {
                    return self::error('yagent_rollback_conflict', 'تصویر اولیه پیش‌نویس معتبر نیست.', 409);
                }
            }
            $data['rollback_status'] = 'executing';
            $saved = $this->store->update('tool_receipt', $id, $receipt['version'], $data);
            if (is_wp_error($saved)) { return $saved; }
            $receipt = $saved; $started = true;
            if ($data['tool'] === 'create_draft') {
                $written = wp_trash_post($postId);
            } else {
                $fields = ['ID' => $postId];
                foreach (['post_title', 'post_content', 'post_excerpt'] as $field) { $fields[$field] = $snapshot['before'][$field] ?? ''; }
                $written = wp_update_post(wp_slash($fields), true);
            }
            clean_post_cache($postId);
            $after = $this->post($postId);
            $valid = !is_wp_error($written) && (bool) $written && $after
                && ($after['post_status'] ?? '') === ($data['tool'] === 'create_draft' ? 'trash' : 'draft');
            if ($valid && $data['tool'] === 'update_draft') {
                foreach (['post_title', 'post_content', 'post_excerpt'] as $field) {
                    if (($after[$field] ?? '') !== ($snapshot['before'][$field] ?? '')) { $valid = false; }
                }
            }
            if (!$valid) {
                $this->needsReview($receipt, true);
                return self::error('yagent_needs_review', 'نتیجه بازگردانی قطعی نیست؛ پیش‌نویس را دستی بررسی کنید.', 409);
            }
            $data = $receipt['data']; $data['rollback_status'] = 'rolled_back';
            $data['rollback_result'] = $this->summary($after);
            $saved = $this->store->update('tool_receipt', $id, $receipt['version'], $data);
            if (is_wp_error($saved)) {
                $this->needsReview($receipt, true);
                return self::error('yagent_needs_review', 'بازگردانی انجام شد اما ثبت نتیجه نیازمند بررسی دستی است.', 409);
            }
            return $this->rollbackResult($saved);
        } catch (\Throwable $e) {
            if ($started && is_array($receipt)) { $this->needsReview($receipt, true); }
            return self::error($started ? 'yagent_needs_review' : 'yagent_tool_failed', 'بازگردانی امن کامل نشد؛ رسید و محتوا را بررسی کنید.', 500);
        } finally {
            if (is_string($postToken) && $postId !== null) { $this->lock->release('post:' . $postId, $postToken); }
            $this->lock->release('action:' . $actionId, $token);
        }
    }

    private function authorize(string $name, array $args, int $userId, bool $readOnly): bool|\WP_Error
    {
        $tool = ToolRegistry::get($name);
        if (is_wp_error($tool)) { return $tool; }
        if ($userId < 1 || !user_can($userId, $tool['capability'])
            || (($args['post_type'] ?? '') === 'page' && !user_can($userId, 'edit_pages'))) {
            return self::error('yagent_forbidden', 'مجوز استفاده از این ابزار را ندارید.', 403);
        }
        if ($readOnly && $tool['requires_approval']) {
            return self::error('yagent_read_only', 'در حالت فقط خواندنی تغییر محتوا مجاز نیست.', 403);
        }
        if($name==='build_plugin'){
            if(!user_can($userId,'manage_options'))return self::error('yagent_forbidden','مجوز ساخت بسته افزونه را ندارید.',403);
            $policy=\YAgent\Artifacts\Deployment::policy($args,$userId,$readOnly);
            if(is_wp_error($policy))return $policy;
        }
        return true;
    }

    private function approvedPlan(string $id, string $name, array $args, int $owner): array|\WP_Error
    {
        $plan = $this->store->get('approval', $id, $owner);
        if (is_wp_error($plan)) { return self::error('yagent_approval_required', 'برنامه ذخیره‌شده و تأییدشده برای این اجرا لازم است.', 409); }
        $data = $plan['data'];
        if (($data['owner'] ?? null) !== $owner || ($data['action_id'] ?? null) !== $id
            || !is_string($data['task_id'] ?? null) || !is_string($data['call_id'] ?? null)
            || !hash_equals($id, hash('sha256', $owner . "\0" . $data['task_id'] . "\0" . $data['call_id']))
            || ($data['tool'] ?? null) !== $name || !is_array($data['args'] ?? null)
            || !is_array($data['preview'] ?? null) || !is_string($data['args_hash'] ?? null)
            || !is_string($data['plan_hash'] ?? null)
            || !hash_equals($data['args_hash'], self::argumentsHash($args))
            || !hash_equals($data['args_hash'], self::argumentsHash($data['args']))
            || !hash_equals($data['plan_hash'], Approvals::planHash($data))) {
            return self::error('yagent_action_conflict', 'پارامترها یا برنامه ذخیره‌شده با این اجرا مطابقت ندارند.', 409);
        }
        return $plan;
    }

    private function receiptMatches(array $receipt, string $action, string $name, array $args, int $owner): bool
    {
        $data = $receipt['data'];
        return ($receipt['owner'] ?? null) === $owner && ($data['owner'] ?? null) === $owner
            && ($data['action_id'] ?? null) === $action && ($data['tool'] ?? null) === $name
            && is_array($data['args'] ?? null) && is_string($data['args_hash'] ?? null)
            && hash_equals($data['args_hash'], self::argumentsHash($args))
            && hash_equals($data['args_hash'], self::argumentsHash($data['args']));
    }
    private function executedResult(array $receipt): array
    {
        $data = $receipt['data'];
        $snapshot=$data['snapshot'];
        if(in_array($data['tool'],['manage_page','manage_plugin'],true))$snapshot=array_intersect_key($snapshot,array_flip(['operation','post_id','before_hash','after_hash']))+['stored_in_receipt'=>true];
        return ['action_id' => $data['action_id'], 'receipt_id' => $receipt['id'], 'tool' => $data['tool'],
            'status' => 'executed', 'result' => $data['result'], 'snapshot' => $snapshot];
    }
    private function rollbackResult(array $receipt): array
    {
        return ['action_id' => $receipt['data']['action_id'], 'receipt_id' => $receipt['id'],
            'tool' => $receipt['data']['tool'], 'status' => 'rolled_back', 'result' => $receipt['data']['rollback_result']];
    }
    private function needsReview(array $receipt, bool $rollback = false): void
    {
        try {
            $data = $receipt['data']; $data[$rollback ? 'rollback_status' : 'status'] = 'needs_review';
            $this->store->update('tool_receipt', $receipt['id'], $receipt['version'], $data);
        } catch (\Throwable $ignored) { /* An executing receipt already blocks all retries. */ }
    }
    private function post(int $id): ?array
    {
        $post = get_post($id, ARRAY_A, 'raw');
        if (!is_array($post)) { return null; }
        // Keep every WordPress post field: unrelated edits must also invalidate automatic rollback.
        unset($post['filter']);
        return $post;
    }
    private function summary(array $post): array
    {
        return ['post_id' => (int) $post['ID'], 'post_type' => $post['post_type'],
            'post_status' => $post['post_status'], 'title' => $post['post_title']];
    }
    private function read(string $name, array $args, int $userId): array|\WP_Error
    {
        if($name==='elementor_info')return PageManager::elementorInfo($args);
        if($name==='read_page')return PageManager::read($args,$userId);
        if($name==='read_content'){
            $p=get_post($args['post_id']);
            if(!$p||!in_array($p->post_type,['post','page'],true)||(!user_can($userId,'edit_post',$p->ID)&&!user_can($userId,'read_post',$p->ID)))return self::error('yagent_content_not_found','محتوای مجاز پیدا نشد.',404);
            $size=strlen($p->post_content);$offset=$args['offset'];
            if($offset>$size||($offset<$size&&(ord($p->post_content[$offset])&0xC0)===0x80)||!preg_match('//u',$p->post_content))return self::error('yagent_content_offset','موقعیت خواندن متن معتبر نیست؛ از next_offset نتیجه قبل استفاده کنید.',400);
            $chunk=$this->utf8Prefix(substr($p->post_content,$offset,$args['limit']),$args['limit']);$next=$offset+strlen($chunk);
            return ['post_id'=>(int)$p->ID,'post_type'=>$p->post_type,'post_status'=>$p->post_status,'title'=>$this->utf8Prefix($p->post_title,1024),'content'=>$chunk,'excerpt'=>$this->utf8Prefix($p->post_excerpt,512),'modified_gmt'=>$p->post_modified_gmt,'offset'=>$offset,'content_length_bytes'=>$size,'truncated'=>$next<$size,'next_offset'=>$next<$size?$next:null];
        }
        if($name==='search_content'){
            $query=new \WP_Query(['post_type'=>$args['post_type'],'post_status'=>['draft','publish','pending','private'],'s'=>$args['query'],'posts_per_page'=>$args['limit'],'offset'=>$args['offset'],'orderby'=>'ID','order'=>'DESC','suppress_filters'=>true,'no_found_rows'=>true]);$items=[];
            foreach($query->posts as$p)if(user_can($userId,'edit_post',$p->ID)||user_can($userId,'read_post',$p->ID))$items[]=$this->summary((array)$p);
            return ['items'=>$items,'limit'=>$args['limit'],'offset'=>$args['offset'],'may_have_more'=>count($query->posts)===$args['limit']];
        }
        if($name==='site_diagnostics'){
            return ['wordpress_version'=>get_bloginfo('version'),'php_version'=>PHP_VERSION,'memory_limit'=>WP_MEMORY_LIMIT,'debug'=>defined('WP_DEBUG')&&WP_DEBUG,'multisite'=>is_multisite(),'woocommerce_active'=>class_exists('WooCommerce'),'woocommerce_version'=>defined('WC_VERSION')?WC_VERSION:null,'elementor_active'=>did_action('elementor/loaded')>0,'elementor_version'=>defined('ELEMENTOR_VERSION')?ELEMENTOR_VERSION:null,'https'=>is_ssl(),'php_tokenizer'=>function_exists('token_get_all'),'generated_plugin_auto_install'=>(new \YAgent\AI\Config())->get()['auto_install_plugins']];
        }
        if ($name === 'site_info') {
            return ['name' => get_bloginfo('name'), 'description' => get_bloginfo('description'),
                'url' => home_url('/'), 'wordpress_version' => get_bloginfo('version'),
                'language' => get_bloginfo('language'), 'timezone' => get_option('timezone_string', '')];
        }
        if ($name === 'list_plugins') {
            if (!function_exists('get_plugins')) { require_once ABSPATH . 'wp-admin/includes/plugin.php'; }
            $plugins = [];
            foreach (get_plugins() as $file => $plugin) {
                $plugins[] = ['file' => $file, 'name' => wp_strip_all_tags($plugin['Name'] ?? ''),
                    'version' => (string) ($plugin['Version'] ?? ''), 'active' => is_plugin_active($file)];
            }
            return ['plugins' => $plugins];
        }
        if ($name === 'list_content') {
            $posts = get_posts(['post_type' => $args['post_type'], 'post_status' => $args['status'],
                'posts_per_page' => $args['limit'], 'offset' => $args['offset'], 'orderby' => 'ID',
                'order' => 'DESC', 'suppress_filters' => true]);
            $items = [];
            foreach ($posts as $post) {
                if (!user_can($userId, 'edit_post', $post->ID) && !user_can($userId, 'read_post', $post->ID)) { continue; }
                $items[] = ['post_id' => (int) $post->ID, 'post_type' => $post->post_type,
                    'post_status' => $post->post_status, 'title' => $post->post_title,
                    'excerpt' => $post->post_excerpt, 'modified_gmt' => $post->post_modified_gmt];
            }
            return ['items' => $items, 'limit' => $args['limit'], 'offset' => $args['offset']];
        }
        return self::error('yagent_unknown_tool', 'این ابزار در فهرست مجاز وجود ندارد.', 400);
    }
    private function utf8Prefix(string $text,int $bytes):string
    {
        $text=substr($text,0,$bytes);while($text!==''&&!preg_match('//u',$text))$text=substr($text,0,-1);return $text;
    }
    private static function error(string $code, string $message, int $status): \WP_Error
    {
        return new \WP_Error($code, $message, ['status' => $status]);
    }
}
