# AGENTS.md — azan-goo

## What this repository is

A **static HTML + CSS UI prototype** of a WooCommerce-style single product page, in
Persian RTL, for a women's fashion boutique. There is **no JavaScript, no build step,
no framework and no backend** — this is deliberate and part of the brief.

- `index.html` — the whole page (semantic HTML; product artwork is inline SVG).
- `styles.css` — the whole design system (tokens → base → components → responsive).
- `product-page-ui.zip` — the packaged design deliverable (contains only `index.html` + `styles.css`).
- `product-page-full-project.zip` — the same design plus this repo's own files (README, AGENTS.md,
  compose, nginx config, `.base44/environment.json`). Both ZIPs are downloadable from the preview.
- `docker/nginx.dev.conf` — dev nginx config used only by the sandbox.

Because the deliverable must stay JavaScript-free, **all interactivity on the page is
CSS-only** and it is easy to break by accident:

- Product tabs are a radio group (`input.tabs__radio` + `label.tabs__tab`) revealed with
  `#tab-x:checked ~ .tabs__panels .tabs__panel--x`. The three `input.tabs__radio` elements
  **must stay siblings that come before** `.tabs__nav` and `.tabs__panels` — moving them
  into a wrapper silently breaks every tab.
- Size/colour selection uses visually-hidden radios plus `:checked + label` styling.
- "بازنشانی انتخابها" is a real `<button type="reset">` inside `<form class="buy-form">`,
  which is what makes it restore the default size/colour without any JS. Do not give the
  form a submit button.

## Running it here

```bash
docker compose -f docker-compose.base44.yml up -d --build
```

One `nginx:alpine` service serves the source files on host port 3000. There is no
compilation step: edit `index.html` / `styles.css` and refresh the preview.

**Mount quirk:** the sandbox repository root is mode `0700`, so nginx workers (running as
the unprivileged `nginx` user) cannot traverse a bind-mounted *directory*. The compose file
therefore bind-mounts the individual source files. **If you add a new file that must be
served, add a matching `volumes:` entry** or it will 404.

`.base44/environment.json` records the port/health path; the app needs no secrets.

## Verifying

- `curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3000/` → `200`
- `curl -s http://localhost:3000/styles.css | head` → the real stylesheet
- The packaged ZIP is downloadable at `/product-page-ui.zip`.

Visual checks worth repeating: no horizontal overflow at ~1400px / ~820px / ~390px, all
three product tabs switch, the size/colour radios show their selected state, and the
disabled `XL` size / زغالی colour stay unselectable.

## Rebuilding the deliverable ZIP

```bash
python3 -c "import zipfile;z=zipfile.ZipFile('product-page-ui.zip','w',zipfile.ZIP_DEFLATED);[z.write(f,f) for f in ('index.html','styles.css')];z.close()"
```

The ZIP must be regenerated after any edit to `index.html` or `styles.css`.
