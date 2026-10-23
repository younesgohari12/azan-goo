# Release validation — 0.6.0-beta.1

Validated 2026-10-22 on disposable local WordPress6.8.3, Elementor3.32.4, PHP8.3.6, MariaDB10.11.14, Chromium153 and Playwright1.62.1. No live user website or paid model account was used. Provider responses are deterministic HTTP fixtures; WordPress, Elementor document saving/rendering, SQL, plugin hooks, filesystem deletion, ZIP installation and frontend loopback HTTP are real. All external WordPress HTTP and browser requests were blocked for the local tests; no Elementor account or telemetry access was authorized.

| Verification | Result |
|---|---:|
| Full serial server suite, 27 invocations | 353 passed, 0 failed |
| Extra real installed Elementor deactivate/replay/activate cycle | 1 passed, 0 failed |
| Existing experimental-chat browser regression | 25 passed |
| New management chat browser scenario | 25 passed |
| Same management scenario repeated on actual installed ZIP | 25 passed |
| Runtime PHP / JavaScript syntax | 43 PHP / 4 JS files passed |
| Source / ZIP / actual installed runtime comparison | 51 files byte-identical |

The full suite includes16 new page checks and19 installed-plugin checks. Page coverage includes actual HTML/CSS/JS persistence, Elementor create/save/render/edit, publish-now for scheduled pages, draft/trash/restore/permanent delete, pagination with exact UTF8 reconstruction, widget-control discovery, restricted roles, protected non-page objects, JSON validation, stale content/Elementor metadata approvals and large page receipts. A400KB existing page first reproduced a post-mutation approval overflow; compact task-facing snapshots now pass while the full800KB before/after receipt stays durable. Overlarge snapshots reject before mutation.

Plugin checks use disposable fixtures with real activation/deactivation/uninstall hooks. They cover exact basenames, self/folder protection, dependencies and active siblings, inactive-only deletion, changed source bytes, permission revocation, read-only/file-modification policies, symlinks, filesystem credential refusal, output/error suppression, interrupted execution and durable idempotence. Whole-tree hashes are computed locally and represented by a canonical digest in records. The extra cycle actually deactivates and reactivates installed Elementor with compact receipts, then leaves it active.

The new browser scenario sends a model tool call through the existing experimental chat, waits for the exact inline approval, publishes an Elementor page and verifies its real frontend HTTP response contains the requested heading. Reload sends no mutation. Later chat requests unpublish, trash, restore and permanently delete the page, then deactivate/delete a disposable plugin. The activity panel shows actual management results and there are no JavaScript errors. Fixtures validate the agent protocol and actual tool behavior; they do not prove a live model will choose correct tools or produce correct page designs.

The delivered0.5 ZIP was installed with WordPress Plugin_Upgrader and upgraded to0.6. Encrypted credentials, configuration, consumption consent and conversation history survived. A clean YAgent-state ZIP installation verified activation/schema, empty keys, read-only/default-off policies and existing controls. The management browser scenario was repeated against a physical installed directory, not the source symlink.

Local test infrastructure notes: after repeated uninstall/table recreation, the disposable InnoDB record table produced an engine tablespace error during the first clean-activation attempt. The empty test table was rebuilt by a test-only administrator script, new local test tables were moved to the shared InnoDB tablespace, and read/write plus a separate restart/activation were verified before installed browser testing. No automatic DROP/repair logic was added to the product. An obsolete test-skin error-reporting method was also corrected. Earlier RED runs exposed the fixed restore capability, future-date publish, empty Elementor settings no-op, large-record projections and private fatal display cases; the final runs above are green.

Reproduction requires a disposable WordPress installation with Elementor3.32.4 active, the fake provider MU fixture and external requests blocked. Set YAGENT_WP_ROOT and PHP_COMMAND, then run sh tests/run.sh. The optional tests/elementor-plugin-cycle.php requires local environment and changes the actual Elementor activation state only on that disposable site. Browser scripts use a local Playwright launcher supplied by the test environment. Never run the test suite on a live site.

Limits: management requires current WordPress capabilities, writable policy and inline approval. Plugin deletion requires direct filesystem access and cannot undo third-party uninstall data changes. Elementor Pro/custom addons, other Elementor versions, PHP8.1 and production hosting were not separately tested. Page code is HTML/CSS/JS, not PHP evaluation; arbitrary server code remains the separate generated-plugin workflow. Receipts verify stored database/plugin state; functional frontend and plugin security audits are separate from a generic successful mutation receipt.

