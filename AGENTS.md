# AGENTS.md — YAgent UI

Non-obvious facts for anyone (human or agent) working in this repository.

## What this is

A React + TypeScript **front-end only** product: the YAgent WordPress assistant UI.
There is **no database, no authentication and no AI service** — the interface talks to
a service adapter and the repository ships one complete implementation of it, the
in-memory mock (`src/adapters/mock`). Demo state lives in memory: a page reload
resets the seed data (`createSeed()` in `src/adapters/mock/fixtures.ts`).

## Restoring a conversation (adapter contract)

A thread's activity, approval and result messages carry ids only (`taskId`,
`approvalId`, `resultId`), and those cards render `null` when the entity behind the id
is missing. So a conversation is restored with **one** adapter call,
`getConversationSnapshot()` — messages plus the tasks, approvals, results and the
annotations the feedback messages reference. The reducer merges them in with
`mergeMissing`, which never overwrites an entity that live events already delivered.
Loading messages alone fails silently: the seeded demo threads would show no activity
block, no approval card, no result card and an empty "مراحل انجام کار" panel while
raising no error.

## Running it (sandbox / local)

```bash
docker compose -f docker-compose.base44.yml up -d --build
curl -fsS http://localhost:3000/ >/dev/null && echo up
```

- `web` service: host port **3000** → Vite dev server on 5173 (source bind-mounted, live reload).
- `node_modules` is a Docker **named volume**; dependencies are installed at container
  start with `npm ci`. When `package.json` changes, the lockfile must be regenerated
  (`npm install`) and committed, otherwise the container start fails.
- No `.env` or secrets are needed. `docker-compose.base44.yml` therefore has no
  `env_file`.

## Checks (run these, nothing heavier)

```bash
npx tsc --noEmit     # type check (no build output)
npx vite build       # production build sanity check (not used to serve the sandbox)
```

There is no test suite. Verify behaviour by driving the running app.

## How to verify the product end to end

1. `http://localhost:3000/` shows the shell: history sidebar (right), chat (middle),
   work-plan panel (left).
2. Send `یک صفحهٔ فرود با المنتور بساز.` (or click the first empty-state suggestion).
   Expected: assistant text streams → activity block with a live timer → steps advance
   → a preview result card appears → an approval card asks for publishing → the plan
   panel shows step 6 waiting.
3. Approve → step 7 runs → result card "منتشر شد"; the preview toolbar can publish a draft.
4. "علامتگذاری" in the preview toolbar → click a section (pin) or drag (region) →
   write a note in the feedback panel → "ارسال اصلاحات به دستیار" → the chat shows a
   feedback card, the task builds revision v2, and annotations from v1 become
   `stale` / `unmatched` (needs review).
5. Other seeded states: `c-plugin` (waiting for an install approval), `c-contact`
   (waiting for a delete approval), `c-error` (failed run), `c-speed` (finished audit
   with markdown table/code), `c-empty` (empty conversation).

## Source archive route (dev only)

`GET /yagent-source.zip` is served by a dev-only Vite plugin (`sourceZipPlugin` in
`vite.config.ts`) which calls `scripts/make-source-zip.mjs`. The archive is built in
memory with node:zlib — no `zip` binary and no dependency. It exists only while the
dev server runs (`apply: 'serve'`); the account menu shows the download entry only in
dev (`import.meta.env.DEV`).

## Sandbox-only overrides (BASE44_PREVIEW_MODE)

- `vite.config.ts` → `server.allowedHosts`: when `BASE44_PREVIEW_MODE === '1'` the
  sandbox domain (`.<BASE44_SANDBOX_HOST_DOMAIN>`, the id rotates) is appended to
  Vite's Host allowlist. With the flag unset, `allowedHosts` is `undefined` and Vite
  keeps its default behaviour.
- `BASE44_PUBLIC_HOST_SUFFIX` / `BASE44_SANDBOX_HOST_DOMAIN` /
  `__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS` are only passed through to the service; no
  host value is ever hardcoded in the repository.
- The preview iframe uses `sandbox="allow-scripts allow-same-origin"` for the
  same-document demo. Dropping `allow-same-origin` (cross-origin preview) changes
  nothing for the bridge: the shell never reads `contentDocument`, and all traffic is
  `postMessage` (see `src/preview/bridge.ts`).
