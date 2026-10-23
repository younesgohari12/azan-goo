<?php
namespace YAgent\Agent;
if (!defined('ABSPATH')) { exit; }

/** Fixed tool surface, including policy-controlled deployment of generated source packages. */
final class ToolRegistry
{
    public static function definitions(bool $readOnly = true): array
    {
        $object = static fn(array $properties, array $required = []): array => [
            'type' => 'object', 'properties' => $properties, 'required' => $required,
            'additionalProperties' => false,
        ];
        $text = ['type' => 'string'];
        $type = ['type' => 'string', 'enum' => ['post', 'page']];
        $definitions = [
            ['name'=>'manage_plugin','description'=>'Activate, deactivate or permanently delete an exact installed plugin basename from list_plugins. Delete requires inactive target. Server approval required; YAgent itself and active dependencies are protected. No overwrite.','parameters'=>$object(['action'=>['type'=>'string','enum'=>['activate','deactivate','delete']],'plugin'=>$text],['action','plugin']),'capability'=>'activate_plugins','risk'=>'high','requires_approval'=>true,'reversible'=>false],
            ['name'=>'elementor_info','description'=>'Discover installed Elementor widget names or a named widget control schema. Use before building unfamiliar widgets.','parameters'=>$object(['widget'=>$text,'offset'=>['type'=>'integer','minimum'=>0],'limit'=>['type'=>'integer','minimum'=>1,'maximum'=>60]]),'capability'=>'edit_pages','risk'=>'low','requires_approval'=>false,'reversible'=>false],
            ['name'=>'read_page','description'=>'Read page source, Elementor elements or page settings as UTF8 byte chunks. Follow next_offset until null before replacing a document.','parameters'=>$object(['post_id'=>['type'=>'integer','minimum'=>1],'field'=>['type'=>'string','enum'=>['content','elementor_data','elementor_settings']],'offset'=>['type'=>'integer','minimum'=>0,'maximum'=>10485760],'limit'=>['type'=>'integer','minimum'=>256,'maximum'=>4096]],['post_id']),'capability'=>'edit_pages','risk'=>'low','requires_approval'=>false,'reversible'=>false],
            ['name'=>'manage_page','description'=>'Manage WordPress pages with server approval. create/update accept title,content(HTML/CSS/JS),status,slug,parent_id,menu_order,template. Elementor editor accepts elementor_data JSON string: full elements array (id,elType,settings,elements,widgetType for widgets), plus optional elementor_settings JSON object. Read full source first. Explicit editor=html converts Elementor page to code. Other actions need only action+post_id: publish,unpublish(draft),trash,restore,delete(permanent).','parameters'=>$object(['action'=>['type'=>'string','enum'=>['create','update','publish','unpublish','trash','restore','delete']],'post_id'=>['type'=>'integer','minimum'=>1],'title'=>$text,'content'=>$text,'excerpt'=>$text,'status'=>['type'=>'string','enum'=>['draft','publish','private','pending']],'editor'=>['type'=>'string','enum'=>['html','elementor']],'elementor_data'=>$text,'elementor_settings'=>$text,'slug'=>$text,'parent_id'=>['type'=>'integer','minimum'=>0],'menu_order'=>['type'=>'integer','minimum'=>0],'template'=>$text],['action']),'capability'=>'edit_pages','risk'=>'high','requires_approval'=>true,'reversible'=>false],
            ['name'=>'build_plugin','description'=>'Build a complete WordPress plugin ZIP. Main file slug.php needs Plugin Name header and ABSPATH guard. Omit auto_install to follow manager policy; false is ZIP-only. New folders only. Max20 text files,64KiB each,128KiB total; PHP/CSS/JS/JSON/TXT/MD/HTML.','parameters'=>$object(['slug'=>['type'=>'string','pattern'=>'^[a-z][a-z0-9-]{1,59}$'],'files'=>['type'=>'array','minItems'=>1,'maxItems'=>20,'items'=>$object(['path'=>$text,'content'=>$text],['path','content'])],'auto_install'=>['type'=>'boolean']],['slug','files']),'capability'=>'install_plugins','risk'=>'high','requires_approval'=>false,'reversible'=>false],
            ['name'=>'read_content','description'=>'Read post/page source in UTF-8 byte pages (offset,next_offset; default2048 bytes). Read every required page before replacing complete content; never replace it with one partial page.','parameters'=>$object(['post_id'=>['type'=>'integer','minimum'=>1],'offset'=>['type'=>'integer','minimum'=>0,'maximum'=>10485760],'limit'=>['type'=>'integer','minimum'=>256,'maximum'=>4096]],['post_id']),'capability'=>'edit_posts','risk'=>'low','requires_approval'=>false,'reversible'=>false],
            ['name'=>'search_content','description'=>'در عنوان و متن نوشته‌ها یا برگه‌ها جست‌وجو کن.','parameters'=>$object(['query'=>$text,'post_type'=>$type,'limit'=>['type'=>'integer','minimum'=>1,'maximum'=>30],'offset'=>['type'=>'integer','minimum'=>0]],['query']),'capability'=>'edit_posts','risk'=>'low','requires_approval'=>false,'reversible'=>false],
            ['name'=>'site_diagnostics','description'=>'نسخه PHP و وردپرس، تنظیمات پایه و وضعیت ووکامرس و المنتور را بدون اطلاعات محرمانه بخوان.','parameters'=>$object([]),'capability'=>'manage_options','risk'=>'low','requires_approval'=>false,'reversible'=>false],
            ['name' => 'site_info', 'description' => 'اطلاعات عمومی سایت وردپرس را بخوان.',
                'parameters' => $object([]), 'capability' => 'manage_options', 'risk' => 'low',
                'requires_approval' => false, 'reversible' => false],
            ['name' => 'list_plugins', 'description' => 'نام، نسخه و وضعیت فعال بودن افزونه‌ها را بخوان.',
                'parameters' => $object([]), 'capability' => 'activate_plugins', 'risk' => 'low',
                'requires_approval' => false, 'reversible' => false],
            ['name' => 'list_content', 'description' => 'نوشته‌ها یا برگه‌های قابل دسترس کاربر را بخوان.',
                'parameters' => $object(['post_type' => $type,
                    'status' => ['type' => 'string', 'enum' => ['draft', 'publish', 'pending', 'private', 'trash', 'any']],
                    'limit' => ['type' => 'integer', 'minimum' => 1, 'maximum' => 50],
                    'offset' => ['type' => 'integer', 'minimum' => 0]]),
                'capability' => 'edit_posts', 'risk' => 'low', 'requires_approval' => false, 'reversible' => false],
            ['name' => 'create_draft', 'description' => 'پس از تأیید صریح کاربر یک پیش‌نویس بساز.',
                'parameters' => $object(['title' => $text, 'content' => $text, 'excerpt' => $text, 'post_type' => $type], ['title']),
                'capability' => 'edit_posts', 'risk' => 'medium', 'requires_approval' => true, 'reversible' => true],
            ['name' => 'update_draft', 'description' => 'پس از تأیید صریح کاربر فقط عنوان، متن یا خلاصه یک پیش‌نویس را ویرایش کن.',
                'parameters' => $object(['post_id' => ['type' => 'integer', 'minimum' => 1],
                    'title' => $text, 'content' => $text, 'excerpt' => $text], ['post_id']),
                'capability' => 'edit_posts', 'risk' => 'medium', 'requires_approval' => true, 'reversible' => true],
        ];
        return $readOnly ? array_values(array_filter($definitions, static fn(array $tool): bool => !$tool['requires_approval'])) : $definitions;
    }

