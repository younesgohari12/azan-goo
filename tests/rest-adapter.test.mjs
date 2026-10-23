import test from 'node:test';
import assert from 'node:assert/strict';
import * as adapter from '../assets/workspace/js/adapters/rest/restAdapter.js';
const options = { rest: 'https://example.test/wp-json/yagent/v1/', nonce: 'nonce', userId: 9 };
const row = (id, data) => ({ id, owner: 9, version: 1, created_at: '2026-10-23 00:00:00', updated_at: '2026-10-23 00:01:00', data });

test('client supports WordPress plain permalinks without corrupting rest_route', () => {
  assert.equal(typeof adapter.restURL, 'function', 'REST client is implemented');
  assert.equal(adapter.restURL('https://example.test/sub/?rest_route=%2Fyagent%2Fv1%2F', 'v2/models', { provider: 'openai' }), 'https://example.test/sub/?rest_route=%2Fyagent%2Fv1%2Fv2%2Fmodels&provider=openai');
});
test('feedback displays the comment without exposing model geometry in the chat', () => {
  assert.equal(typeof adapter.displayMessageText, 'function');
  assert.equal(adapter.displayMessageText('بازخورد روی محتوای پیشنهادی «صفحه»:\n1. عنوان: کوچک‌تر شود\nمختصات: {\n  "x": 0.4,\n  "y": 0.2\n}'), 'بازخورد روی محتوای پیشنهادی «صفحه»:\n1. عنوان: کوچک‌تر شود');
  assert.equal(adapter.displayMessageText('User JSON {"x": 0.4}'), 'User JSON {"x": 0.4}');
});
test('incomplete work stays resumable after reload, and needs_review is never success', () => {
  assert.equal(typeof adapter.mapTask, 'function', 'real task mapping is implemented');
  assert.equal(adapter.mapTask(row('t', { status: 'pending', phase: 'model', prompt: 'Hello', conversation_id: 'c', started_at: 1, results: [] })).paused, true);
  const uncertain = adapter.mapTask(row('t', { status: 'needs_review', phase: 'tools', prompt: 'Hello', conversation_id: 'c', started_at: 1, results: [], error: { message: 'Check manually' } }));
  assert.equal(uncertain.status, 'error');
  assert.equal(uncertain.error, 'Check manually');
});
test('error statuses in tool results cannot produce a green success step', () => {
  assert.equal(typeof adapter.mapTask, 'function');
  const task = adapter.mapTask(row('t', { status: 'completed', phase: 'done', prompt: 'Hello', conversation_id: 'c', started_at: 1, results: [{ tool: 'manage_page', status: 'failed', error: { message: 'Denied' } }] }));
  assert.equal(task.steps.some(step => step.status === 'error' && step.summary.includes('Denied')), true);
});
test('approval binds the decision to the server plan hash; double click sends once', async () => {
  assert.equal(typeof adapter.createRestAdapter, 'function', 'WordPress adapter is implemented');
  let decisions = 0;
  const task = row('t', { conversation_id: 'c', status: 'completed', phase: 'done', prompt: 'Hello', started_at: 1, results: [], approval_ids: ['a'] });
  const approval = row('a', { task_id: 't', tool: 'manage_page', args: { action: 'publish', post_id: 42 }, preview: { before: { post: { post_title: 'Page' } } }, plan_hash: 'server-hash', status: 'pending' });
  const api = adapter.createRestAdapter({ ...options, fetch: async (url, init) => {
    const path = new URL(url).pathname;
    assert.equal(init.headers['X-WP-Nonce'], 'nonce');
    if (path.endsWith('/decision')) { decisions++; assert.deepEqual(JSON.parse(init.body), { plan_hash: 'server-hash', decision: 'reject' }); return Response.json({ ...approval, data: { ...approval.data, status: 'rejected' } }); }
    if (path.endsWith('/approvals/a')) return Response.json(approval);
    if (path.endsWith('/tasks/t')) return Response.json(task);
    if (path.endsWith('/conversations/c')) return Response.json(row('c', { title: 'Page', messages: [] }));
    throw new Error('Unexpected request ' + path);
  } });
  await Promise.all([api.resolveApproval('a', 'reject'), api.resolveApproval('a', 'reject')]);
  assert.equal(decisions, 1);
});
test('POST transport failure is never silently retried or treated as success', async () => {
  assert.equal(typeof adapter.createRestClient, 'function');
  let attempts = 0;
  const api = adapter.createRestClient({ ...options, fetch: async () => { attempts++; throw new TypeError('offline'); } });
  await assert.rejects(api('v2/tasks', 'POST', { prompt: 'Hello' }), /ارتباط|وضعیت/);
  assert.equal(attempts, 1);
});
test('expired nonce is actionable and a refreshed nonce is accepted', async () => {
  assert.equal(typeof adapter.createRestClient, 'function');
  let step = 0;
  const api = adapter.createRestClient({ ...options, fetch: async (_url, init) => {
    if (++step === 1) return Response.json({ ok: true }, { headers: { 'X-WP-Nonce': 'fresh' } });
    assert.equal(init.headers['X-WP-Nonce'], 'fresh');
    return Response.json({ code: 'rest_cookie_invalid_nonce', message: 'Expired' }, { status: 403 });
  } });
  await api('settings');
  await assert.rejects(api('settings'), /بارگذاری/);
});
test('no task executes when restoring an existing conversation', async () => {
  assert.equal(typeof adapter.createRestAdapter, 'function');
  const api = adapter.createRestAdapter({ ...options, fetch: async (url, init) => {
    assert.equal(init.method, 'GET', 'restoring history must not execute billable work');
    const path = new URL(url).pathname;
    if (path.endsWith('/tasks')) return Response.json({ items: [row('t', { status: 'pending', phase: 'model', prompt: 'Hello', conversation_id: 'c', started_at: 1, results: [], approval_ids: [] })] });
    if (path.endsWith('/approvals')) return Response.json({ items: [] });
    if (path.endsWith('/conversations/c')) return Response.json(row('c', { title: 'Hello', messages: [{ id: 'm', role: 'user', content: 'Hello', created_at: '2026-10-23T00:00:00Z' }] }));
    throw new Error('Unexpected request');
  } });
  const snapshot = await api.getConversationSnapshot('c');
  assert.equal(snapshot.messages[0].text, 'Hello');
  assert.equal(snapshot.tasks[0].paused, true);
});
test('a lost creation response recovers by idempotency key without repeating POST', async () => {
  let posts=0;
  const task=row('t',{conversation_id:'c',status:'pending',phase:'context',prompt:'Hello',started_at:1,results:[],approval_ids:[]});
  const api=adapter.createRestAdapter({...options,fetch:async(url,init)=>{
    const path=new URL(url).pathname;
    if(path.endsWith('/config'))return Response.json({read_only:true,models:{p:{provider:'gapgpt',model:'test',supports_tools:false}}});
    if(path.endsWith('/settings'))return Response.json({active_provider:'gapgpt',providers:{gapgpt:{has_key:true,model:'test',label:'GapGPT'}}});
    if(path.endsWith('/tasks')&&init.method==='POST'){posts++;assert.equal(JSON.parse(init.body).request_id,'stable-request');throw new TypeError('response lost');}
    if(path.endsWith('/requests/stable-request'))return Response.json(task);
    if(path.endsWith('/conversations/c'))return Response.json(row('c',{title:'Existing',messages:[]}));
    throw Error('Unexpected '+path);
  }});
  await api.listModels();
  assert.equal(await api.sendMessage({conversationId:'c',text:'Hello',attachments:[],modelId:'p',requestId:'stable-request'}),'t');
  assert.equal(posts,1);
});
test('an approved awaiting task is stepped and can complete after the decision', async () => {
  let stepped=0;
  const waiting=row('t',{conversation_id:'c',status:'awaiting_approval',phase:'tools',prompt:'Hello',started_at:1,results:[],approval_ids:['a']});
  let approval=row('a',{task_id:'t',tool:'manage_page',args:{action:'publish',post_id:42},preview:{},plan_hash:'hash',status:'pending'});
  let completed=false;
  const api=adapter.createRestAdapter({...options,fetch:async(url,init)=>{
    const path=new URL(url).pathname;
    if(path.endsWith('/approvals/a/decision')){approval={...approval,version:2,data:{...approval.data,status:'executed'}};return Response.json(approval);}
    if(path.endsWith('/approvals'))return Response.json({items:[{...approval,version:1,data:{...approval.data,status:'pending'}}]});
    if(path.endsWith('/tasks'))return Response.json({items:[waiting]});
    if(path.endsWith('/approvals/a'))return Response.json(approval);
    if(path.endsWith('/tasks/t/step')){stepped++;completed=true;return Response.json({...waiting,data:{...waiting.data,status:'completed',phase:'done'}});}
    if(path.endsWith('/tasks/t'))return Response.json(completed?{...waiting,data:{...waiting.data,status:'completed',phase:'done'}}:waiting);
    if(path.endsWith('/conversations/c'))return Response.json(row('c',{title:'Page',messages:[]}));
    throw Error('Unexpected '+path);
  }});
  await api.resolveApproval('a','approve');await api.getConversationSnapshot('c');await api.continueAfterApproval('a');assert.equal(stepped,1,'a late history snapshot must not undo a decided approval');
});
