(() => {
  'use strict';
  const $=id=>document.getElementById(id),panel=$('ya-work-panel');if(!panel)return;
  const fa=n=>Number(n||0).toLocaleString('fa-IR');
  const names={elementor_info:'بررسی ویجت‌های المنتور',manage_page:'مدیریت صفحه',read_page:'خواندن صفحه',manage_plugin:'مدیریت افزونه',site_info:'خواندن اطلاعات سایت',list_plugins:'بررسی افزونه‌ها',list_content:'دریافت فهرست محتوا',read_content:'خواندن متن محتوا',search_content:'جست‌وجوی نوشته‌ها',site_diagnostics:'بررسی وضعیت فنی سایت',build_plugin:'ساخت افزونه',create_draft:'ساخت پیش‌نویس',update_draft:'ویرایش پیش‌نویس'};
  const stage={preparing:'ثبت و آماده‌سازی درخواست',processing:'پردازش درخواست',syncing:'ذخیره پاسخ و به‌روزرسانی گفتگو',approve:'اجرای تغییر تأییدشده',reject:'ثبت رد تغییر',rollback:'بازگردانی تغییر',stopping:'ثبت درخواست توقف'};
  let latest={},localStarted=0,epoch=-1;
  function clock(){
    const d=latest.task?.data,start=d?.started_at||localStarted,end=d?.finished_at||Date.now()/1000;
    const seconds=start?Math.max(0,Math.floor(end-start)):0;
    $('ya-work-elapsed').textContent=fa(Math.floor(seconds/60)).padStart(2,'۰')+':'+fa(seconds%60).padStart(2,'۰');
  }
  function summary(r){
    const d=r.result||{};
    if(r.status==='failed')return r.error?.message||'این ابزار کامل نشد.';
    if(r.tool==='build_plugin'&&d.deployment){
      if(d.deployment.activated&&d.deployment.health_verified)return 'افزونه نصب، فعال و راه‌اندازی آن بررسی شد.';
      if(['failed','failed_deactivated','needs_review'].includes(d.deployment.status))return d.deployment.error?.message||'بسته ساخته شد؛ نصب یا فعال‌سازی کامل نشد.';
    }
    if(r.tool==='build_plugin')return d.filename?'فایل '+d.filename+' آماده دانلود است.':'بسته آماده دریافت است.';
    if(r.tool==='manage_page')return d.deleted?'صفحه به‌صورت دائمی حذف شد.':(d.title?'«'+d.title+'» · '+({publish:'منتشر شد',draft:'پیش‌نویس',trash:'در زباله‌دان',private:'خصوصی',pending:'در انتظار بررسی'}[d.post_status]||d.post_status):'وضعیت صفحه بررسی شد.');
    if(r.tool==='manage_plugin')return ({activate:'افزونه فعال شد.',deactivate:'افزونه غیرفعال شد.',delete:'افزونه حذف شد.'}[d.action]||'وضعیت افزونه بررسی شد.');
    if(r.tool==='create_draft'||r.tool==='update_draft')return d.title?'«'+d.title+'» · پیش‌نویس ذخیره شد.':'تغییر با رسید ثبت شد.';
    if(r.tool==='list_content'||r.tool==='search_content')return fa(d.items?.length)+' مورد دریافت شد.';
    if(r.tool==='list_plugins')return fa(d.plugins?.length)+' افزونه بررسی شد.';
    if(r.tool==='read_content')return d.truncated?'بخشی از متن دریافت شد؛ ادامه متن قابل خواندن است.':'متن درخواست‌شده دریافت شد.';
    return 'نتیجه واقعی ابزار دریافت شد.';
  }
  function item(title,detail,state){
    const li=document.createElement('li');li.className='ya-work-item';li.dataset.state=state;
    const dot=document.createElement('span');dot.className='ya-work-item-dot';dot.setAttribute('aria-hidden','true');dot.textContent=state==='done'?'✓':state==='error'?'!':state==='waiting'?'·':'•';
    const head=document.createElement('span');head.className='ya-work-item-title';head.textContent=title;
    const text=document.createElement('p');text.className='ya-work-item-detail';text.textContent=detail;li.append(dot,head,text);return li;
  }
  function deploymentItems(deployment,terminal){
    const stages=new Map();
    for(const e of (deployment?.events||[]).slice(-20))stages.set(e.stage,e);
    return [...stages.values()].map(e=>item(e.message||'مرحله نصب افزونه','',
      e.status==='failed'||e.status==='error'?'error':e.status==='running'?(terminal?'waiting':'active'):'done'));
  }
  function render(v){
    latest=v;const d=v.task?.data||null;
    if(epoch!==v.epoch){epoch=v.epoch;localStarted=v.busy?Date.now()/1000:0;}
    if(!d&&v.busy&&!localStarted)localStarted=Date.now()/1000;
    let state='idle',title='آماده گفتگو',description='درخواستتان را بنویسید؛ مراحل اجرا اینجا نمایش داده می‌شوند.',badge='آماده';
    const terminal=d&&['completed','failed','cancelled','needs_review'].includes(d.status);
    if(v.busy){
      state='working';title='هوش مصنوعی در حال کار است';badge='در حال اجرا';
      description=stage[v.phase]||'در حال پردازش درخواست شما…';
      if(d?.phase==='model_inflight')description='در حال دریافت پاسخ از مدل انتخاب‌شده…';
      if(d?.recovery?.attempts&&['model','model_inflight'].includes(d.phase))description='در حال اصلاح خودکار پاسخ ناقص مدل…';
      if(d?.phase==='context'&&v.phase!=='approve')description='در حال آماده‌سازی زمینه گفتگو و درخواست مدل…';
      if(d?.phase==='tools'&&d.pending_tools?.[d.tool_cursor])description='در حال '+(names[d.pending_tools[d.tool_cursor].name]||'اجرای ابزار')+'…';
    }
    if(d?.status==='awaiting_approval'&&!v.mutating){state='awaiting_approval';title='منتظر تأیید شما';badge='نیاز به تأیید';description='پیش‌نمایش تغییر را در گفتگو بررسی و تأیید یا رد کنید.';}
    else if(d?.status==='retry_wait'){state=v.busy?'retry_wait':'paused';title=v.busy?'در انتظار تلاش مجدد':'آماده ادامه کار';badge='در انتظار';description=v.busy?'سرویس زمان بیشتری خواسته است؛ طبق سیاست ذخیره‌شده ادامه می‌دهیم.':'برای ادامه همین درخواست، دکمه ادامه کار را بزنید.';}
    else if(terminal&&!v.mutating){
      state=d.status;
      if(state==='completed'){title='گفتگو تمام شد';badge='تکمیل شد';description='پاسخ و نتیجه عملیات آماده است؛ می‌توانید درخواست بعدی را بنویسید.';}
      if(state==='failed'){title='کار کامل نشد';badge='خطا';description=d.error?.message||'نتیجه درخواست را بررسی کنید؛ این وضعیت به معنی موفقیت نیست.';}
      if(state==='cancelled'){title='کار متوقف شد';badge='متوقف';description='اجرای مراحل بعدی لغو شد. نتایج ثبت‌شده در گفتگو قابل مشاهده‌اند.';}
      if(state==='needs_review'){title='نیازمند بررسی شما';badge='بررسی نتیجه';description=d.error?.message||'نتیجه اجرای قبلی قطعی نیست؛ رسید و وضعیت سایت را بررسی کنید.';}
    }
    else if(!v.busy&&(d||v.pending)){state='paused';title='آماده ادامه کار';badge='متوقف موقت';description='این کار هنوز پایان نیافته است. برای ادامه، دکمه ادامه کار را بزنید.';}
    else if(v.loading&&!d){state='paused';title='در حال دریافت وضعیت';badge='بازیابی';description='سابقه و مراحل ذخیره‌شده گفتگو خوانده می‌شوند.';}
    if(v.error&&!v.busy&&!terminal){state='connection';title='ارتباط نیاز به بررسی دارد';badge='بررسی اتصال';description=v.error+' برای بررسی همین کار، ادامه را بزنید.';}
    panel.dataset.state=state;panel.setAttribute('aria-busy',state==='working'?'true':'false');
    $('ya-work-title').textContent=title;$('ya-work-description').textContent=description;$('ya-work-badge').textContent=badge;
    $('ya-work-models').textContent=fa(d?.model_calls);$('ya-work-tools').textContent=fa(d?.tool_calls);
    const list=$('ya-work-timeline'),entries=[];
    if(d||v.busy||v.pending){
      entries.push(item('دریافت درخواست',d?'درخواست ثبت شد و به همین گفتگو متصل است.':'در حال ثبت درخواست شما…',d?'done':'active'));
      if(d){
        entries.push(item('آماده‌سازی گفتگو',d.context?.summary_used?'زمینه گفتگو با خلاصه ذخیره‌شده آماده شد.':'بررسی زمینه و پیام‌های این گفتگو',d.phase==='context'?(v.busy?'active':'waiting'):'done'));
        if(d.recovery?.attempts)entries.push(item('اصلاح خودکار پاسخ مدل',d.recovery.message||'یک تلاش اصلاحی محدود ثبت شد.',terminal?(d.status==='completed'?'done':'error'):['model','model_inflight'].includes(d.phase)?'active':'done'));
        if(d.model_calls)entries.push(item('ارتباط با مدل',fa(d.model_calls)+' مرحله مدل'+(d.selection?.model?' · '+d.selection.model:''),d.phase==='model_inflight'?(v.busy?'active':'waiting'):d.status==='failed'?'error':'done'));
        for(const r of (d.results||[]).slice(-20)){
          const deployment=r.result?.deployment;const failed=deployment&&['failed','failed_deactivated','needs_review'].includes(deployment.status);
          entries.push(item(names[r.tool]||'اجرای ابزار',summary(r),r.status==='executed'&&!failed?'done':'error'));
          entries.push(...deploymentItems(deployment,terminal));
        }
        if(d.deployment_progress&&!(d.results||[]).some(r=>r.result?.deployment?.deployment_id===d.deployment_progress.deployment_id))entries.push(...deploymentItems(d.deployment_progress,terminal));
        if(d.phase==='tools'||d.status==='awaiting_approval')for(const [i,call]of (d.pending_tools||[]).slice(d.tool_cursor||0).entries())entries.push(item(names[call.name]||'اجرای ابزار',i===0&&d.status==='awaiting_approval'?'اجرا پس از تأیید صریح شما انجام می‌شود.':i===0&&v.busy?'در حال اجرای این مرحله…':'در انتظار مرحله قبل',i===0&&v.busy&&d.status!=='awaiting_approval'?'active':'waiting'));
        if(terminal&&!v.mutating)entries.push(item(title,d.status==='completed'?'نتیجه در گفتگو ثبت شد.':description,d.status==='completed'?'done':d.status==='cancelled'?'waiting':'error'));
      }
    }
    list.replaceChildren(...entries);$('ya-work-empty').hidden=entries.length>0;$('ya-work-count').textContent=entries.length?fa(entries.length)+' مرحله':'هنوز شروع نشده';clock();
  }
  window.addEventListener('yagent:activity',e=>render(e.detail));
  setInterval(()=>{if(latest.task&&!latest.task.data.finished_at||latest.busy)clock();},1000);
})();
