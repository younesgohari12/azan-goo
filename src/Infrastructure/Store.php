<?php
namespace YAgent\Infrastructure;
if (!defined('ABSPATH')) { exit; }

/** Small typed durable records. Writes use version compare-and-swap. */
final class Store
{
    private string $table;
    public function __construct(){global $wpdb;$this->table=$wpdb->prefix.'yagent_records';}
    public function install():void
    {
        global $wpdb;require_once ABSPATH.'wp-admin/includes/upgrade.php';
        $collate=$wpdb->get_charset_collate();
        dbDelta("CREATE TABLE {$this->table} (
            kind varchar(40) NOT NULL,
            id varchar(64) NOT NULL,
            owner bigint(20) unsigned NOT NULL,
            version bigint(20) unsigned NOT NULL DEFAULT 1,
            payload longtext NOT NULL,
            created_at datetime NOT NULL,
            updated_at datetime NOT NULL,
            PRIMARY KEY  (kind,id),
            KEY kind_owner (kind,owner),
            KEY created_at (created_at)
        ) $collate;");
        $columns=$wpdb->get_col("SHOW COLUMNS FROM {$this->table}");
        if($wpdb->last_error!==''||array_diff(['kind','id','owner','version','payload','created_at','updated_at'],$columns))throw new \RuntimeException('YAgent schema migration failed.');
    }
    public function create(string $kind,int $owner,array $data,?string $id=null):array|\WP_Error
    {
        global $wpdb;$id=$id??wp_generate_uuid4();$json=$this->validate($kind,$id,$data);if(is_wp_error($json))return $json;
        $now=gmdate('Y-m-d H:i:s');$previous=$wpdb->suppress_errors(true);
        $r=$wpdb->insert($this->table,['kind'=>$kind,'id'=>$id,'owner'=>$owner,'version'=>1,'payload'=>$json,'created_at'=>$now,'updated_at'=>$now],['%s','%s','%d','%d','%s','%s','%s']);
        $wpdb->suppress_errors($previous);
        if($r===false)return new \WP_Error('yagent_conflict','رکورد وجود دارد یا ذخیره‌سازی انجام نشد.',['status'=>409]);
        return $this->get($kind,$id);
    }
    public function get(string $kind,string $id,?int $owner=null):array|\WP_Error
    {
        global $wpdb;$row=$wpdb->get_row($wpdb->prepare("SELECT * FROM {$this->table} WHERE kind=%s AND id=%s",$kind,$id),ARRAY_A);$this->assertReadable();
        if(!$row||($owner!==null&&(int)$row['owner']!==$owner))return $this->notFound();
        return $this->decode($row);
    }
    public function update(string $kind,string $id,int $version,array $data):array|\WP_Error
    {
        global $wpdb;$json=$this->validate($kind,$id,$data);if(is_wp_error($json))return $json;
        $r=$wpdb->query($wpdb->prepare("UPDATE {$this->table} SET payload=%s,version=version+1,updated_at=%s WHERE kind=%s AND id=%s AND version=%d",$json,gmdate('Y-m-d H:i:s'),$kind,$id,$version));
        if($r!==1)return new \WP_Error('yagent_conflict','رکورد هم‌زمان تغییر کرده است؛ وضعیت را بازخوانی کنید.',['status'=>409]);
        return $this->get($kind,$id);
    }
    public function delete(string $kind,string $id,int $owner):bool|\WP_Error
    {global $wpdb;$r=$wpdb->delete($this->table,['kind'=>$kind,'id'=>$id,'owner'=>$owner],['%s','%s','%d']);return $r===1?true:$this->notFound();}
    public function listing(string $kind,int $owner,int $limit=50,int $offset=0):array
    {
        global $wpdb;$rows=$wpdb->get_results($wpdb->prepare("SELECT * FROM {$this->table} WHERE kind=%s AND owner=%d ORDER BY created_at DESC,id DESC LIMIT %d OFFSET %d",$kind,$owner,max(1,min(200,$limit)),max(0,$offset)),ARRAY_A);$this->assertReadable();return array_map([$this,'decode'],$rows);
    }
    public function all(string $kind,int $limit=10000):array
    {
        global $wpdb;$rows=$wpdb->get_results($wpdb->prepare("SELECT * FROM {$this->table} WHERE kind=%s ORDER BY created_at DESC,id DESC LIMIT %d",$kind,max(1,min(10000,$limit))),ARRAY_A);$this->assertReadable();return array_map([$this,'decode'],$rows);
    }
    private function validate(string $kind,string $id,array $data):string|\WP_Error
    {
        $json=wp_json_encode($data);
        if(!preg_match('/^[a-z][a-z0-9_]{0,39}$/D',$kind)||!preg_match('/^[a-zA-Z0-9_-]{1,64}$/D',$id)||!is_string($json)||strlen($json)>1048576)return new \WP_Error('yagent_invalid_record','رکورد نامعتبر یا بزرگ‌تر از یک مگابایت است.',['status'=>400]);
        return $json;
    }
    private function decode(array $row):array
    {
        $data=json_decode($row['payload'],true);if(!is_array($data)||json_last_error()!==JSON_ERROR_NONE)throw new \RuntimeException('YAgent record integrity failure.');
        return ['id'=>$row['id'],'kind'=>$row['kind'],'owner'=>(int)$row['owner'],'version'=>(int)$row['version'],'data'=>$data,'created_at'=>$row['created_at'],'updated_at'=>$row['updated_at']];
    }
    private function assertReadable():void{global $wpdb;if($wpdb->last_error!=='')throw new \RuntimeException('YAgent storage unavailable.');}
    private function notFound():\WP_Error{return new \WP_Error('yagent_not_found','رکورد پیدا نشد یا دسترسی ندارید.',['status'=>404]);}
}