    public static function get(string $name): array|\WP_Error
    {
        foreach (self::definitions(false) as $tool) {
            if ($tool['name'] === $name) { return $tool; }
        }
        return new \WP_Error('yagent_unknown_tool', 'این ابزار در فهرست مجاز وجود ندارد.', ['status' => 400]);
    }
    public static function available(bool $readOnly,int $owner):array
    {
        return array_values(array_filter(self::definitions($readOnly),static fn(array $tool):bool=>user_can($owner,$tool['capability'])));
    }

    /** Validate raw JSON types before sanitizing; never silently discard unknown properties. */
    public static function normalize(string $name, array $args): array|\WP_Error
    {
        $tool = self::get($name);
        if (is_wp_error($tool)) { return $tool; }
        if ($name==='manage_page') { return PageManager::normalize($args); }
        if ($name==='manage_plugin') { return PluginManager::normalize($args); }
        if ($name==='build_plugin') { return \YAgent\Artifacts\PluginPackages::normalize($args); }
        $invalid = static fn(): \WP_Error => new \WP_Error('yagent_tool_args', 'پارامترهای ابزار معتبر نیستند.', ['status' => 400]);
        if ($args && array_is_list($args)) { return $invalid(); }
        $schema = $tool['parameters'];
        foreach ($args as $key => $value) {
            if (!is_string($key) || !isset($schema['properties'][$key])) { return $invalid(); }
            $property = $schema['properties'][$key];
            if (($property['type'] === 'string' && (!is_string($value) || str_contains($value, "\0") || !preg_match('//u', $value)))
                || ($property['type'] === 'integer' && !is_int($value))) { return $invalid(); }
            if (isset($property['enum']) && !in_array($value, $property['enum'], true)) { return $invalid(); }
            if ((isset($property['minimum']) && $value < $property['minimum'])
                || (isset($property['maximum']) && $value > $property['maximum'])) { return $invalid(); }
        }
        foreach ($schema['required'] as $key) {
            if (!array_key_exists($key, $args)) { return $invalid(); }
        }
        if ($name === 'list_content') {
            $args += ['post_type' => 'post', 'status' => 'any', 'limit' => 20, 'offset' => 0];
        }
        if ($name==='search_content') {
            if(trim($args['query'])===''||strlen($args['query'])>500)return $invalid();
            $args+=['post_type'=>'post','limit'=>20,'offset'=>0];
        }
        if ($name==='elementor_info') { if(isset($args['widget'])&&strlen($args['widget'])>128)return $invalid(); $args+=['offset'=>0,'limit'=>40]; }
        if ($name==='read_page') { $args+=['field'=>'content','offset'=>0,'limit'=>2048]; }
        if ($name==='read_content') { $args+=['offset'=>0,'limit'=>2048]; }
        if ($name === 'create_draft') { $args += ['post_type' => 'post', 'content' => '', 'excerpt' => '']; }
        if ($name === 'update_draft' && count($args) < 2) { return $invalid(); }
        foreach (['title' => 1000, 'content' => 200000, 'excerpt' => 20000] as $key => $limit) {
            if (!array_key_exists($key, $args)) { continue; }
            if (strlen($args[$key]) > $limit) { return $invalid(); }
            $args[$key] = $key === 'title' ? sanitize_text_field($args[$key]) : wp_kses_post($args[$key]);
            if ($key === 'title' && trim($args[$key]) === '') { return $invalid(); }
        }
        ksort($args, SORT_STRING);
        return $args;
    }
}
