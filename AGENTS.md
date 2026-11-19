# SnappShop Automation — admin UI

Static frontend for the SnappShop Automation WordPress plugin. No framework, no build step:
`app/index.html` + `app/assets/{css,js}` are served as-is.

## Run / verify

```bash
docker compose -f docker-compose.base44.yml up -d --build
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/
```

- The container serves `./app` on host port 3000 and rebuilds
  `app/download/snappshop-automation-ui.zip` on every start (the download link in the UI points there).
- There is no compile step, so edits to files under `app/` are served immediately; a browser refresh is enough.

## Things that are easy to get wrong

- **Icon refresh:** `lucide.createIcons()` scans the whole document and replaces `[data-lucide]`
  nodes. Never call it from a MutationObserver — the replacement retriggers the observer and freezes
  the page. Call `refreshIcons()` explicitly after injecting markup.
- **Mock vs live API:** `app/assets/js/core/api.js` switches on `window.SNAPP_AUTOMATION.mode`.
  Without that global it runs the mock adapter (`mock-data.js` + `mock-api.js`) against the same REST
  contract as `/wp-json/snappshop-automation/v1`. To connect the real backend, localize
  `SNAPP_AUTOMATION = { mode: 'live', apiBase, nonce }` from PHP (see `app/README.md`).
- **Auth:** session + `X-WP-Nonce` only. No token/secret is ever written to JS variables that outlive a
  request or to localStorage (only theme/sidebar/role-display preferences are stored).
- **Money:** prices are decimal strings in Toman and are never divided by 10. Unknown order amounts
  (`null`) render as «نامشخص» and are excluded from sales totals.
- **Routing:** hash-based (`#/products`). New pages go in `app/assets/js/pages/` and are registered in
  `app/assets/js/core/router.js` (nav groups come from the same table).

## Verification checklist

1. `#/dashboard` renders six stat cards, health card and recent orders.
2. `#/products` renders the table, search/filter, selection bulk bar, column menu and detail drawer.
3. `#/pricing` wizard: select product → rule → preview → apply; history revert opens a preview modal.
4. `#/sync` wizard completes and updates settings.
5. `Ctrl+K` opens the command palette; the theme toggle persists.
6. No console errors on any route.
