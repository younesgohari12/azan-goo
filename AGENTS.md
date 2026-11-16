# AGENTS.md — SnappShop Automation dashboard

Non-obvious facts for anyone (human or agent) working on this repository.

## What this is

A React 18 + TypeScript + Vite frontend for the `snappshop-automation` WordPress
plugin. It renders inside `wp-admin` and talks only to the plugin's REST API at
`/wp-json/snappshop-automation/v1/`. There is no separate backend, database or
auth system in this repo — do not add one.

## Running it

- Local/sandbox: `docker compose -f docker-compose.base44.yml up -d --build`, then
  `http://localhost:3000`. Dependencies install inside the named volume on boot.
- Without Docker: `npm install && npm run dev`.
- Type check / build (must be run inside the container in the sandbox:
  `docker compose -f docker-compose.base44.yml exec -T web npm run build`).

## Demo mode (important)

`src/api/client.ts` picks a transport:

- `mock` (default in dev) → `src/api/mock/transport.ts` + `seed.ts`, dynamically
  imported. Demo data, in-memory mutations, one always-progressing sync job.
- `live` → real fetch to the WordPress plugin. Enabled with `VITE_API_MODE=live`
  (see `.env.plugin`, used by `npm run build:plugin`) or by injecting
  `window.snappShopAutomation.apiMode = 'live'`.

The UI shows a demo badge/banner whenever mock is active. Never present mock
numbers as real: keep that badge wired to `API_MODE`.

## Endpoint surface

Every route is declared once in `src/api/endpoints.ts` and typed once in
`src/api/client.ts` + `src/api/types.ts`. The plugin documentation has **not**
been supplied, so routes are provisional — changing them is a one-file edit.
`docs/INTEGRATION.md` is the authoritative list of what is wired and what is a
known gap. Do not invent endpoints; add the gap to that document instead.

## Money and dates

- All stored/displayed prices are integer **Toman**. Never convert Toman↔Rial in
  the frontend, never divide amounts. WooCommerce may report IRR — conversion is
  a backend concern.
- Dates are exchanged as ISO-8601 (Gregorian) and shown Jalali via
  `formatDate`/`formatDateTime` in `src/lib/format.ts`. Persian digits are applied
  at display time only; `parseAmount()` converts a localized input back to int.
- User display preferences (Jalali/Gregorian, fa/en digits) are applied through
  `configureDisplay()` from `PreferencesProvider` — formatters read module state,
  so don't cache formatted strings across preference changes.

## Design system

Tokens (colors, radii, shadows) live in `src/index.css` (`:root` / `.dark`) and
are mapped in `tailwind.config.js`. Components in `src/components/ui` are the only
thing pages should build with; charts wrap Recharts in
`src/components/charts/charts.tsx` (custom Persian tooltip, RTL axis reversal).
Sidebar, topbar and command palette live in `src/components/layout`.

## Gotchas

- `tsconfig.node.json` is **not** a project reference and emits nothing. If Vite
  is ever run with an emitted `vite.config.js` next to `vite.config.ts`, the stale
  JS wins and config edits (ports, allowedHosts) silently stop applying.
- The preview proxy sends the host `3000-<BASE44_PUBLIC_HOST_SUFFIX>` (a prefix,
  not a subdomain), so `allowedHosts` derives that exact host from env when
  `BASE44_PREVIEW_MODE=1`; every other environment keeps Vite's default check.
- Off-canvas drawers live outside the viewport: `overflow-x: clip` on html/body
  prevents them from adding sideways scroll on mobile.

## Verification

A change to what the app renders must be checked in the running preview. There is
no test suite yet; `npm run build` (tsc + vite) is the correctness gate.
