(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  if (!$('ya-settings-form') || !window.YAgentUI) return;
  const fields=['ya-base-url','ya-model','ya-key','ya-remove-key','ya-timeout','ya-tokens','ya-token-parameter','ya-tools-enabled','ya-allow-writes','ya-auto-install'];
  let config=null,busy=false,dirty=false,chatBusy=false,openConsumption=false;
  function notice(text,type=''){$('ya-notice').className='ya-notice'+(type?' ya-'+type:'');$('ya-notice').textContent=text;}
  function selected(){return config?.providers[$('ya-provider').value];}
  function announce(){window.dispatchEvent(new CustomEvent('yagent:settings',{detail:{provider:$('ya-provider').value,connection:selected(),dirty,busy,openConsumption}}));}
  function controls(){
    $('ya-provider').disabled=busy||chatBusy||!config;
    for(const id of fields)$(id).disabled=busy||chatBusy||!config;
    $('ya-open-consumption').disabled=busy||chatBusy||!config;$('ya-models').disabled=busy||chatBusy||!config;
    $('ya-tokens').disabled=busy||chatBusy||!config||openConsumption;
    $('ya-auto-install').disabled=busy||chatBusy||!config||!$('ya-allow-writes').checked;
    if($('ya-provider').value==='gemini'){$('ya-base-url').disabled=true;$('ya-token-parameter').disabled=true;}
    $('ya-save').disabled=busy||chatBusy||!config;$('ya-test').disabled=busy||chatBusy||!selected()?.has_key||!selected()?.model||dirty;$('ya-refresh').disabled=busy||!config;
    announce();
  }
  async function api(path,body){
    const [route,query='']=path.split('?');const url=new URL(YAgentUI.rest+route,location.href);for(const [name,value]of new URLSearchParams(query))url.searchParams.set(name,value);
    const response=await fetch(url,{method:body===undefined?'GET':'POST',credentials:'same-origin',cache:'no-store',headers:{'X-WP-Nonce':YAgentUI.nonce,'Content-Type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)})});
    let data;try{data=await response.json();}catch{throw Error('پاسخ سرور JSON معتبر نیست؛ گزارش خطای PHP را بررسی کنید.');}
    if(!response.ok)throw Error(data.message||'درخواست انجام نشد.');return data;
  }
  async function work(fn,progress=''){
    if(busy)return;busy=true;controls();$('ya-progress').textContent=progress;
    try{await fn();}catch(e){notice(e.message||'ارتباط با سرور قطع شد.','error');}
    finally{busy=false;$('ya-progress').textContent='';controls();}
  }
  async function fill(){
    const c=selected();if(!c)return;
    $('ya-base-url').value=c.base_url;$('ya-model').value=c.model;$('ya-timeout').value=c.timeout;$('ya-tokens').value=c.max_tokens;$('ya-token-parameter').value=c.token_parameter;$('ya-key').value='';$('ya-remove-key').checked=false;
    $('ya-key-state').textContent=c.has_key?'کلید ذخیره شده است. برای حفظ آن این فیلد را خالی بگذارید.':'برای این سرویس هنوز کلیدی ذخیره نشده است.';
    $('ya-active').textContent=c.label+(c.model?' · '+c.model:' · مدل تنظیم نشده');
    const consumption=await api('v2/assistant/consumption');openConsumption=consumption.enabled;$('ya-open-consumption').checked=openConsumption;$('ya-consumption-state').textContent=openConsumption?'فعال · خروجی و سهمیه را سرویس تعیین می‌کند؛ مصرف ثبت می‌شود.':'مصرف با سیاست ذخیره‌شدهٔ شما کنترل می‌شود.';
    const setup=await api('v2/assistant/settings?provider='+encodeURIComponent($('ya-provider').value));
    $('ya-tokens').value=setup.manual_max_output_tokens??setup.effective_max_output_tokens;
    $('ya-tools-enabled').checked=setup.profile_id===null||setup.supports_tools;$('ya-allow-writes').checked=setup.allow_writes;$('ya-auto-install').checked=!!setup.auto_install_plugins;dirty=false;controls();
  }
  async function refresh(){
    const data=await api('status');$('ya-events').replaceChildren();
    if(!data.events.length){$('ya-events').textContent='هنوز درخواستی ثبت نشده است.';return;}
    for(const event of data.events){const row=document.createElement('div');row.className='ya-event';row.textContent=`${new Date(event.time).toLocaleString('fa-IR')} · ${event.provider} · ${event.purpose==='test'?'تست':'چت'} · ${event.code} · ${event.duration_ms} ms`;$('ya-events').append(row);}
  }
  $('ya-provider').addEventListener('change',()=>work(async()=>{await fill();notice('سرویس انتخاب شد؛ برای اجرای ابزار مدل باید سازگار باشد.');}));
  for(const id of fields)$(id).addEventListener('input',()=>{dirty=true;controls();notice('تنظیمات تغییر کرده است؛ پیش از تست یا چت ذخیره کنید.');});
  $('ya-settings-form').addEventListener('submit',event=>{
    event.preventDefault();if(!$('ya-settings-form').reportValidity())return;
    work(async()=>{
      const tools=$('ya-tools-enabled').checked,writes=$('ya-allow-writes').checked,autoInstall=$('ya-auto-install').checked;
      config=await api('settings',{provider:$('ya-provider').value,base_url:$('ya-base-url').value.trim(),model:$('ya-model').value.trim(),api_key:$('ya-key').value.trim(),remove_key:$('ya-remove-key').checked,timeout:Number($('ya-timeout').value),max_tokens:Number($('ya-tokens').value),token_parameter:$('ya-token-parameter').value});
      // Clear secrets immediately even if the separate policy write fails.
      $('ya-key').value='';
      await api('v2/assistant/settings',{provider:$('ya-provider').value,supports_tools:tools,allow_writes:writes,auto_install_plugins:autoInstall,...(openConsumption?{}:{max_output_tokens:Number($('ya-tokens').value)})});
      await fill();notice('تنظیمات ذخیره شد.','success');
    },'در حال ذخیره…');
  });
  $('ya-open-consumption').addEventListener('change',()=>{
    const enabled=$('ya-open-consumption').checked;
    if(enabled&&!confirm('مصرف بدون سقف داخلی فعال شود؟ YAgent سقف هزینه، تعداد درخواست و مراحل کار را اعمال نمی‌کند. هزینه API ممکن است بالا برود و از حساب سرویس شما کسر می‌شود. محدودیت خود سرویس و هاست باقی می‌ماند. می‌پذیرم.')){$('ya-open-consumption').checked=false;return;}
    work(async()=>{await api('v2/assistant/consumption',{enabled,consent:enabled});await fill();notice(enabled?'مصرف بدون سقف داخلی فعال شد.':'سقف‌های ذخیره‌شده دوباره فعال شدند.','success');});
  });
  $('ya-models').addEventListener('click',()=>work(async()=>{
    config=await api('settings',{provider:$('ya-provider').value,base_url:$('ya-base-url').value.trim(),model:$('ya-model').value.trim(),api_key:$('ya-key').value.trim(),remove_key:false,discovery_only:true});$('ya-key').value='';
    const data=await api('v2/models?provider='+encodeURIComponent($('ya-provider').value)+'&refresh=true');$('ya-model-options').replaceChildren(...data.items.map(m=>new Option(m.label||m.id,m.id)));$('ya-models-state').textContent=data.items.length+' مدل دریافت شد؛ از فهرست شناسه مدل انتخاب کنید.';dirty=true;controls();notice('مدل را انتخاب و اتصال را ذخیره کنید.');
  },'در حال خواندن فهرست مدل‌ها…'));
  $('ya-test').addEventListener('click',()=>work(async()=>{const data=await api('test',{provider:$('ya-provider').value});notice('اتصال موفق بود. مدل: '+data.model+' · زمان پاسخ: '+data.duration_ms+' ms؛ سازگاری ابزار جداگانه نیاز به تست دارد.','success');},'در حال آزمایش اتصال…'));
  $('ya-refresh').addEventListener('click',()=>work(refresh));
  window.addEventListener('yagent:chat-busy',event=>{chatBusy=!!event.detail;controls();});
  work(async()=>{config=await api('settings');$('ya-provider').value=config.active_provider;await fill();notice('تنظیمات آماده است.');await refresh();});
})();
