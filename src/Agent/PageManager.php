<?php
namespace YAgent\Agent;
if (!defined('ABSPATH')) { exit; }

/** WordPress page lifecycle and Elementor documents. No PHP evaluation or filesystem edits. */
final class PageManager
{
    private const META = ['_elementor_data','_elementor_page_settings','_elementor_edit_mode','_elementor_template_type','_elementor_version','_wp_page_template'];
    public static function normalize(array $args): array|\WP_Error
    {
        $allowed=['action','post_id','title','content','excerpt','status','editor','elementor_data','elementor_settings','slug','parent_id','menu_order','template'];
        if (($args && array_is_list($args)) || array_diff(array_keys($args),$allowed)) return self::error('yagent_tool_args','پارامترهای مدیریت صفحه معتبر نیستند.',400);
        $action=$args['action']??null;
        if (!in_array($action,['create','update','publish','unpublish','trash','restore','delete'],true)) return self::error('yagent_tool_args','عملیات صفحه معتبر نیست.',400);
        foreach ($args as $key=>$value) {
            if (in_array($key,['post_id','parent_id','menu_order'],true)) {
                if (!is_int($value)||$value<0||($key==='post_id'&&$value<1)) return self::error('yagent_tool_args','شناسه و ترتیب صفحه باید عدد صحیح باشد.',400);
            } elseif (!is_string($value)||str_contains($value,"\0")||!preg_match('//u',$value)||strlen($value)>200000) return self::error('yagent_tool_args','متن صفحه معتبر نیست یا بیش از اندازه بزرگ است.',400);
        }
        if ($action==='create') {
            if (isset($args['post_id'])||!isset($args['title'])||trim($args['title'])==='') return self::error('yagent_tool_args','برای ساخت صفحه عنوان لازم است.',400);
            $args+=['editor'=>isset($args['elementor_data'])?'elementor':'html','status'=>'draft','content'=>''];
        } elseif (!isset($args['post_id'])) return self::error('yagent_tool_args','شناسه دقیق صفحه لازم است.',400);
        if (!in_array($action,['create','update'],true)&&count($args)!==2) return self::error('yagent_tool_args','این عملیات فقط action و post_id می‌پذیرد.',400);
        if ($action==='update'&&count($args)<3) return self::error('yagent_tool_args','تغییری برای ویرایش صفحه ارائه نشده است.',400);
        if (isset($args['status'])&&!in_array($args['status'],['draft','publish','private','pending'],true)) return self::error('yagent_tool_args','وضعیت صفحه معتبر نیست.',400);
        if (isset($args['editor'])&&!in_array($args['editor'],['html','elementor'],true)) return self::error('yagent_tool_args','ویرایشگر باید html یا elementor باشد.',400);
        foreach (['title','slug','template'] as $key) if(isset($args[$key])) {
            if(strlen($args[$key])>1000) return self::error('yagent_tool_args','عنوان، نامک یا قالب بیش از اندازه بزرگ است.',400);
            $args[$key]=$key==='slug'?sanitize_title($args[$key]):sanitize_text_field($args[$key]);
        }
        if(isset($args['title'])&&$args['title']==='') return self::error('yagent_tool_args','عنوان خالی مجاز نیست.',400);
        foreach(['content','excerpt']as$key)if(isset($args[$key])&&str_contains($args[$key],'<?'))return self::error('yagent_tool_args','کد صفحه HTML/CSS/JS است؛ اجرای PHP در صفحه پشتیبانی نمی‌شود.',400);
        foreach(['elementor_data','elementor_settings']as$key)if(isset($args[$key])){
            try{$decoded=json_decode($args[$key],true,64,JSON_THROW_ON_ERROR);}catch(\Throwable $e){return self::error('yagent_tool_args','JSON المنتور معتبر نیست.',400);}
            if(!is_array($decoded)||($key==='elementor_data'&&!array_is_list($decoded))||($key==='elementor_settings'&&$decoded&&array_is_list($decoded)))return self::error('yagent_tool_args','ساختار JSON المنتور معتبر نیست.',400);
            if($key==='elementor_settings'&&!$decoded)return self::error('yagent_tool_args','تنظیمات خالی تغییری ایجاد نمی‌کند؛ برای بازنشانی، مقدار کنترل‌ها را صریح تعیین کنید.',400);
            if($key==='elementor_settings')foreach(array_keys($decoded)as$k)if(str_starts_with((string)$k,'post_')||in_array($k,['menu_order','comment_status','template'],true))return self::error('yagent_tool_args','عنوان، وضعیت و قالب را در پارامترهای اصلی ابزار تعیین کنید.',400);
            $args[$key]=wp_json_encode($decoded,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);
        }
        if(isset($args['elementor_data'])||isset($args['elementor_settings'])){
            if(isset($args['editor'])&&$args['editor']!=='elementor')return self::error('yagent_tool_args','برای دادهٔ المنتور editor باید elementor باشد.',400);
            $args['editor']='elementor';
        }
        if(($args['editor']??'')==='elementor'&&isset($args['content'])){
            if($args['content']!=='')return self::error('yagent_tool_args','متن HTML و دادهٔ المنتور را هم‌زمان جایگزین نکنید.',400);
            unset($args['content']);
        }
        if($action==='create'&&($args['editor']??'')==='elementor'&&!isset($args['elementor_data']))return self::error('yagent_tool_args','برای ساخت صفحه المنتوری elementor_data لازم است.',400);
        ksort($args,SORT_STRING);return $args;
    }

