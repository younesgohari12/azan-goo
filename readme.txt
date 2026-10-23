=== YAgent AI ===
Contributors: younes
Tags: ai, agent, gemini, chat
Requires at least: 6.6
Tested up to: 7.1
Requires PHP: 8.1
Stable tag: 0.7.0-beta.1
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Resumable WordPress AI agent with explicit management approval, budgets and Persian RTL activity panel and opt-in generated-plugin deployment.

== Description ==
New in 0.7.0-beta.1: real Persian RTL workspace connected to the existing API, durable chats, uploads, task progress, approvals, private ZIP downloads, responsive drawers, session drafts and isolated HTML proposal preview. Open Settings and Management for the existing advanced controls. See docs/UI-0.7.0-FA.md and docs/QA-0.7.0.md.

Four encrypted server-side connections: Google AI Studio/Gemini, GapGPT, AvalAI and ArvanCloud compatible Chat Completions. Provider model/endpoint compatibility must be verified with your account.

Thirteen fixed tools: build_plugin, read_content (UTF-8 pages), search_content, site_diagnostics, site_info, list_plugins, list_content, create_draft, update_draft, manage_plugin, manage_page, read_page, elementor_info. Read-only by default, actor capabilities, owner-bound plans, explicit decisions, stable receipts and supported rollback. Generated plugin source is downloadable data by default. One manager opt-in permits installation and activation of newly generated plugins, with an independent WordPress boot check. No existing plugins are overwritten. Generated PHP runs with WordPress plugin privileges; this is not a sandbox or full functional/security test. Page publishing/lifecycle and installed Elementor documents are supported with explicit approval. HTML/CSS/JS follows WordPress capabilities. No PHP evaluation or WooCommerce product mutation module.

New conversations/templates/tasks/previews/receipts and summary caches are stored in the site's YAgent table. The experimental chat now uses durable tasks and history; the legacy text-only API remains for compatibility. Usage stores operational metadata, excluding prompts/keys/tool arguments. Conversation deletion preserves usage/receipts. Plugin deletion removes YAgent records/settings while preserving WordPress content.

Model requests send selected conversation context, tool definitions and tool results to the selected provider. Summaries and health tests can incur charges. Opening the page makes no paid call. Closing the page pauses future steps; user-started active tasks poll until completion/approval/error. Provider terms govern processing and billing.

Keys use AES-256-GCM derived from WordPress salts, remain server-side and are excluded from public API output. Re-enter after rotating salts. This does not protect against a compromised server/backups containing both salts and database.

== Installation ==
Upload yagent-ai-0.7.0-beta.1.zip or replace the previous version without deleting it. Activate single-site and open YAgent AI. Save exact provider model/endpoint/key. Use the ordinary tool-support and draft-write controls, then send requests in the existing experimental chat. Advanced profiles/prices/caps remain available in JSON. Automatic installation is off by default. Enable the dedicated checkbox once with writable policy to permit subsequent generated-plugin deployments. Failed boot verification deactivates the generated plugin where cleanup can be confirmed. Deactivation cannot reverse code side effects. Start read-only. See docs/README-FA.md and config.example.json.

== External services ==
Google: https://ai.google.dev/ — https://ai.google.dev/gemini-api/terms
GapGPT: https://gapgpt.app/
AvalAI: https://avalai.ir/ — https://docs.avalai.ir/
ArvanCloud: https://www.arvancloud.ir/
Consult your account's current endpoint, model documentation and terms.

Google uses generativelanguage.googleapis.com/v1beta/models/{model}:generateContent with x-goog-api-key. GapGPT preset api.gapgpt.app/v1 and AvalAI preset api.avalai.ir/v1 are editable. ArvanCloud requires your account-specific HTTPS compatible URL; none is guessed. Compatible adapters append /chat/completions if absent.

== Frequently Asked Questions ==
= Are costs exact and provider accounts tested? =
No. Prices are admin USD-per-million estimates. Unknown prices/usage remain unknown. Fixtures tested protocols in actual WordPress; no live account credentials were supplied for this release.

= Are requests retried? =
Opt-in only, at most two extra explicit transient provider attempts. Ambiguous timeouts and writes never auto-retry.

= What does rollback do? =
Restore supported unchanged draft fields, or trash an unchanged created draft. Trash-disabled sites cannot automatically roll back creation. Later edits/interrupted operations require review.

= What happens on deletion? =
Deactivation preserves data; explicit deletion removes YAgent settings/table/locks/rate metadata, not other plugins/content.

== Changelog ==

= 0.6.0-beta.1 =
One-time explicit approval for consumption without YAgent spending/request/rate/task caps, provider-controlled output, private multimodal inputs and metadata-only account model picker. Technical settings are collapsed; saved limited policy and site-write permissions are preserved.

= 0.4.1-beta.1 =
Adaptive context/output reservation and one bounded, metered correction for known-usage empty or incomplete model responses. Real recovery activity; existing plugins are preserved.
= 0.4.0-beta.1 =
* Real activity sidebar, opt-in generated-plugin install/activate/boot verification, durable deployment receipts and failure cleanup.
= 0.3.0-beta.1 =
* Unified agent chat, plugin ZIP builder, read/search/diagnostics, inline approvals, resume and private artifact downloads.
= 0.2.0-beta.1 =
* Tools, explicit approvals, draft rollback, durable tasks, memory/templates, routing/thinking, usage/budgets/export and bounded retry.
= 0.1.0-beta.1 =
* Modular core, four encrypted provider connections and admin text chat.
