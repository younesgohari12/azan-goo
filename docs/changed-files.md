# Beta6 management additions

- `src/Agent/PageManager.php`: validated page lifecycle, Elementor document API, paginated reads/catalog, actor capabilities and bounded snapshots.
- `src/Agent/PluginManager.php`: installed-plugin lifecycle, dependency and whole-tree digest snapshots, direct filesystem deletion and protected self folder.
- `src/Agent/ToolRegistry.php`, `ToolExecutor.php`, `Runner.php`: tools, approvals, locks, durable receipts and mutation-aware recovery.
- `src/Artifacts/Deployment.php`: private error display suppression during foreign activation.
- `assets/activity.js`, `assets/chat-agent.js`, `views/admin.php`: Persian management labels and existing chat approval flow.
- New real management tests and browser fixture/scenario; fixed registry expectations include new read tools and trash listing.

# 0.5.0-beta.1 smart open mode

AI/ConsumptionMode.php stores an explicit admin cost-consent receipt separately from the advanced consumption policy. Budget/RequestGuard/Runner/Gateway/RestV2 skip app consumption ceilings only while enabled; actual usage, concurrency locks, replay protection, cancellation and write permissions remain. Ordinary output caps are omitted at both provider serializers. Technical request, record, inline and host boundaries remain.

Attachments.php stores private owned chunks, validates multipart files and file signatures, exposes metadata/removal and hydrates refs immediately before provider HTTP. Tasks/Conversations/Context preserve and validate refs; provider serializers produce native media parts and never execute uploaded code. Completed task refs no longer prevent file deletion after conversation deletion.

Providers/Discovery.php performs only metadata GETs with credential-bound cache and explicit unknown capabilities. Settings allows credential setup for model discovery without a selected model. Main admin form exposes model list and one-time consumption approval, collapses advanced fields and adds private attachment controls/history labels.

New tests: open-consumption, multimodal, model-discovery, smart-inputs and browser-smart. Existing browser fixtures open advanced fields only when deliberately testing manual caps.

# 0.4.1-beta.1 patch changes

Runtime: Runner uses compact system/tool framing, a connection-aware output reserve and one durable corrective response attempt for known-usage empty/incomplete model output. Context adaptively moves whole old completed turns into compaction while protecting pending/latest turns and leaving the archive untouched. Provider adapters and Gateway preserve actual usage on empty or malformed HTTP200 responses, including Gemini MAX_TOKENS, refusal and undeclared-tool errors. Structured legacy function calls and nonempty proxy argument objects are normalized without interpreting code from text.

UI: activity.js shows recorded automatic recovery with working/completed/failure states. No private model reasoning is exposed.

Tests: provider-recovery, memory-adaptive, agent-recovery and browser-recovery; real generated uploader installation and media upload, patch ZIP upgrade retention. Existing memory/gateway expectations updated for intentional adaptive retention and known-usage settlement. Beta4 features and existing-plugin preservation remain intact.

# Beta 4 changes

Runtime: new Artifacts/Deployment.php for policy-controlled staged installation with exclusive writes, real activation, one-use boot proof, cleanup/recovery and durable observable events. Config/AssistantSetup add default-off automatic mode; PluginPackages/ToolRegistry expose optional auto_install; ToolExecutor and Runner integrate truthful receipts/failure; Tasks exposes sanitized progress; Plugin registers purpose-token health handler.

UI: new activity.js/activity.css sidebar; Admin enqueue, admin view, settings checkbox and admin.js; chat-agent GET-only progress polling, stage states and readable result cards. Real task events replace completed-stage running indicators and duplicate history entries.

Tests: automatic deployment, extraction race/policy/capability/exit/fatal/loaded-entry hardening, separate-process option/capability revocation, activity browser, real multiworker automatic deployment, beta3 upgrade and fresh-state validation. Existing browser fixtures explicitly disable automatic installation when testing ZIP-only behavior.

Release: 0.4.0-beta.1, Persian guide, API notes, config example, validation report and source packaging.
