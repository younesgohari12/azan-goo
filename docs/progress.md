# Beta 3 progress

Plan: docs/superpowers/plans/2026-10-20-beta3.md

Baseline: delivered beta 2 committed as c580659; current branch beta3.
Task 1: package validator/ZIP storage and new read tools implemented; 12 package and 5 read/capability cases pass (first observed missing-feature failures).
Task 2: assistant setup/artifact routes pass; request-ID recovery endpoint added after failing 404 case. Browser test exposed REST query fallback, status-render races and detached rollback UI; corrected and rerunning.
Main chat uses existing runner/approvals, and ordinary policy controls preserve tariffs/budgets. Generated code never executes in package builder.
Task 3: full regression suite passed before request-recovery change; final rerun, fresh code review, package installation and delivery pending.

Independent whole-change review completed: no critical finding; transient restore IDs, output policy, content pagination and provider argument/context bounds were important and fixed. RED cases were observed before fixes; full server rerun is 221/221. PHP opening-token check tightened. Large package success now finishes from receipts so code is not replayed into context. Browser checks rerunning after all fixes; final release checks pending.

Task 1: complete. Task 2: complete. Task 3: release verification complete. Final evidence: 221 server tests, 61 real browser checks, 32 isolated UI contracts; additional generated fixture install and beta2 upgrade retention checks passed. Clean beta3 installation/schema/defaults and 25-case primary browser rerun passed. All runtime bytes verified identical. No live provider account tested. No unresolved Important review finding. Final docs/archive persistence is the delivery step.