    public static function snapshot(int $id): ?array
    {
        clean_post_cache($id);$post=get_post($id,ARRAY_A,'raw');
        if(!$post||$post['post_type']!=='page')return null;
        unset($post['filter']);$meta=[];foreach(self::META as$key)$meta[$key]=get_post_meta($id,$key,false);
        return ['post'=>$post,'meta'=>$meta];
    }

    public static function preview(array $args,int $user): array|\WP_Error
    {
        $args=self::normalize($args);if(is_wp_error($args))return $args;
        if(!user_can($user,'edit_pages'))return self::error('yagent_forbidden','مجوز مدیریت برگه را ندارید.',403);
        $before=isset($args['post_id'])?self::snapshot($args['post_id']):null;
        if(isset($args['post_id'])){
            if(!$before)return self::error('yagent_page_not_found','برگه پیدا نشد.',404);
            if(!user_can($user,'edit_post',$args['post_id']))return self::error('yagent_forbidden','مجوز ویرایش این برگه را ندارید.',403);
            if(!function_exists('wp_check_post_lock'))require_once ABSPATH.'wp-admin/includes/post.php';
            $locked=wp_check_post_lock($args['post_id']);if($locked&&$locked!==$user)return self::error('yagent_page_locked','این برگه در ویرایشگر کاربر دیگری باز است.',409);
        }
        $action=$args['action'];$status=$before['post']['post_status']??'draft';
        if(in_array($action,['trash','restore','delete'],true)&&!user_can($user,'delete_post',$args['post_id']))return self::error('yagent_forbidden','مجوز حذف این برگه را ندارید.',403);
        if($action==='trash'&&(!defined('EMPTY_TRASH_DAYS')||EMPTY_TRASH_DAYS<=0))return self::error('yagent_trash_disabled','زباله‌دان غیرفعال است؛ برای حذف دائمی عملیات delete لازم است.',409);
        if($action==='restore'&&$status!=='trash')return self::error('yagent_page_state','این برگه در زباله‌دان نیست.',409);
        if($status==='trash'&&!in_array($action,['restore','delete'],true))return self::error('yagent_page_state','ابتدا برگه را از زباله‌دان بازیابی کنید.',409);
        $nextStatus=$args['status']??($action==='publish'?'publish':($action==='unpublish'?'draft':$status));
        if(in_array($nextStatus,['publish','private'],true)&&!in_array($action,['trash','restore','delete'],true)&&!user_can($user,'publish_pages'))return self::error('yagent_forbidden','مجوز انتشار برگه را ندارید.',403);
        if(isset($args['parent_id'])&&$args['parent_id']!==0){
            $parent=get_post($args['parent_id']);if(!$parent||$parent->post_type!=='page'||!user_can($user,'edit_post',$parent->ID)||$parent->ID===($args['post_id']??0)||in_array($args['post_id']??0,get_post_ancestors($parent),true))return self::error('yagent_tool_args','برگه والد معتبر نیست.',400);
        }
        if(isset($args['template'])){
            $templates=wp_get_theme()->get_page_templates(null,'page');
            if($args['template']!=='default'&&!isset($templates[$args['template']])&&!in_array($args['template'],['elementor_canvas','elementor_header_footer'],true))return self::error('yagent_tool_args','قالب برگه در سایت موجود نیست.',400);
        }
        foreach(['content','excerpt']as$key)if(isset($args[$key])&&!user_can($user,'unfiltered_html'))$args[$key]=wp_kses_post($args[$key]);
        $wasElementor=($before['meta']['_elementor_edit_mode'][0]??'')==='builder';
        if(isset($args['content'])&&$wasElementor&&($args['editor']??'')!=='html')return self::error('yagent_editor_required','این برگه المنتوری است؛ برای تبدیل صریح به کد editor=html تعیین کنید.',409);
        if(($args['editor']??'')==='elementor'){
            if(!class_exists('Elementor\\Plugin')||!did_action('elementor/loaded'))return self::error('yagent_elementor_unavailable','المنتور فعال نیست.',409);
            if(get_current_user_id()!==$user)return self::error('yagent_forbidden','کاربر جاری برای ذخیره المنتور معتبر نیست.',403);
            if(!user_can($user,'unfiltered_html'))return self::error('yagent_forbidden','ویرایش مستقیم JSON المنتور به مجوز کد HTML نیاز دارد.',403);
            if(isset($args['elementor_data'])){
                $count=0;$ids=[];$valid=self::elements(json_decode($args['elementor_data'],true),$count,$ids);
                if(is_wp_error($valid))return $valid;
            }
            if(isset($args['post_id'])){
                $doc=\Elementor\Plugin::$instance->documents->get($args['post_id'],false);
                if(!$doc||!$doc->is_editable_by_current_user())return self::error('yagent_forbidden','این سند با المنتور قابل ویرایش نیست.',403);
            }
        }
        if(2*strlen(wp_json_encode($before))+3*strlen(wp_json_encode($args))+65536>1048576)return self::error('yagent_page_snapshot_limit','حجم صفحه و تغییر برای ثبت رسید کامل بیش از حد است؛ تغییر کوچک‌تری ارائه کنید.',400);
        return ['args'=>$args,'before'=>$before,'after'=>['operation'=>$action,'requested'=>$args,'permanent'=>$action==='delete'],'before_hash'=>$before?ToolExecutor::argumentsHash($before):null];
    }

