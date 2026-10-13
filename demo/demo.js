/* ==========================================================================
   DEMO SCAFFOLDING — NOT PART OF THE DELIVERABLE
   --------------------------------------------------------------------------
   On a real site this behaviour belongs to WoodMart's own scripts
   (swiperInit / productImagesGallery): they slide the hero carousel, keep the
   thumbnail strip in sync and write `.wd-active` / `.wd-thumb-active`.
   The sandbox has no WordPress install, so this file reproduces just those
   state changes so the redesign can be reviewed with the real class names.
   ========================================================================== */

(function () {
  document.querySelectorAll('.woocommerce-product-gallery').forEach(function (gallery) {
    var hero = gallery.querySelector('.wd-gallery-images .wd-carousel');
    var heroWrap = hero && hero.querySelector('.wd-carousel-wrap');
    var slides = hero ? Array.prototype.slice.call(hero.querySelectorAll('.wd-carousel-item')) : [];
    var thumbs = gallery.querySelector('.wd-gallery-thumb');
    var thumbItems = thumbs ? Array.prototype.slice.call(thumbs.querySelectorAll('.wd-carousel-item')) : [];
    var thumbWrap = thumbs && thumbs.querySelector('.wd-carousel-wrap');
    var arrows = gallery.querySelectorAll('.wd-gallery-images > .wd-carousel-inner > .wd-nav-arrows .wd-btn-arrow');
    var thumbArrows = thumbs ? thumbs.querySelectorAll('.wd-nav-arrows .wd-btn-arrow') : [];
    if (!hero || !slides.length) return;

    var rtl = getComputedStyle(hero).direction === 'rtl';
    var sign = rtl ? 1 : -1;
    var index = 0;

    function render() {
      heroWrap.style.transform = 'translate3d(' + (sign * index * 100) + '%,0,0)';

      slides.forEach(function (slide, i) {
        slide.classList.toggle('wd-active', i === index);
      });
      thumbItems.forEach(function (item, i) {
        item.classList.toggle('wd-thumb-active', i === index);
      });

      arrows.forEach(function (arrow) {
        var isPrev = arrow.classList.contains('wd-prev');
        arrow.classList.toggle('wd-disabled', isPrev ? index === 0 : index === slides.length - 1);
      });
      thumbArrows.forEach(function (arrow) {
        var step = arrow.classList.contains('wd-prev') ? -1 : 1;
        var end = step < 0 ? 0 : thumbItems.length - 1;
        arrow.classList.toggle('wd-disabled', index === end);
      });
    }

    thumbItems.forEach(function (item, i) {
      item.addEventListener('click', function () { index = i; render(); });
    });

    arrows.forEach(function (arrow) {
      arrow.addEventListener('click', function () {
        var step = arrow.classList.contains('wd-prev') ? -1 : 1;
        var next = index + step;
        if (next < 0 || next > slides.length - 1) return;
        index = next;
        render();
      });
    });

    /* swipe — the same mirrored direction an RTL carousel uses */
    var startX = null;
    hero.addEventListener('touchstart', function (event) {
      startX = event.touches[0].clientX;
    }, { passive: true });

    hero.addEventListener('touchend', function (event) {
      if (startX === null) return;
      var delta = event.changedTouches[0].clientX - startX;
      startX = null;
      if (Math.abs(delta) < 40) return;
      var step = (rtl ? delta > 0 : delta < 0) ? 1 : -1;
      var next = Math.min(Math.max(index + step, 0), slides.length - 1);
      if (next !== index) { index = next; render(); }
    }, { passive: true });

    hero.classList.add('wd-initialized');
    render();

    /* the enlarge trigger belongs to WoodMart's lightbox on a real site */
    var enlarge = gallery.querySelector('.woodmart-show-product-gallery');
    if (enlarge) {
      enlarge.addEventListener('click', function (event) { event.preventDefault(); });
    }
  });

  /* --- plain demo behaviour for the sections that are NOT redesigned ------ */
  document.querySelectorAll('.woocommerce-tabs').forEach(function (tabs) {
    var links = tabs.querySelectorAll('ul.tabs a');
    var panels = tabs.querySelectorAll('.woocommerce-Tabs-panel');
    links.forEach(function (link) {
      link.addEventListener('click', function (event) {
        event.preventDefault();
        var target = link.getAttribute('href');
        links.forEach(function (l) {
          l.parentElement.classList.toggle('active', l === link);
        });
        panels.forEach(function (panel) {
          if ('#' + panel.id === target) panel.removeAttribute('hidden');
          else panel.setAttribute('hidden', '');
        });
      });
    });
  });

  var addToCart = document.querySelector('.single_add_to_cart_button');
  if (addToCart) {
    addToCart.addEventListener('click', function (event) { event.preventDefault(); });
  }
})();
