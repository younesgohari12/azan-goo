# Beta 4 API additions

`POST v2/assistant/settings` also accepts optional `auto_install_plugins:boolean`. GET returns it. Default is false; old clients preserve the saved value when omitting the field. The saved mode applies only to writable tasks; executing it requires current manage_options/install_plugins/activate_plugins, file-mod permission and single-site direct filesystem support.

`build_plugin` accepts optional `auto_install:boolean`. If omitted, the saved global mode applies in writable tasks. Explicit false returns a ZIP-only artifact. Explicit true while disabled/read-only is denied. Only newly generated artifact folders can be installed; installed plugins are never overwritten. The artifact is kept even if deployment fails.

Tool result includes `deployment:{deployment_id?,status,installed,activated,health_verified,plugin_file,events:[{stage,status,message,at}],error?,deactivation_verified?}`. Successful runtime proof is `active_verified`. Failure is `failed`/`failed_deactivated` or `needs_review` if cleanup cannot be verified. Artifact-only is `artifact_only`. Requested deployment failure makes the task fail; downloading a ZIP remains possible. A replay returns stored receipts, never reactivates.

During a build tool, GET task may return sanitized `data.deployment_progress`. UI polls this read-only while POST step is in flight. No new paid call or deployment occurs on GET/reload. Health secrets and raw generated source are excluded from progress.

The independent bootstrap probe is POST `wp-admin/admin-post.php?action=yagent_deployment_health`, with deployment_id form field and one-use expiring `X-YAgent-Health` token. It is purpose-bound, not a user authentication endpoint. Invalid/missing/replayed proofs receive 403, and redirects are not followed. A successful boot is not a sandbox, full functional test or security audit.

# Beta 3 API additions

The existing `/yagent/v1/v2/` namespace is retained. Every REST route requires an authenticated administrator and `X-WP-Nonce`. Downloads are private/no-store and must not be embedded as public file URLs.

- `GET assistant/settings?provider=avalai`: model/profile, supports_tools, allow_writes, tools_verified=false.
- `POST assistant/settings`: provider:string, supports_tools:boolean, allow_writes:boolean, optional max_output_tokens:integer (64..8192). The optional field updates the shared output policy and must remain below context_tokens; GET also returns effective_max_output_tokens and context_tokens. Preserves configured prices and budgets. Declares capability; does not verify a provider. allow_writes changes the global read_only policy.
- `GET requests/{request_id}`: recover an already accepted task for the current owner, with no mutation or paid calls; 404 if not accepted.
- `GET artifacts`: owner-only immutable manifest/sha256/size/validation metadata (last 100).
- `GET artifacts/{id}/download`: filename, mime_type, content_base64, sha256 and metadata. Decode to ZIP in a Blob. The download route executes no source.
- `DELETE artifacts/{id}`: explicit owner-only deletion. No installed plugins are removed.

The main chat uses existing tasks POST / tasks/{id}/step POST / cancel POST and approvals decision POST with plan_hash. Read existing conversations with GET on reload; do not step automatically. Draft writes still require exact approval. build_plugin first creates an inert artifact; Beta 4 can then deploy it under the separately enabled policy. Legacy `/chat` remains a text-only compatibility API; the primary UI now uses durable tasks.

# YAgent v0.2 REST contract

