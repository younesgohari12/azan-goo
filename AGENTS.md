# Project notes

## What this is
A single-file static page: `index.html` contains all markup, CSS and vanilla JS
(no build step, no framework, no dependencies). Opening the file directly in a
browser must work — keep it self-contained.

## Running it in the Base44 sandbox
```
docker compose -f docker-compose.base44.yml up -d
```
- One service (`web`): `python -m http.server 3000` on top of `python:3.12-alpine`,
  with the repo bind-mounted at `/app`.
- No dependency install and no build — the server reads files from disk on every
  request, so edits are live. Reload the browser tab to see HTML/CSS changes.
- The only external asset is the Vazirmatn web font, loaded from jsDelivr
  (`Vazirmatn-font-face.css`); a Tahoma/system fallback keeps the page readable offline.

## Verifying
- `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/` → `200`.
- `curl -s http://localhost:3000/ | grep -c "footer__grid"` → non-zero (real source is served).
- Layout breakpoints to check: desktop (4 columns), ≤1080px (2 columns),
  ≤680px (1 column, full-width CTA, floating buttons kept clear of content via
  extra footer bottom padding).

## Quirks
- Persian RTL: never apply `letter-spacing` to Persian text (it breaks glyph
  joining); digits that must read left-to-right use `direction: ltr` +
  `unicode-bidi: isolate`.
- `html, body { overflow-x: hidden }` is deliberate — the decorative waves/glows
  must never create a horizontal scrollbar.
