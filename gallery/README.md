# Premium Warm-Minimal Product Gallery — CSS

A drop-in redesign of **only** the single-product image gallery for
WooCommerce + WoodMart, built for a warm-minimal Persian RTL fashion store.

```
gallery/
└── product-gallery.css      ← the complete implementation
```

**No JavaScript file. No template override. No new library.**

---

## What it changes

Only the gallery subtree:

```
.product-images
└── .woocommerce-product-gallery
    ├── .wd-gallery-images        hero carousel (large, clean, soft shadow)
    └── .wd-gallery-thumb         thumbnail strip (elegant, clear active state)
```

Untouched: product title, price, short description, variations, quantity,
add-to-cart, product tabs, related products, header, footer.

## What it preserves

WooCommerce and WoodMart behaviour is not rebuilt — the CSS only reads the
state classes WoodMart already writes:

| WoodMart class | meaning | used for |
|---|---|---|
| `.wd-active` | current hero slide (`slideActiveClass`) | calm image arrival, neighbour dimming |
| `.wd-thumb-active` | current thumbnail (`slideThumbActiveClass`) | active ring + orange tick |
| `.wd-initialized` | carousel ready | dimming only after initialisation (no first-paint flash) |
| `.image-action-zoom` / `.image-action-none` | theme zoom on / off | CSS hover zoom is skipped when the theme magnifier is active |
| `.thumbs-position-bottom` / `-left` / `-right` | theme thumbnail placement | works in every position |

Swiper sliding + swiping, thumbnail sync, the theme zoom (`ZoomImg`), the
arrows and the fullscreen / “click to enlarge” trigger
(`a.woodmart-show-product-gallery`) all keep their own logic and markup.

## Install

1. Copy `product-gallery.css` into your **WoodMart child theme**, e.g.
   `wp-content/themes/woodmart-child/assets/css/product-gallery.css`.
2. Enqueue it after the theme CSS, on single product pages only:

```php
// functions.php — WoodMart child theme
add_action( 'wp_enqueue_scripts', function () {
    if ( ! is_product() ) {
        return;
    }
    wp_enqueue_style(
        'tsg-product-gallery',
        get_stylesheet_directory_uri() . '/assets/css/product-gallery.css',
        array( 'woodmart-style' ),          // load AFTER the theme
        '1.0.0'
    );
} );
```

3. Optional (but recommended) — in
   **WoodMart → Theme Settings → Single Product → Gallery**:
   - *Thumbnails position*: **Bottom**
   - *Zoom*: either **Zoom** (theme magnifier) or **Off** (then the CSS hover
     zoom is used) — both are styled.

Nothing else is required. Existing image URLs, gallery order, variation
switching and all dynamic data are read from WooCommerce as before.

## Design tokens

Everything is driven by variables declared on the gallery root, so you can
re-tune the look without touching a single rule:

```css
.single-product .woocommerce-product-gallery {
  --tsg-surface:   #FFFDFA;   /* soft white card        */
  --tsg-surface-2: #F7F2EA;   /* warm ivory inset       */
  --tsg-green:     #24503C;   /* deep green accent      */
  --tsg-orange:    #E07B3C;   /* the one small highlight */
  --tsg-r:         18px;      /* hero radius (16–20px)  */
  --tsg-r-sm:      14px;      /* thumbnail radius       */
  --tsg-r-out:     20px;      /* gallery shell radius   */
}
```

It also feeds WoodMart's own gallery variables (`--wd-brd-radius`,
`--wd-gallery-gap`, `--wd-arrow-width`), so the theme's internals and this
sheet stay in agreement instead of fighting each other.

## Notes

- **Scope.** Every selector starts with
  `.single-product .woocommerce-product-gallery`, so the sheet cannot leak into
  the shop loop, quick view, cart or any other page. The shop-loop product
  cards are a different component and are not affected.
- **RTL.** Only logical properties are used (`inset-inline`, `margin-inline`,
  `max-inline-size`…), so the strip, the arrows and the orange tick mirror
  correctly under `dir="rtl"`.
- **No horizontal overflow.** The theme's carousels already clip with
  `overflow: hidden`; on mobile the hero arrows are pulled inside the image
  (`--wd-arrow-offset-h`) so they can never widen the page.
- **Stable layout.** No fixed aspect ratio or hard crop is forced — the hero
  keeps your uploaded image ratio (WooCommerce/WoodMart “hard crop” setting
  still governs it), so nothing jumps when swiping.
- **If you ever need to force the thumbnails below** although the theme setting
  is “Left”, add:

  ```css
  .single-product .woocommerce-product-gallery { flex-direction: column; }
  .single-product .woocommerce-product-gallery .wd-gallery-thumb { flex: 1 1 100%; max-width: 100%; }
  ```

- **Want the gallery to take more width** on desktop? That is the single
  product column split (theme settings / WoodMart layout builder), not the
  gallery itself — change it there so the summary column stays in charge of its
  own layout.