    private static function elements(array $elements,int &$count,array &$ids,int $depth=0): bool|\WP_Error
    {
        if($depth>20)return self::error('yagent_elementor_data','عمق عناصر المنتور بیش از حد است.',400);
        foreach($elements as$el){
            if(++$count>1000||!is_array($el)||!is_string($el['id']??null)||!preg_match('/^[a-zA-Z0-9_-]{1,40}$/',$el['id'])||isset($ids[$el['id']])||!in_array($el['elType']??'', ['container','section','column','widget'],true)||!is_array($el['settings']??null)||!is_array($el['elements']??null)||!array_is_list($el['elements']))return self::error('yagent_elementor_data','شناسه یا ساختار عناصر المنتور معتبر نیست.',400);
            $ids[$el['id']]=true;
            if($el['elType']==='widget'&&(!is_string($el['widgetType']??null)||!\Elementor\Plugin::$instance->widgets_manager->get_widget_types($el['widgetType'])))return self::error('yagent_elementor_widget','ویجت درخواست‌شده در المنتور نصب نیست.',400);
            $valid=self::elements($el['elements'],$count,$ids,$depth+1);if(is_wp_error($valid))return $valid;
        }return true;
    }

    public static function execute(array $args,int $user): array|\WP_Error
    {
        $preview=self::preview($args,$user);if(is_wp_error($preview))return $preview;$args=$preview['args'];$action=$args['action'];$id=$args['post_id']??0;
        if(in_array($action,['trash','restore','delete'],true)){
            $result=$action==='delete'?wp_delete_post($id,true):($action==='trash'?wp_trash_post($id):wp_untrash_post($id));
            clean_post_cache($id);
            if(!$result||($action==='delete'?get_post($id)!==null:($action==='trash'?get_post_status($id)!=='trash':get_post_status($id)==='trash')))return self::error('yagent_needs_review','نتیجه عملیات برگه قطعی نیست؛ رسید را بررسی کنید.',409);
            return $action==='delete'?['post_id'=>$id,'deleted'=>true,'permanent'=>true]:self::result($id);
        }
        $fields=[];foreach(['title'=>'post_title','content'=>'post_content','excerpt'=>'post_excerpt','status'=>'post_status','slug'=>'post_name','parent_id'=>'post_parent','menu_order'=>'menu_order']as$key=>$field)if(array_key_exists($key,$args))$fields[$field]=$args[$key];
        if($action==='publish')$fields['post_status']='publish';if($action==='unpublish')$fields['post_status']='draft';
        if(($fields['post_status']??null)==='publish' && isset($preview['before']['post']['post_date_gmt']) && strtotime($preview['before']['post']['post_date_gmt'].' UTC')>time()){ $fields['post_date']=current_time('mysql');$fields['post_date_gmt']=current_time('mysql',true); }
        // Save builder documents as drafts until the full document has been saved.
        $requested=$fields['post_status']??($preview['before']['post']['post_status']??'draft');
        if($action==='create'){
            $fields+=['post_type'=>'page','post_author'=>$user];if(($args['editor']??'')==='elementor')$fields['post_status']='draft';
            $written=wp_insert_post(wp_slash($fields),true);
        }else{$fields['ID']=$id;$written=wp_update_post(wp_slash($fields),true);}
        if(is_wp_error($written)||!$written)return self::error('yagent_needs_review','ذخیره برگه کامل نشد؛ وضعیت سایت را بررسی کنید.',409);
        $id=(int)$written;
        if(isset($args['template']))update_post_meta($id,'_wp_page_template',$args['template']);
        if(($args['editor']??'')==='html')delete_post_meta($id,'_elementor_edit_mode');
        if(($args['editor']??'')==='elementor'){
            $doc=\Elementor\Plugin::$instance->documents->get($id,false);if(!$doc||!$doc->is_editable_by_current_user())return self::error('yagent_needs_review','برگه ساخته شد ولی سند المنتور در دسترس نیست.',409);
            $payload=[];if(isset($args['elementor_data']))$payload['elements']=json_decode($args['elementor_data'],true);
            if(isset($args['elementor_settings']))$payload['settings']=json_decode($args['elementor_settings'],true);
            if(!$doc->save($payload))return self::error('yagent_needs_review','برگه ذخیره شد ولی ذخیره المنتور کامل نشد.',409);
            $doc->set_is_built_with_elementor(true);
            if($action==='create'&&$requested!=='draft'){$r=wp_update_post(['ID'=>$id,'post_status'=>$requested],true);if(is_wp_error($r)||!$r)return self::error('yagent_needs_review','انتشار برگه المنتور کامل نشد.',409);}
        }
        clean_post_cache($id);$post=get_post($id);
        if(!$post||$post->post_status!==$requested)return self::error('yagent_needs_review','وضعیت نهایی برگه با درخواست یکسان نیست.',409);
        return self::result($id);
    }
    private static function result(int $id): array
    {
        $p=get_post($id);return ['post_id'=>$id,'title'=>$p->post_title,'post_status'=>$p->post_status,'editor'=>get_post_meta($id,'_elementor_edit_mode',true)==='builder'?'elementor':'html','url'=>get_permalink($id),'edit_url'=>get_edit_post_link($id,'raw'),'verified'=>'database','content_hash'=>ToolExecutor::argumentsHash(self::snapshot($id))];
    }
    public static function read(array $args,int $user): array|\WP_Error
    {
        $s=self::snapshot($args['post_id']);if(!$s||!user_can($user,'edit_post',$args['post_id']))return self::error('yagent_page_not_found','برگه قابل دسترس پیدا نشد.',404);
        $field=$args['field'];$source=$field==='content'?$s['post']['post_content']:($field==='elementor_data'?(string)($s['meta']['_elementor_data'][0]??'[]'):wp_json_encode($s['meta']['_elementor_page_settings'][0]??new \stdClass()));
        $offset=$args['offset'];$len=strlen($source);if($offset>$len||($offset<$len&&(ord($source[$offset])&0xC0)===0x80))return self::error('yagent_content_offset','از next_offset استفاده کنید.',400);
        $chunk=substr($source,$offset,$args['limit']);while($chunk!==''&&!preg_match('//u',$chunk))$chunk=substr($chunk,0,-1);$next=$offset+strlen($chunk);
        return self::result($args['post_id'])+['field'=>$field,'source'=>$chunk,'offset'=>$offset,'next_offset'=>$next<$len?$next:null,'total_bytes'=>$len,'slug'=>$s['post']['post_name'],'parent_id'=>(int)$s['post']['post_parent'],'menu_order'=>(int)$s['post']['menu_order'],'template'=>$s['meta']['_wp_page_template'][0]??'default'];
    }
    public static function elementorInfo(array $args): array|\WP_Error
    {
        if(!class_exists('Elementor\\Plugin')||!did_action('elementor/loaded'))return self::error('yagent_elementor_unavailable','المنتور فعال نیست.',409);
        $widgets=\Elementor\Plugin::$instance->widgets_manager->get_widget_types();
        if(!isset($args['widget'])){$items=[];foreach($widgets as$name=>$w)$items[]=['name'=>$name,'title'=>wp_strip_all_tags($w->get_title())];return ['version'=>defined('ELEMENTOR_VERSION')?ELEMENTOR_VERSION:null,'widgets'=>array_slice($items,$args['offset'],$args['limit']),'total'=>count($items),'offset'=>$args['offset']];}
        $widget=$widgets[$args['widget']]??null;if(!$widget)return self::error('yagent_elementor_widget','ویجت نصب نیست.',404);
        $controls=[];foreach($widget->get_controls()as$name=>$c)$controls[]=['name'=>$name,'type'=>$c['type']??null,'label'=>wp_strip_all_tags($c['label']??''),'options'=>isset($c['options'])?array_keys($c['options']):null];
        return ['widget'=>$args['widget'],'controls'=>array_slice($controls,$args['offset'],$args['limit']),'total'=>count($controls),'offset'=>$args['offset']];
    }
    private static function error(string $code,string $message,int $status): \WP_Error{return new \WP_Error($code,$message,['status'=>$status]);}
}
