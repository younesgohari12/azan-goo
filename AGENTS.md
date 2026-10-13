# AGENTS.md — Base44 sandbox notes

## What this repo is

A **deliverable workspace**, not a runnable WordPress site. There is no
WooCommerce/WoodMart install here. The work product is a scoped stylesheet for
a single-product image gallery.

| path | role |
|---|---|
| `gallery/product-gallery.css` | ★ the deliverable (the whole implementation) |
| `gallery/README.md` | ★ install / token / scoping documentation |
| `index.html` | demo harness: a single-product page that embeds the **real** WoodMart gallery markup |
| `demo/woodmart-base.css` | harness only — minimal emulation of WoodMart's gallery base CSS |
| `demo/demo.css` | harness only — neutral styles for the deliberately untouched sections |
| `demo/demo.js` | harness only — reproduces WoodMart's gallery state changes (no WordPress here) |
| `product-gallery-redesign.zip` | ★ packaged deliverable (CSS + README); **regenerate after every CSS change** |

## Non-obvious things a future session must know

- **The gallery CSS is class-driven.** It never adds or removes behaviour — it
  only reads the state classes WoodMart itself writes:
  `wd-active` (hero slide, Swiper `slideActiveClass`), `wd-thumb-active`
  (thumbnail, `slideThumbActiveClass`), `wd-initialized` (carousel ready),
  `image-action-zoom` / `image-action-none`, `thumbs-position-*`.
  Source of truth: WoodMart 8.6.4 partials
  `css/parts/woo-single-prod-el-gallery.css` and
  `js/scripts/wc/productImagesGallery.min.js` (both verified live from
  `woodmart.xtemos.com`), plus the rendered markup of a real product page.
  Do not invent class names — fetch and confirm against those files.
- **Real markup shape** (WoodMart 8.6.x):
  `.product-images > .woocommerce-product-gallery`
  → `.wd-carousel-container.wd-gallery-images` (hero: `.wd-carousel` is the
  `figure.woocommerce-product-gallery__wrapper`; items are `.wd-carousel-item`
  wrapping `figure.woocommerce-product-gallery__image`; the enlarge trigger is
  `a.woodmart-show-product-gallery` inside `.product-additional-galleries`)
  → `.wd-carousel-container.wd-gallery-thumb` (thumbs: `.wd-carousel-item > img`
  plus a `.wd-nav-arrows.wd-thumb-nav`).
- **Scope rule**: every selector starts with
  `.single-product .woocommerce-product-gallery`. Keep it that way — the brief
  forbids touching anything else on the page.
- **No JS and no template override are required.** If a change seems to need
  either, prefer a WoodMart variable instead (`--wd-brd-radius`,
  `--wd-gallery-gap`, `--wd-arrow-width`, `--wd-arrow-offset-h`).
- **`demo.js` exists only because there is no WordPress here.** It slides the
  hero strip and writes `wd-active` / `wd-thumb-active` so the CSS can be
  reviewed with real class names. It is never shipped.

## Run / verify

```bash
docker compose -f docker-compose.base44.yml up -d --build
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3000/     # expect 200
```

The stack is a plain `python:3.12-alpine` static server on host port 3000,
serving the bind-mounted repo — no build step, so edits are live.

Checks worth running in the browser preview:

1. hero image is large, rounded, soft-shadowed, warm-ivory card around it;
2. thumbnail strip: active thumbnail has a deep-green hairline + halo, the
   others are dimmed, and a 2px orange tick sits under the active one;
3. clicking a thumbnail moves the hero image and the active state (this is the
   harness reproducing WoodMart's behaviour);
4. the enlarge trigger (`بزرگ‌نمایی`) sits bottom-inline-start of the hero and
   turns deep green on hover;
5. no horizontal overflow at 375px; thumbnail touch targets stay comfortable.
