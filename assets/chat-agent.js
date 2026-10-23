(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  if(!$('ya-chat-form')||!window.YAgentUI)return;
  const terminal=new Set(['completed','failed','cancelled','needs_review']);
  const labels={pending:'آماده اجرا',running:'در حال اجرا',awaiting_approval:'منتظر تأیید شما',completed:'پایان یافت',failed:'ناموفق',cancelled:'لغو شد',needs_review:'نیازمند بررسی دستی',retry_wait:'در انتظار تلاش مجدد'};
  let settings=null,identity='',key='',state={},task=null,running=false,loading=false,stopRequested=false,generation=0,sending=false,lastChatBusy=false;
  let statusMessage='',uploads=[],uploading=false;const attachmentNames=new Map();
  let activityEpoch=0,activityPhase='',activityError='',activitySnapshot=null,activityMutation=false;
  function activity(snapshot=activitySnapshot||task){window.dispatchEvent(new CustomEvent('yagent:activity',{detail:{task:sending?null:snapshot,busy:running||sending||activityMutation,mutating:activityMutation,loading,pending:!!state.pending,phase:activityPhase,error:activityError,epoch:activityEpoch}}));}
  function watchProgress(id){
    let stopped=false,timer;const runGeneration=generation;
    async function read(){
      if(stopped||runGeneration!==generation)return;
      try{const snapshot=await api('tasks/'+id);if(!stopped&&runGeneration===generation){activitySnapshot=snapshot;activity(snapshot);}}catch{/* Status polling is read-only and never retries the operation. */}
      if(!stopped)timer=setTimeout(read,1500);
    }
    timer=setTimeout(read,1200);return()=>{stopped=true;clearTimeout(timer);activitySnapshot=null;};
  }
  function active(){return task&&!terminal.has(task.data.status);}
  function controls(){
    const ready=settings?.connection?.has_key&&settings?.connection?.model&&!settings?.dirty&&!settings?.busy&&!loading&&!uploading;
    for(const b of $('ya-file-list').querySelectorAll('button'))b.disabled=running||sending||uploading||active()||!!state.pending;
    $('ya-files').disabled=!ready||running||sending||active()||!!state.pending;
    $('ya-send').disabled=!ready||running||sending||active()||!!state.pending;
    $('ya-message').disabled=!ready||running||active()||!!state.pending;
    $('ya-new-chat').disabled=running||active()||!!state.pending||loading;
    $('ya-agent-mode').disabled=running||active()||!!state.pending;
    $('ya-continue').disabled=running||loading||(!active()&&!state.pending);
    $('ya-stop').disabled=!active()||stopRequested;
    $('ya-load-chat').disabled=running||active()||!!state.pending||loading;
    $('ya-conversations').disabled=$('ya-load-chat').disabled;
    for(const b of $('ya-results').querySelectorAll('button[data-rollback]'))b.disabled=running||activityMutation||b.dataset.done==='true';
    for(const b of $('ya-approvals').querySelectorAll('button'))b.disabled=running||activityMutation;
    const chatBusy=!!(running||sending||uploading||activityMutation||active()||state.pending);
    if(chatBusy!==lastChatBusy){lastChatBusy=chatBusy;window.dispatchEvent(new CustomEvent('yagent:chat-busy',{detail:chatBusy}));}
    activity();
  }
  function persist(){if(!key)return;const saved={conversationId:state.conversationId,taskId:state.taskId};if(state.pending)saved.pending={request_id:state.pending.request_id};try{localStorage.setItem(key,JSON.stringify(saved));}catch{statusMessage='حافظه مرورگر در دسترس نیست؛ شناسه کار را برای ادامه نگه دارید.';}}
  function note(text){$('ya-task-status').textContent=text;}
  async function api(path,method='GET',body){
    const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),((settings?.connection?.timeout||90)+30)*1000);
    try{
      const [route,query='']=path.split('?');const url=new URL(YAgentUI.rest+'v2/'+route,location.href);for(const [name,value]of new URLSearchParams(query))url.searchParams.set(name,value);
      const response=await fetch(url,{method,credentials:'same-origin',cache:'no-store',headers:{'X-WP-Nonce':YAgentUI.nonce,'Content-Type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:controller.signal});
      let data;try{data=await response.json();}catch{throw Error('پاسخ سرور JSON معتبر نیست. وضعیت کار را با «ادامه» بازخوانی کنید.');}
      if(!response.ok)throw Object.assign(Error(data.message||'درخواست انجام نشد.'),{code:data.code,status:response.status});return data;
    }catch(e){if(e.name==='AbortError')throw Error('انتظار مرورگر تمام شد؛ وضعیت اجرا نامشخص است. برای بازیابی همان کار «ادامه» را بزنید.');throw e;}
    finally{clearTimeout(timer);}
  }
  function message(role,text,id='',attachments=[]){const node=document.createElement('div');node.className='ya-message ya-'+(role==='user'?'user':'assistant');node.textContent=text;node.dataset.messageId=id;if(attachments.length){const files=document.createElement('small');files.className='ya-message-files';files.textContent='پیوست: '+attachments.map(id=>attachmentNames.get(id)||'فایل ذخیره‌شده').join('، ');node.append(document.createElement('br'),files);}$('ya-chat').append(node);}
  async function history(){
    if(!state.conversationId){$('ya-chat').replaceChildren();return;}
    const c=await api('conversations/'+state.conversationId);
    const ids=[...new Set(c.data.messages.flatMap(m=>m.attachments||[]))];
    await Promise.all(ids.map(async id=>{if(!attachmentNames.has(id)){try{const m=await api('uploads/'+id);attachmentNames.set(id,m.name);}catch{attachmentNames.set(id,'پیوست در دسترس نیست');}}}));
    $('ya-chat').replaceChildren();for(const m of c.data.messages)message(m.role,m.content,m.id,m.attachments||[]);
    if(!task&&c.data.active_task_id){task=await api('tasks/'+c.data.active_task_id);state.taskId=task.id;persist();}
    $('ya-chat').scrollTop=$('ya-chat').scrollHeight;
  }
  async function conversations(){
    const data=await api('conversations');const select=$('ya-conversations');select.replaceChildren(new Option('گفت‌وگوی جدید',''));
    for(const c of data.items)select.add(new Option(c.data.title+' · '+c.created_at,c.id));select.value=state.conversationId||'';
  }
  function button(label,fn){const b=document.createElement('button');b.type='button';b.className='button';b.textContent=label;b.addEventListener('click',fn);return b;}
  async function download(id){
    try{const d=await api('artifacts/'+id+'/download');const raw=atob(d.content_base64);const bytes=Uint8Array.from(raw,c=>c.charCodeAt(0));const blob=new Blob([bytes],{type:'application/zip'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=d.filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}catch(e){note(e.message);}
  }
  async function artifacts(){
    try{
      const data=await api('artifacts');$('ya-artifacts').replaceChildren();
      for(const p of data.items){const row=document.createElement('div');row.className='ya-artifact';const b=button('دانلود '+p.filename,()=>download(p.artifact_id));b.dataset.download=p.artifact_id;row.append(b);
        const info=document.createElement('p');info.textContent=p.manifest.length+' فایل · '+p.size+' بایت · بررسی نحوی PHP؛ عملکرد و امنیت آزمایش نشده';row.append(info);
        const details=document.createElement('details');const summary=document.createElement('summary');summary.textContent='فایل‌ها و شناسه بررسی';const pre=document.createElement('pre');pre.textContent=JSON.stringify({sha256:p.sha256,files:p.manifest},null,2);details.append(summary,pre);row.append(details);
        row.append(button('حذف بسته',async()=>{if(!confirm('این بسته ذخیره‌شده حذف شود؟'))return;try{await api('artifacts/'+p.artifact_id,'DELETE');await artifacts();}catch(e){note(e.message);}}));$('ya-artifacts').append(row);
      }
      if(!data.items.length)$('ya-artifacts').textContent='هنوز بسته‌ای ساخته نشده است.';
    }catch(e){$('ya-artifacts').textContent=e.message;}
  }
  async function render(){
    $('ya-approvals').replaceChildren();$('ya-results').replaceChildren();
    if(!task){$('ya-task-status').dataset.status='';note(state.pending?'ارسال قبلی نیازمند بازیابی است؛ ادامه را بزنید.':'');controls();return;}
    const d=task.data;
    if(terminal.has(d.status)&&d.output&&!Array.from($('ya-chat').children).some(n=>n.dataset.messageId===task.id+'_assistant'))message('assistant',d.output,task.id+'_assistant');
    note((labels[d.status]||d.status)+' · '+d.model_calls+' تماس مدل · '+d.tool_calls+' ابزار'+(d.error?' · '+d.error.message:'')+(statusMessage?' · '+statusMessage:''));
    for(const result of d.results||[]){
      const row=document.createElement('div');row.className='ya-tool-result';
      const titles={elementor_info:'بررسی المنتور',manage_page:'مدیریت صفحه',read_page:'خواندن صفحه',manage_plugin:'مدیریت افزونه',site_info:'اطلاعات سایت',list_plugins:'بررسی افزونه‌ها',list_content:'فهرست محتوا',read_content:'خواندن محتوا',search_content:'جست‌وجوی محتوا',site_diagnostics:'وضعیت فنی',build_plugin:'ساخت افزونه',create_draft:'ساخت پیش‌نویس',update_draft:'ویرایش پیش‌نویس'};
      const failed=result.status!=='executed'||['failed','failed_deactivated','needs_review'].includes(result.result?.deployment?.status);
      const head=document.createElement('div');head.className='ya-result-heading';head.dataset.state=failed?'failed':'done';
      const icon=document.createElement('span');icon.className='ya-result-icon';icon.textContent=failed?'!':'✓';icon.setAttribute('aria-hidden','true');
      const title=document.createElement('strong');title.textContent=titles[result.tool]||'نتیجه ابزار';const badge=document.createElement('small');badge.textContent=failed?'کامل نشد':'انجام شد';head.append(icon,title,badge);row.append(head);
      const details=document.createElement('details');details.className='ya-result-details';const caption=document.createElement('summary');caption.textContent='مشاهده جزئیات و رسید';const pre=document.createElement('pre');pre.textContent=JSON.stringify(result,null,2);details.append(caption,pre);row.append(details);
      if(result.receipt_id&&['create_draft','update_draft'].includes(result.tool)&&result.status==='executed'){
        const b=button('بازگردانی این تغییر',async()=>{b.disabled=true;activityMutation=true;activityPhase='rollback';controls();try{await api('receipts/'+result.receipt_id+'/rollback','POST',{confirm:true});b.dataset.done='true';const p=document.createElement('p');p.textContent='بازگردانی انجام شد.';row.append(p);}catch(e){note(e.message);activityError=e.message;b.disabled=false;}finally{activityMutation=false;activityPhase='';controls();}});b.dataset.rollback=result.receipt_id;row.append(b);
      }
      $('ya-results').append(row);
    }
    if(d.status==='awaiting_approval')for(const id of d.approval_ids){
      const a=await api('approvals/'+id);if(a.data.status!=='pending')continue;
      const box=document.createElement('div');box.className='ya-approval';const title=document.createElement('strong');title.textContent='پیش‌نمایش '+a.data.tool;const pre=document.createElement('pre');pre.textContent=JSON.stringify(a.data.preview,null,2);const hash=document.createElement('p');hash.textContent='طرح: '+a.data.plan_hash;box.append(title,pre,hash);
      for(const decision of ['approve','reject']){const b=button(decision==='approve'?'تأیید و اجرا':'رد تغییر',async()=>{
        for(const child of box.querySelectorAll('button'))child.disabled=true;
        activityMutation=true;activityPhase=decision;controls();
        try{await api('approvals/'+id+'/decision','POST',{decision,plan_hash:a.data.plan_hash});activityMutation=false;await run(true);}catch(e){note(e.message);activityError=e.message;for(const child of box.querySelectorAll('button'))child.disabled=false;}finally{activityMutation=false;activityPhase='';controls();}
      });b.dataset.decision=decision;box.append(b);}$('ya-approvals').append(box);
    }
    if(terminal.has(d.status)&&(d.results||[]).some(r=>r.tool==='build_plugin'))await artifacts();
    $('ya-task-status').dataset.status=d.status;controls();
  }
  async function run(force=false){
    if(running)return;running=true;stopRequested=false;activityError='';activityPhase=state.pending?'preparing':'processing';controls();const runId=generation;
    try{
      if(state.pending){
        try{task=typeof state.pending.prompt==='string'?await api('tasks','POST',state.pending):await api('requests/'+state.pending.request_id);}
        catch(e){
          if(e.status===404&&typeof state.pending.prompt!=='string'){delete state.pending;persist();note('درخواست قبلی روی سرور ثبت نشده است؛ متن را دوباره وارد کنید.');return;}
          if(typeof state.pending.prompt==='string'&&e.status&&e.status<500){
            try{task=await api('requests/'+state.pending.request_id);}
            catch(recovery){
              if(recovery.status===404){const prompt=state.pending.prompt;delete state.pending;persist();if(!$('ya-message').value)$('ya-message').value=prompt;$('ya-task-status').dataset.status='rejected';}
              throw e;
            }
          }else throw e;
        }
        state.taskId=task.id;state.conversationId=task.data.conversation_id;uploads=[];renderUploads();delete state.pending;persist();await history();
      }
      if(!state.taskId)return;
      task=await api('tasks/'+state.taskId);
      for(let step=0;(settings?.openConsumption||step<160)&&!stopRequested&&runId===generation;step++){
        if(terminal.has(task.data.status)||(task.data.status==='awaiting_approval'&&!(force&&step===0)))break;
        if(task.data.status==='retry_wait'&&task.data.retry_at*1000>Date.now()){
          await render();await new Promise(resolve=>setTimeout(resolve,Math.min(1000,task.data.retry_at*1000-Date.now())));continue;
        }
        activityPhase='processing';activity();const stopWatch=watchProgress(state.taskId);
        try{task=await api('tasks/'+state.taskId+'/step','POST',{});}finally{stopWatch();}
        await render();
      }
      activityPhase='syncing';activity();
      await history();await render();await conversations();await artifacts();
    }catch(e){statusMessage=e.message;activityError=e.message;note(e.message+' شناسه کار: '+(state.taskId||state.pending?.request_id||''));}
    finally{running=false;activityPhase='';activitySnapshot=null;controls();}
  }
  function renderUploads(){
    const list=$('ya-file-list');list.replaceChildren();
    for(const file of uploads){const row=document.createElement('span');row.className='ya-file-chip';const label=document.createElement('span');label.textContent=file.name+' · '+Math.ceil(file.size/1024)+' KB';const remove=button('×',async()=>{try{await api('uploads/'+file.id,'DELETE');uploads=uploads.filter(f=>f.id!==file.id);renderUploads();}catch(e){note(e.message);}});remove.setAttribute('aria-label','حذف '+file.name);remove.disabled=running||sending||uploading;row.append(label,remove);list.append(row);}
  }
  async function clearUploads(){const abandoned=uploads;uploads=[];renderUploads();for(const file of abandoned){try{await api('uploads/'+file.id,'DELETE');}catch{/* Kept private until explicitly removed. */}}}
  $('ya-files').addEventListener('change',async()=>{
    const files=Array.from($('ya-files').files);if(!files.length)return;uploading=true;controls();note('در حال آماده‌سازی پیوست‌ها…');
    try{for(const file of files){const form=new FormData();form.append('file',file);const response=await fetch(YAgentUI.rest+'v2/uploads',{method:'POST',credentials:'same-origin',headers:{'X-WP-Nonce':YAgentUI.nonce},body:form});const data=await response.json();if(!response.ok)throw Error(data.message||'بارگذاری پیوست انجام نشد.');uploads.push(data);attachmentNames.set(data.id,data.name);renderUploads();}note('پیوست‌ها آماده‌اند؛ برای ارسال به مدل، پیام را بفرستید.');}catch(e){note(e.message);}finally{uploading=false;$('ya-files').value='';renderUploads();controls();}
  });
  $('ya-chat-form').addEventListener('submit',async event=>{
    event.preventDefault();const text=$('ya-message').value.trim()||(uploads.length?'این فایل‌های پیوست را بررسی کن.':'');if(!text||uploading||running||sending||active()||state.pending||settings?.dirty)return;
    sending=true;activityEpoch++;activityPhase='preparing';activityError='';activitySnapshot=null;$('ya-task-status').dataset.status='submitting';note('در حال ثبت درخواست…');$('ya-results').replaceChildren();$('ya-approvals').replaceChildren();controls();
    try{
      const setup=await api('assistant/settings?provider='+encodeURIComponent(settings.provider));
      const agent=$('ya-agent-mode').checked&&setup.supports_tools&&setup.capabilities?.supports_tools!==false;
      const body={prompt:text,provider:settings.provider,mode:agent?'agent':'chat',read_only:!setup.allow_writes,request_id:crypto.randomUUID()};
      if(uploads.length)body.attachments=uploads.map(f=>f.id);
      if(setup.profile_id)body.profile_id=setup.profile_id;if(state.conversationId)body.conversation_id=state.conversationId;
      state.pending=body;task=null;state.taskId=null;statusMessage='';persist();$('ya-message').value='';sending=false;await run();
    }catch(e){note(e.message);activityError=e.message;}finally{sending=false;controls();}
  });
  $('ya-continue').addEventListener('click',()=>run(true));
  $('ya-stop').addEventListener('click',async()=>{
    if(!state.taskId)return;stopRequested=true;activityPhase='stopping';controls();
    try{task=await api('tasks/'+state.taskId+'/cancel','POST',{});await history();await render();}catch(e){note(e.message);}finally{stopRequested=false;controls();}
  });
  $('ya-new-chat').addEventListener('click',async()=>{if(running||active()||state.pending)return;await clearUploads();generation++;activityEpoch++;activitySnapshot=null;activityError='';state={};task=null;statusMessage='';persist();$('ya-chat').replaceChildren();$('ya-message').value='';await render();await conversations();});
  $('ya-load-chat').addEventListener('click',async()=>{
    if(running||active()||state.pending)return;const id=$('ya-conversations').value;generation++;activityEpoch++;activitySnapshot=null;activityError='';state={conversationId:id};task=null;persist();
    try{await history();if(!task&&id){const tasks=await api('tasks');task=tasks.items.find(t=>t.data.conversation_id===id)||null;if(task){state.taskId=task.id;persist();}}await render();}catch(e){note(e.message);}
  });
  $('ya-artifacts-refresh').addEventListener('click',artifacts);
  window.addEventListener('yagent:settings',async event=>{
    settings=event.detail;const next=settings.provider+'|'+(settings.connection?.model||'');controls();
    if(identity===next)return;identity=next;generation++;activityEpoch++;activitySnapshot=null;activityError='';loading=true;controls();key='yagent-chat:'+next;task=null;state={};
    try{
      try{state=JSON.parse(localStorage.getItem(key)||'{}')||{};}catch{state={};}
      if(typeof state!=='object'||Array.isArray(state))state={};
      for(const name of ['conversationId','taskId'])if(state[name]&&!/^[A-Za-z0-9_-]{1,64}$/.test(state[name]))delete state[name];
      if(state.pending){
        if(!/^[A-Za-z0-9_-]{1,64}$/.test(state.pending.request_id||''))delete state.pending;
        else{
          state.pending={request_id:state.pending.request_id};
          try{const recovered=await api('requests/'+state.pending.request_id);state.taskId=recovered.id;state.conversationId=recovered.data.conversation_id;delete state.pending;}
          catch(e){if(e.status===404){delete state.pending;statusMessage='درخواست قبلی ثبت نشده است؛ متن را دوباره وارد کنید.';}else throw e;}
          persist();
        }
      }
      if(state.taskId){task=await api('tasks/'+state.taskId);state.conversationId=task.data.conversation_id;}
      await history();await conversations();await artifacts();await render();
    }catch(e){
      if(e.status===404){state={};task=null;persist();}
      note('بارگذاری سابقه انجام نشد: '+e.message+'؛ شناسه ذخیره‌شده برای بازیابی نگه داشته می‌شود.');
    }
    finally{loading=false;controls();}
  });
  controls();
})();