---

# Release validation — 0.5.0-beta.1

Validated 2026-10-21 on disposable local WordPress 6.8.3, PHP 8.3.6, MariaDB 10.11.14, Chromium 153 and Playwright 1.62.1. No live user site or paid model account was used. Provider generation and metadata responses are controlled HTTP fixtures; WordPress, SQL, multipart uploads, private storage, task execution, installation, activation and loopback health verification are real.

| Verification | Result |
|---|---:|
| Full serial server suite | 318 passed, 0 failed |
| Existing real WordPress browser suites | 107 passed |
| New smart-consumption/multimodal browser scenario | 17 passed |
| Isolated UI contracts | 32 passed |
| Smart scenario repeated on actual installed ZIP | 17 passed |
| Runtime PHP syntax | 41 files passed |
| Runtime JavaScript syntax | all passed |
| Source / install ZIP / fresh installed runtime | 49 files byte-identical |

Consent tests verify unchecked enabling fails, a receipt records the administrator and time, zero saved budgets do not restrict an approved open request, the beta rate cap is skipped while concurrency locking remains, and switching off restores the saved limits without changing site-write permissions. An open task with saved limits of one model call, zero tool calls and an expired task deadline completes 15 model calls and 14 actual site tools; cancellation remains active. A direct provider request with 131 messages plus 40,000 text bytes succeeds without an output token parameter and usage above 8192 is recorded. Ordinary requests defer output sizing to the provider; summary and health requests can still ask for concise output.

The input service tests cover private chunk metadata, image/PDF/audio/video and code inputs, MIME/signature checks, invalid multipart filesystem paths, foreign/duplicate refs, corrupt/missing chunks, native provider wire shapes and output-parameter omission. A newly found one-megabyte guard incorrectly rejected an accepted large text file: the regression first failed, then passed for an owned 1.1 MB text attachment after the existing inline envelope was applied consistently. Uploaded code remains untrusted text data, not executable storage.

Model discovery tests use only metadata GETs, exact saved credentials/endpoint, bounded normalized catalogs and cache invalidation on key rotation. Unknown features remain null. Reflected keys and raw provider errors are not persisted or displayed. The paid request path does not trigger model-list HTTP.

The new real browser scenario dismisses then accepts the one-time cost prompt, reads the saved account's model list, uploads an actual PNG and TXT via multipart, sends a native image plus uploaded text through normal chat despite zero saved budgets, verifies the usage record, restores attachment names after reload and sends a native PDF input. It verifies that no file bytes/text enter localStorage, consumption approval grants no site writes/auto-install, switching off reactivates the zero budget, and the controls fit a 390px viewport with no browser JavaScript errors. The fixtures validate encoding and behavior; they do not establish a live model's image/PDF understanding or account compatibility.

The actual delivered 0.4.1-beta.1 ZIP was installed through Plugin_Upgrader, then replaced with the new ZIP. Encrypted settings, saved configuration, consent state and a conversation survived. A clean YAgent-state ZIP installation verifies 0.5.0-beta.1, activation, schema, empty keys, read-only/default-off installation policy, no unapproved open spending and the input/activity controls.

After restarting the disposable MariaDB following fresh drop/recreate tests, its test-only YAgent table reported a missing tablespace. The local test table was recreated and SQL read/write plus restart persistence were restored; the installed ZIP then passed the complete 17-check smart scenario. No automatic destructive database repair was added to the plugin. This environment incident is separate from model/provider compatibility.

Independent read-only review found two integration issues: detected tool capability overrode an explicit disabled choice, and completed-task refs prevented file deletion even after deleting the conversation. Both were fixed and reviewed; deletion was verified RED then GREEN. A minor file-chip deletion race was also closed. No outstanding critical or important review findings remained.

Open mode removes application consumption ceilings, not service quota, context limits, host/HTTP/inline memory or storage boundaries. Technical input envelope is up to 20 MiB and may be lower under PHP/WordPress limits. Existing HTTP response/record/history byte guards remain; an oversized history sync preserves the task result and never replays paid operations. Generated-plugin execution still follows the separately saved write/install policy, no-overwrite rules and existing approval/boot-check behavior.