Base: rest_url('yagent/v1/'). Preserve WordPress rest_route query-string fallback. New routes are v2/*; legacy settings/chat/test/status remain compatible. Status retains text_chat mode for legacy clients.

Every endpoint requires cookie login, manage_options and X-WP-Nonce for wp_rest. All records are owner-scoped, including between administrators. Successful responses are private/no-store JSON. POST requires a JSON object <=180000 bytes. Errors are WordPress code/message/data.status, without raw upstream secrets.

## Envelopes

Stored envelope: {id,kind,owner,version,data,created_at,updated_at}. Primary key (kind,id), version compare-and-swap. UUID/hash IDs <=64 characters; UTC created/updated times. Public tasks omit provider replay transcripts, profile internals, credential fingerprint and call sets. Deadlines/retry_at/expires_at are Unix seconds.

## Endpoints

| Path after v2/ | Methods | Input and result |
| --- | --- | --- |
| config | GET, POST | Read config / partial validated update. Nested sections merge; models replaces map. No secrets. |
| conversations | GET, POST | {items:[envelopes]} / {title?} creates envelope. |
| conversations/{id} | GET, POST, DELETE | Envelope+usage / rename {title} / {deleted:true}. |
| conversations/{id}/clear | POST | {} clears raw messages/cache; preserves operational records. Active tasks block clear/delete. |
| templates | GET, POST | List / create {title,prompt}. |
| templates/{id} | GET, POST, DELETE | Read / replace {title,prompt} / delete. |
| tasks | GET, POST | List public envelopes / create task as below. Creation alone has no paid call. |
| tasks/{id} | GET | Public durable task. |
| tasks/{id}/step | POST | {} processes at most one paid call and bounded tools; terminal states are idempotent. |
| tasks/{id}/cancel | POST | {} stores cancellation marker; finalizes if lock available. |
| approvals | GET | {items:[owner envelopes]}. |
| approvals/{id} | GET | Exact preview, bound plan_hash, expiry and status. |
| approvals/{id}/decision | POST | {decision:approve/reject/cancel,plan_hash:exact}. Approve immediately executes bound write. |
| receipts/{id}/rollback | POST | {confirm:true}; reads persisted receipt, requires global read_only=false and current capabilities/fingerprint. |
| tools | GET | {items:[tool descriptors]}; global read-only omits writes. |
| usage | GET | {site,personal,limits,warnings}; optional conversation_id must be owned. UTC rollups; high-use warnings at80%. |
| export | GET | format=json/csv; {filename,content,format,limit,truncated}. Personal usage plus200 latest tool-operation metadata rows; escaped CSV formulas. |
| health | POST | {profile_id? / provider?,thinking?}; one metered model call, duration/status/error and usage ID, cached last result. Tool/thinking verification flags stay false. |

All routes require manage_options; tools also check their declared WordPress capability against the passed actor. Common errors: yagent_not_found404, yagent_conflict409, yagent_busy409, yagent_read_only403, yagent_plan_mismatch409, yagent_task_closed409, yagent_task_timeout, yagent_budget_exceeded, yagent_thinking_unsupported, yagent_needs_review and yagent_accounting_pending. Validation/unknown profile/configuration errors are rejected before paid calls. Storage outages fail closed.

## Task lifecycle

Example POST tasks:

    {"prompt":"Read site info with a tool","profile_id":"normal","mode":"agent","read_only":true,"thinking":"auto","allow_powerful":false,"request_id":"client-uuid"}

Optional conversation_id selects an owned archive. mode is agent/chat. An agent requires declared supports_tools. Routing may choose from configured profiles when enabled. Powerful requires both site and request opt-in. Stable request_id is scoped to user; changing prompt/options with the same ID conflicts. Unknown task fields are rejected.

States: pending/running/retry_wait/awaiting_approval/completed/failed/cancelled/needs_review. Data includes phase, counters, results, approval_ids, usage_ids, output/error, context estimates and timing. history_sync_error means output remains in task history but archive sync needs retry.

Poll step >=1 second; respect retry_at; pause for approvals/errors/terminal states. Display exact server preview/hash, get explicit user click, POST decision, then step. Loading history must not resume execution. Terminal step with archive sync error retries only synchronization. A model_inflight interruption is never automatically billed again. Actual receipts are independent of model prose.

Cancellation cannot undo in-flight HTTP/write or completed operations. Approval expires after15minutes or earlier task deadline. Plans bind owner/task/call/raw+normalized arguments/preview/expiry. Exact capabilities, readonly and fingerprint are rechecked; stable receipts prevent duplicate actions. Canonical stored IDs are used for locks. Interrupted writes/rollback require human review.

## Models, thinking and accounting

See config.example.json. Provider IDs: gemini/gapgpt/avalai/arvancloud. Profiles declare model, nullable input/output USD-per-million, supports_tools, thinking_kind and thinking_levels mapping. Auto sends no thinking option; only explicitly configured native controls are sent. Native Gemini IDs/signatures survive parallel tool replay; thought text is omitted.

All model requests use Gateway. The final semantic UTF-8 payload, system/tool framing and output allowance are checked conservatively, maximum effective32000; messages maximum128, initial context maximum96 with spare tool-round slots. Incremental summaries preserve raw messages and current/recent turns; summary text is untrusted data, never authority.

Daily/monthly site and per-task monetary/request caps are serialized before HTTP. Reservations cover conservative input plus max output; summaries/health/retries count too. Missing usage/price stays unknown; active dollar limits reject unknown prices and retain uncertain holds. Costs are estimates, no cached-token tariff discount guessed. Gemini thoughts count in output, OpenAI reasoning is not added twice.

Retry is off by default, max2 extras for explicit permitted transient429/500/502/503/504, bounded Retry-After/backoff. Never automatic retry for auth, ambiguous network billing or tools. Retry wait is durable and does not sleep the web request.

Usage/export reads max10000 usage records; operation export includes200 latest personal receipts with separate truncation flag. Accounting stops at capacity. Lists are bounded100/200. No large-scale archival or manual uncertain-reservation settlement UI in this beta.

## Protocol references

- https://ai.google.dev/api/generate-content
- https://ai.google.dev/gemini-api/docs/thinking
- https://ai.google.dev/gemini-api/docs/thought-signatures
- https://docs.avalai.ir/en/guides/function-calling

Protocols were tested with fixtures; live account/model compatibility remains a deployment check.

## Beta5 smart input and consumption additions

- GET/POST `v2/assistant/consumption`: explicit admin consent receipt. POST `{enabled:true,consent:true}` enables consumption without app ceilings; `{enabled:false}` restores the saved policy. Generic config cannot enable it. Auth and REST nonce remain required.
- GET `v2/models?provider=...&refresh=true`: metadata-only model list, credential-bound cache. Missing capabilities are null, not verified support. No generation request is performed.
- POST `v2/uploads`: authenticated multipart field `file`; private owned chunks. Returns `{id,name,mime,size}`. GET/DELETE `v2/uploads/{id}` reads metadata/removes an unused upload. Archived conversation/nonterminal task refs prevent deletion; completed task receipts alone do not.
- POST `v2/tasks` accepts `attachments:[opaque_id,...]`; server validates ownership before task creation. Only Gateway resolves bytes. Histories contain refs, never base64 content.
- `assistant/settings.effective_max_output_tokens` is null in open mode; `manual_max_output_tokens` retains the saved manual limit. `usage` reports effective limits, saved limits and open_consumption separately.

Native wire support is conditional on selected model/provider: compatible chat image_url, PDF file_data and WAV/MP3 input_audio; Gemini inlineData supports inspected image/PDF/audio/video. UTF-8 text/code is framed as untrusted input data. Upload/inline, HTTP, memory, record and archive byte guards remain technical constraints; open mode is not a promise of infinite provider context or storage.

## Beta6 site management tools

The existing v2 task/approval/receipt routes carry these fixed tools; there is no direct unauthenticated mutation endpoint. Writable policy and actor capabilities are required for management.

| Tool | Arguments | Behavior |
|---|---|---|
| manage_plugin | action: activate/deactivate/delete; plugin: exact installed basename | Approved WordPress API mutation; delete inactive only, dependencies/self protected |
| manage_page | action: create/update/publish/unpublish/trash/restore/delete; post_id except create | Approved page lifecycle; delete permanent; publish means now |
| read_page | post_id, field: content/elementor_data/elementor_settings, offset, limit | UTF8 byte pages with next_offset and content_hash |
| elementor_info | optional widget, offset, limit | Installed widget names or control schema, no guessed capability |

Create/update accept title, content, excerpt, status(draft/publish/private/pending), editor(html/elementor), slug, parent_id, menu_order and template. Elementor elements/settings are JSON strings; full element array with unique IDs and installed widget types, nonempty settings object without post-status/title/template side channels. Code conversion of an existing Elementor page requires explicit editor=html. Restore also requires delete_post, matching WordPress. Mutations expose database-verified receipts, not a claim of frontend rendering or a plugin security audit. Receipt records retain before/after snapshots; plugin trees use a canonical digest rather than duplicated file manifests.
