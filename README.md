# تن‌ست — بازطراحی گالری تصاویر محصول

Redesign of **only** the single-product image gallery for a WooCommerce +
WoodMart store, in a premium warm-minimal Persian RTL style.

## The deliverable

```
gallery/product-gallery.css   ← the complete implementation (CSS only)
gallery/README.md             ← install, tokens, scoping notes
product-gallery-redesign.zip  ← both of the above, packaged
```

No JavaScript is needed and no WooCommerce/WoodMart template override is
needed: the stylesheet only reads the state classes the theme already writes,
so Swiper, the thumbnail sync, the theme zoom and the enlarge/fullscreen
trigger keep working exactly as before.

Untouched, by design: product title, price, short description, variations,
quantity, add-to-cart, product tabs, related products, header, footer.

## Preview

`index.html` is a demo single-product page that embeds the **real** WoodMart
gallery markup (`thumbs-position-bottom`), so the gallery can be reviewed in the
context of a full product page. Everything else on that page is deliberately
plain — it is scaffolding, not part of the redesign.

```bash
docker compose -f docker-compose.base44.yml up -d --build
# http://localhost:3000
```

`demo/` holds harness-only files (a minimal emulation of WoodMart's gallery
base CSS plus the state changes WoodMart's own scripts perform). They are never
shipped and are not referenced by `gallery/product-gallery.css`.