Primary protocol references checked during implementation: https://ai.google.dev/api/models , https://ai.google.dev/api/generate-content , https://developers.openai.com/api/docs/guides/file-inputs and https://developers.openai.com/api/reference/resources/chat/subresources/completions/methods/create .

---

# Release validation — 0.4.1-beta.1

Validated 2026-10-21 on disposable local WordPress 6.8.3, PHP 8.3.6, MariaDB 10.11.14, Chromium 153 and Playwright 1.62.1. No live site or paid model account was used. Model responses are deterministic fixtures with fake keys; WordPress, SQL, archive installation, activation, independent HTTP boot proof and file uploads are real. The user's actual provider response was unavailable, so compatibility with that specific model is not claimed.

| Validation | Result |
|---|---:|
| Complete serial server suite | 274 passed, 0 failed |
| Real WordPress browser suites (25 + 14 + 22 + 19 + 18 + 9) | 107 passed |
| Isolated UI contracts | 32 passed |
| Smart scenario repeated on actual installed ZIP | 17 passed |
| Recovery/uploader scenario repeated on freshly installed ZIP | 9 passed |
| PHP runtime and patch harness syntax | 39 files passed |
| Runtime JavaScript syntax | all passed |
| Runtime source / install ZIP / freshly installed copy | 46 files byte-identical |

The short Persian plugin-building request was reproduced at an 8192 output ceiling. Agent recovery tests first failed before implementation, then passed: known-usage empty stop/length output triggers one metered corrective call, repeated emptiness stops after two total calls, incomplete tool calls never execute, ambiguous network calls never replay, and the saved request cap blocks additional HTTP. Every paid attempt remains accounted for. Provider tests include legacy structured function calls, nonempty proxy argument objects, refusal, hidden reasoning, missing choices and malformed Gemini calls with actual usage. No code is inferred from text.

Adaptive memory tests preserve pending work and the latest whole turn, move older complete turns into the existing summary pipeline, reuse cached summaries and retain the raw archive. Impossible current/pending input still fails honestly without deleting history or raising configured ceilings. Existing memory expectations changed because recent_turns is now a preference rather than an inflexible failure trigger. Existing Gateway expectations changed because a rejected tool response with known usage now settles that usage instead of fabricating an uncertain bill.

The new browser scenario returns an empty reasoning-only token-limited response first, then a complete generated uploader tool call. YAgent automatically corrects the response, builds and installs the new plugin, activates it, verifies independent WordPress boot, and shows the recorded correction in the activity sidebar. A real TXT file is uploaded through that plugin to WordPress media; its served bytes match exactly. A PHP upload is rejected by WordPress MIME protections. Private model reasoning is not rendered. Existing activity, approvals, history/reload, cancellation, no-overwrite deployment, failure deactivation and GET-only recovery suites also pass.

Actual WordPress Plugin_Upgrader installation of the delivered 0.4.0-beta.1 archive followed by patch replacement with 0.4.1-beta.1 preserves the encrypted settings hash, saved configuration and an archived conversation. A clean YAgent-state ZIP installation confirms version, activation, schema, empty keys, read-only/default-off policy and activity controls. The plugin requires a tool-capable configured model and remains bounded by the saved time, request and cost limits. Generated PHP has WordPress privileges; these checks are not sandboxing or a security audit.

A separate read-only review found two usage-loss paths (Gemini invalid call and OpenAI missing choices). Both were corrected, covered by tests and verified in follow-up review. No additional blocking finding remained.

---

# Release validation — 0.4.0-beta.1

Validated 2026-10-21 on disposable local WordPress 6.8.3, PHP 8.3.6, MariaDB 10.11.14, Chromium 153 and Playwright 1.62.1. No live site or live model account was used. Model responses are deterministic fixtures with fake keys; WordPress, SQL, filesystem, ZIP extraction, activation and independent loopback HTTP are real.

## Server validation

The complete serial `tests/run.sh` finished with **248 passed, 0 failed** across 18 suite invocations:

| Coverage | Passed |
|---|---:|
| Existing integration/storage/consumption/memory/tools/providers/gateway/runner/REST/concurrency/package/assistant/trash checks | 221 |
| New automatic deployment and setup | 13 |
| Deployment race, revocation, boot proof, exit/fatal and recovery hardening | 10 |
| Real separate-process option/capability cache revocation | 4 |
| **Total** | **248** |

