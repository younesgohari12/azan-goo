# AGENTS.md — azan-goo / poshak99

## What this repository is

A **premium Persian RTL single-product page UI** (WooCommerce/WoodMart visual prototype)
built with plain HTML + CSS + **vanilla JavaScript**. There is **no build step, no
framework, no React/Vue and no external animation library**.

- `index.html` — whole page (semantic HTML; product artwork is inline SVG).
- `styles.css` — whole design system (tokens → base → components → responsive → motion).
- `script.js` — all behaviour (loader, gallery, reveal, spotlight, variations, cart, tabs,
  sticky bar, back-to-top).
- `poshak99-product-ui.zip` — the deliverable: `index.html` + `styles.css` + `script.js`.
- `product-page-full-project.zip` — the deliverable plus this repo's own files.
- `docker/nginx.dev.conf` — dev nginx config used only by the sandbox.

## Hard rules that are easy to break

1. **Everything is scoped.** Every rule in `styles.css` is prefixed with `.product99-ui`
   (plus one `html.p99-js` progressive-enhancement flag). There are **no global element
   selectors** (`button {}`, `a {}`, `img {}`, …) so the file can be dropped into a
   WoodMart/WooCommerce theme without leaking. Do not add unscoped selectors.
2. **Tokens are `--p99-*`** to avoid clashing with theme variables.
3. **No-JS safety.** `[data-reveal]` content is hidden *only* under `html.p99-js`, which is
   set by a tiny inline script in `<head>`. The loader and the hidden content both carry
   `p99-loader-escape` / `p99-content-escape` keyframe fallbacks that fire after ~3s, so a
   JS failure can never leave the page blank. Keep those fallbacks.
4. **Overlays live inside `.product99-ui` but outside `.p99-content`.** `.p99-content`
   carries the load-time `filter: blur()`, which would otherwise become the containing
   block for the `position: fixed` sticky bar / lightbox / back-to-top button and break them.
5. **Variation controls are real form controls.** Size/colour are visually-hidden radios with
   `:checked + label` styling; "بازنشانی انتخابها" is a real `<button type="reset">` inside
   `<form id="p99-buy">`. Do not give the form a submit button (no fake WooCommerce logic).
6. **Tabs are real ARIA tabs** (`role="tablist/tab/tabpanel"`, roving `tabindex`, arrow keys).
   The height animation in `select()` needs the outgoing panel to get `.is-leaving`
   (absolutely positioned) before the new panel is measured, or the height will be wrong.
7. `prefers-reduced-motion` must disable reveals, count-up, shimmer, pulse and magnetic
   effects — check both the CSS media block and the `reduceMQ` checks in `script.js`.

## Running it here

```bash
docker compose -f docker-compose.base44.yml up -d --build
```

One `nginx:alpine` service serves the source files on host port 3000. No compilation:
edit the files and refresh.

**Mount quirk:** the sandbox repository root is mode `0700`, so nginx workers (running as
the unprivileged `nginx` user) cannot traverse a bind-mounted *directory*. The compose file
therefore bind-mounts the individual source files. **If you add a new file that must be
served, add a matching `volumes:` entry** or it will 404.

## Verifying

- `curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3000/` → `200`
- `curl -s http://localhost:3000/script.js | head` → the real script
- ZIPs are downloadable at `/poshak99-product-ui.zip` and `/product-page-full-project.zip`.

Worth repeating after any change: no horizontal overflow at ~1400 / ~760 / ~375px, the
skeleton loader disappears and content becomes visible, all three tabs switch and the
indicator slides, size/colour select and reset, disabled `XL` / زغالی stay unselectable,
add-to-cart runs loading → success, quantity clamps at 1 and 5, the mobile sticky bar
appears after the CTA scrolls away and does not overlap anything, and there are no console
errors.

## Rebuilding the ZIPs

```bash
python3 -c "import zipfile;z=zipfile.ZipFile('poshak99-product-ui.zip','w',zipfile.ZIP_DEFLATED);[z.write(f,f) for f in ('index.html','styles.css','script.js')];z.close()"
```

Both ZIPs must be regenerated after edits, and the full-project ZIP must be built **after**
any edit to `AGENTS.md` (it contains a copy of this file).

**Never `rm` these ZIPs.** They are bind-mounted as individual files, so deleting one leaves
the container holding the removed inode and nginx keeps serving the stale copy with no error
anywhere. Write over them instead (`zipfile(..., "w")` truncates in place), or recreate the
stack afterwards with `docker compose -f docker-compose.base44.yml up -d --force-recreate`.
After any rebuild, confirm the served copy matches the local one (compare file sizes or
hashes) rather than trusting a `200`.