Meaningful regressions were observed failing before fixes. The installer now extracts privately through WordPress, reserves the new target directory exclusively and opens files with exclusive-create mode. An existing folder, including an empty folder created during extraction, is preserved. Capability/read-only/file-mod policy is checked before mutation and at later deployment boundaries. Repeated action IDs do not reactivate a plugin.

Activation exceptions, explicit exit() and genuine E_USER_ERROR fatal paths were tested. Normal failure and shutdown cleanup record actual inactive state, retain downloadable artifacts, and do not expose private fatal details. Separate-process revocation tests warmed the original worker's real WordPress caches, changed configuration or user capabilities in a child PHP process, and verified the next boundary sees the change. All four tests first failed, then passed after cache refresh was added.

## Browser validation

| Real WordPress browser suite | Passed |
|---|---:|
| Primary conversation, tools, approval, rollback, ZIP download, persistence, cancellation and dropped-response recovery | 25 |
| Connection and text regression | 14 |
| Advanced task/usage interface | 22 |
| Activity sidebar, actual counters/timing, approval/failure, reload, mobile and reduced motion | 19 |
| Automatic installation and independent runtime verification | 18 |
| **Real browser total** | **98** |

The separate isolated mock-REST UI contract suite also passed **32/32**. It is not a backend/provider claim.

The automatic browser suite enabled the option once, generated a unique reviewed plugin through the same chat, installed and activated it without approval clicks, observed `verifying` through a real GET poll while POST was in flight, and called the generated plugin's public runtime endpoint in a fresh HTTP request. It then generated a plugin that throws during init: the independent boot failed, the plugin was deactivated, the task failed and the sidebar showed failure. Missing/forged health tokens and GET probes returned 403. Completed stages no longer retain running indicators or duplicate progress entries. These checks use a multiworker PHP server so loopback verification is independent.

## Review and package checks

Independent code review found no Critical finding and one Important issue: request-local WordPress caches could retain revoked policy/capabilities. It was fixed with the separate-process RED-to-GREEN regression above. No Important finding is left open.

The user-supplied beta3 archive's 43 runtime files matched the delivered baseline byte-for-byte. Actual beta3 was installed before upgrading with WordPress Plugin_Upgrader to beta4. A fresh process activated beta4 and verified the identical encrypted settings hash, decrypted fake key, nondefault consumption policy, retained conversation and template, with the new automatic option defaulting off.

A clean YAgent-state ZIP install then activated beta4 with schema 2, read-only/default-off policy and empty keys. All 46 runtime files matched source, ZIP and upgraded installation; every file including docs matched the fresh installed archive. PHP syntax checks for runtime/tests, runtime and test JavaScript syntax, ZIP CRC/path checks and `git diff --check` passed. The primary conversation25/25 and automatic deployment18/18 browser checks were repeated against this physically installed ZIP and passed (43 additional installed-package checks). Final documentation was then updated and the archives rebuilt; runtime code did not change after passing verification.

## Practical limits

Generated PHP actually executes with WordPress plugin privileges. Syntax and authenticated boot proof are not sandboxing, a security audit or proof of every plugin feature. Deactivation cannot reverse arbitrary database changes or other code side effects. Failed generated files remain present and inactive; artifacts can still be downloaded. A hard host/process failure that prevents shutdown cleanup can require manual recovery. The existing action/task locks after forced exits expire after 120 seconds; no deployment is automatically replayed.

Automatic installation requires a single-site WordPress, direct writable filesystem and working same-origin loopback HTTP. Credential-based/remote filesystems and multisite are unsupported; verification errors fail closed while retaining the ZIP. Persistent external object caches, shared-host topology, production hooks, WooCommerce/Elementor and a separate PHP 8.1 runtime were not tested. No live Gemini/GapGPT/AvalAI/ArvanCloud account was validated.

Builder limits remain 20 files, 64 KiB each, 128 KiB total source, 256 KiB encoded arguments and 512 KiB provider response, plus output/context policy. Very high output limits may require increasing configured context; opening a new chat alone cannot reduce system/tool framing. Read-content pagination and all existing consumption protections remain.
