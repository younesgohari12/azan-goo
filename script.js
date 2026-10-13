/* ==========================================================================
   poshak99 — Persian RTL product UI behaviour
   Vanilla JS only. Everything is scoped to .product99-ui; nothing global is
   patched, no theme markup is replaced, and every effect degrades to a plain
   usable control when JS or motion is unavailable.

   1) helpers            7) quantity
   2) loader            8) add to cart
   3) scroll reveal     9) tabs
   4) pointer polish   10) sticky purchase bar
   5) gallery          11) back to top
   6) variations       12) misc
   ========================================================================== */
(function () {
  'use strict';

  var root = document.getElementById('p99-root');
  if (!root) return;

  var reduceMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
  var fineMQ = window.matchMedia('(hover: hover) and (pointer: fine)');
  var mobileMQ = window.matchMedia('(max-width: 900px)'); /* matches the CSS breakpoint */

  function reduced() { return reduceMQ.matches; }
  function $ (sel, ctx) { return (ctx || root).querySelector(sel); }
  function $$ (sel, ctx) { return Array.prototype.slice.call((ctx || root).querySelectorAll(sel)); }
  function raf(fn) {
    if (window.requestAnimationFrame) return window.requestAnimationFrame(fn);
    return window.setTimeout(fn, 16);
  }

  /* ------------- 1) helpers ------------- */
  var FA_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  function toFa(value) {
    return String(value).replace(/\d/g, function (d) { return FA_DIGITS[+d]; });
  }
  function groupFa(n) {
    return toFa(String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '٬'));
  }
  function bump(el, cls) {
    if (!el) return;
    el.classList.remove(cls);
    void el.offsetWidth; /* restart the animation without a timer */
    el.classList.add(cls);
  }

  /* Fires once when an element has scrolled fully above the viewport. An
     IntersectionObserver drives it during normal scrolling; the rAF-throttled
     scroll reconciliation (at most one rect read per frame) keeps it correct
     when the page jumps, because a jump never produces an intersection crossing. */
  function watchPast(el, onChange) {
    var state = null;
    function compute() {
      var past = el.getBoundingClientRect().bottom < 0;
      if (past === state) return;
      state = past;
      onChange(past);
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function () { compute(); }, { threshold: 0 }).observe(el);
    }
    var queued = false;
    window.addEventListener('scroll', function () {
      if (queued) return;
      queued = true;
      raf(function () { queued = false; compute(); });
    }, { passive: true });
    window.addEventListener('resize', compute, { passive: true });
    compute();
  }

  /* ------------- 2) loader ------------- */
  (function initLoader() {
    var loaderEl = document.getElementById('p99-loader');
    var settled = false;

    function finish() {
      if (settled) return;
      settled = true;
      root.classList.remove('is-loading');
      root.classList.add('is-ready');
      root.setAttribute('aria-busy', 'false');
      if (loaderEl) {
        loaderEl.classList.add('is-gone');
        loaderEl.setAttribute('aria-hidden', 'true');
        window.setTimeout(function () {
          if (loaderEl && loaderEl.parentNode) loaderEl.parentNode.removeChild(loaderEl);
        }, reduced() ? 0 : 520);
      }
      if (typeof window.CustomEvent === 'function') {
        document.dispatchEvent(new CustomEvent('p99:ready'));
      }
    }

    var fonts = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
    var minimum = new Promise(function (resolve) {
      window.setTimeout(resolve, reduced() ? 0 : 300);
    });

    if (typeof Promise !== 'undefined') {
      Promise.all([fonts, minimum]).then(finish);
    } else {
      window.setTimeout(finish, 400);
    }
    window.setTimeout(finish, 1300); /* hard cap — never a fake long load */
  }());

  /* ------------- 3) scroll reveal ------------- */
  (function initReveal() {
    var els = $$('[data-reveal], [data-reveal-line]');
    if (!els.length) return;

    els.forEach(function (el) {
      var delay = el.getAttribute('data-reveal-delay');
      if (delay) el.style.setProperty('--p99-reveal-delay', delay + 'ms');
    });

    function revealAll() {
      els.forEach(function (el) { el.classList.add('is-revealed'); });
    }

    if (!('IntersectionObserver' in window) || reduced()) {
      revealAll();
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-revealed');
        io.unobserve(entry.target); /* run once */
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

    els.forEach(function (el) { io.observe(el); });

    if (reduceMQ.addEventListener) {
      reduceMQ.addEventListener('change', function () { if (reduced()) revealAll(); });
    }
  }());

  /* ------------- 4) pointer polish ------------- */
  (function initPointer() {
    if (reduced() || !fineMQ.matches) return;

    /* 4a — spotlight following the cursor inside premium cards */
    $$('[data-spotlight]').forEach(function (el) {
      var rect = null, x = 0, y = 0, queued = false;

      el.addEventListener('pointerenter', function (e) {
        if (e.pointerType !== 'mouse') return;
        rect = el.getBoundingClientRect(); /* read once, not per frame */
        el.classList.add('has-spot');
      });

      el.addEventListener('pointermove', function (e) {
        if (!rect || e.pointerType !== 'mouse') return;
        x = e.clientX - rect.left;
        y = e.clientY - rect.top;
        if (queued) return;
        queued = true;
        raf(function () {
          queued = false;
          el.style.setProperty('--mx', x + 'px');
          el.style.setProperty('--my', y + 'px');
        });
      });

      el.addEventListener('pointerleave', function () {
        rect = null;
        el.classList.remove('has-spot');
        el.style.removeProperty('--mx');
        el.style.removeProperty('--my');
      });
    });

    /* 4b — extremely subtle magnetic pull on the primary CTA */
    $$('.btn--primary').forEach(function (btn) {
      var rect = null, queued = false, tx = 0, ty = 0;

      btn.addEventListener('pointerenter', function (e) {
        if (e.pointerType !== 'mouse') return;
        rect = btn.getBoundingClientRect();
      });

      btn.addEventListener('pointermove', function (e) {
        if (!rect || e.pointerType !== 'mouse') return;
        tx = ((e.clientX - rect.left) / rect.width - .5) * 6;
        ty = ((e.clientY - rect.top) / rect.height - .5) * 4;
        if (queued) return;
        queued = true;
        raf(function () {
          queued = false;
          btn.style.setProperty('--tx', tx.toFixed(2) + 'px');
          btn.style.setProperty('--ty', ty.toFixed(2) + 'px');
        });
      });

      btn.addEventListener('pointerleave', function () {
        rect = null;
        btn.style.setProperty('--tx', '0px');
        btn.style.setProperty('--ty', '0px');
      });
    });
  }());

  /* ------------- 5) gallery ------------- */
  (function initGallery() {
    var frame = $('[data-gallery-frame]');
    var track = document.getElementById('p99-track');
    if (!frame || !track) return;

    var slides = $$('.p99-slide', track);
    var thumbsWrap = document.getElementById('p99-thumbs');
    var thumbs = $$('.thumb', thumbsWrap);
    var indicator = document.getElementById('p99-indicator');
    var status = document.getElementById('p99-gallery-status');
    var index = 0;

    function placeIndicator(animate) {
      if (!indicator || !thumbs.length) return;
      var active = thumbs[index];
      if (!active) return;
      var wrapRect = thumbsWrap.getBoundingClientRect();
      var rect = active.getBoundingClientRect();
      if (!animate) indicator.style.transition = 'none';
      indicator.style.width = rect.width + 'px';
      indicator.style.height = rect.height + 'px';
      indicator.style.transform =
        'translate3d(' + (rect.left - wrapRect.left + thumbsWrap.scrollLeft) + 'px,' +
        (rect.top - wrapRect.top) + 'px,0)';
      if (!animate) {
        void indicator.offsetWidth;
        indicator.style.transition = '';
      }
    }

    function go(next) {
      var target = (next + slides.length) % slides.length;
      if (target === index) return;

      slides[index].classList.remove('is-active');
      thumbs[index].classList.remove('is-active');
      thumbs[index].removeAttribute('aria-current');

      index = target;

      slides[index].classList.add('is-active');
      thumbs[index].classList.add('is-active');
      thumbs[index].setAttribute('aria-current', 'true');
      placeIndicator(true);

      if (status) status.textContent = 'تصویر ' + toFa(index + 1) + ' از ' + toFa(slides.length);
    }

    thumbs.forEach(function (thumb, i) {
      thumb.addEventListener('click', function () { go(i); });
    });

    /* keyboard support on the thumbnail strip */
    thumbsWrap.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault();
      var dir = e.key === 'ArrowLeft' ? 1 : -1; /* RTL: left = next */
      var nxt = (index + dir + slides.length) % slides.length;
      go(nxt);
      if (thumbs[nxt]) thumbs[nxt].focus();
    });

    placeIndicator(false);
    var resizeQueued = false;
    window.addEventListener('resize', function () {
      if (resizeQueued) return;
      resizeQueued = true;
      raf(function () { resizeQueued = false; placeIndicator(false); });
    }, { passive: true });

    /* 5a — touch swipe */
    var dragStartX = null, dragDX = 0;
    frame.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse' || reduced()) return;
      dragStartX = e.clientX;
      dragDX = 0;
      track.classList.add('is-dragging');
    });
    frame.addEventListener('pointermove', function (e) {
      if (dragStartX === null || e.pointerType === 'mouse') return;
      dragDX = e.clientX - dragStartX;
      track.style.transform = 'translate3d(' + (dragDX * .32).toFixed(1) + 'px,0,0)';
    });
    function endDrag() {
      if (dragStartX === null) return;
      track.classList.remove('is-dragging');
      track.style.transform = '';
      if (Math.abs(dragDX) > 42) go(dragDX < 0 ? index + 1 : index - 1);
      dragStartX = null;
      dragDX = 0;
    }
    frame.addEventListener('pointerup', endDrag);
    frame.addEventListener('pointercancel', endDrag);

    /* 5b — cursor-following zoom hint (desktop only) */
    var follow = document.getElementById('p99-zoom-follow');
    if (follow && fineMQ.matches && !reduced()) {
      var frameRect = null, queued = false, fx = 0, fy = 0;
      frame.addEventListener('pointerenter', function (e) {
        if (e.pointerType === 'mouse') frameRect = frame.getBoundingClientRect();
      });
      frame.addEventListener('pointermove', function (e) {
        if (!frameRect || e.pointerType !== 'mouse') return;
        fx = e.clientX - frameRect.left;
        fy = e.clientY - frameRect.top;
        if (queued) return;
        queued = true;
        raf(function () {
          queued = false;
          follow.style.transform = 'translate3d(' + fx + 'px,' + fy + 'px,0) translate(-50%,-50%)';
          follow.classList.add('is-on');
        });
      });
      frame.addEventListener('pointerleave', function () {
        frameRect = null;
        follow.classList.remove('is-on');
      });
    }

    /* 5c — lightweight lightbox layer */
    var lightbox = document.getElementById('p99-lightbox');
    var stage = document.getElementById('p99-lightbox-stage');
    var closeBtn = document.getElementById('p99-lightbox-close');
    var opener = $('[data-lightbox-open]');
    var lastFocus = null;

    function openLightbox() {
      if (!lightbox || !stage) return;
      var svg = slides[index].querySelector('svg');
      if (!svg) return;
      stage.innerHTML = '';
      stage.appendChild(svg.cloneNode(true));
      lastFocus = document.activeElement;
      lightbox.classList.add('is-open');
      if (closeBtn) closeBtn.focus();
    }
    function closeLightbox() {
      if (!lightbox || !lightbox.classList.contains('is-open')) return;
      lightbox.classList.remove('is-open');
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    if (opener) opener.addEventListener('click', openLightbox);
    if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
    if (lightbox) {
      lightbox.addEventListener('click', function (e) {
        if (e.target === lightbox) closeLightbox();
      });
      lightbox.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') { e.preventDefault(); closeLightbox(); return; }
        if (e.key === 'Tab') { e.preventDefault(); if (closeBtn) closeBtn.focus(); }
      });
    }
  }());

  /* ------------- 6) variations ------------- */
  (function initVariations() {
    var form = document.getElementById('p99-buy');
    if (!form) return;

    var valueEl = document.getElementById('p99-var-value');
    var noteEl = document.getElementById('p99-var-note');
    var box = document.getElementById('p99-var-summary');
    var stickyMeta = document.getElementById('p99-sticky-meta');

    function labelOf(name) {
      var input = form.querySelector('input[name="' + name + '"]:checked');
      if (!input) return '';
      var label = form.querySelector('label[for="' + input.id + '"]');
      return label ? label.textContent.trim() : '';
    }

    function update(announce) {
      var text = 'اندازه ' + labelOf('size') + ' · رنگ ' + labelOf('color');
      if (valueEl) {
        valueEl.textContent = text;
        bump(valueEl, 'is-bump');
      }
      if (stickyMeta) stickyMeta.textContent = text;
      if (box) bump(box, 'is-flash');
      if (announce && noteEl) noteEl.textContent = '';
    }

    form.addEventListener('change', function (e) {
      if (!e.target || (e.target.name !== 'size' && e.target.name !== 'color')) return;
      var field = e.target.closest ? e.target.closest('.field') : null;
      if (field) bump(field, 'is-flash');
      update(true);
    });

    /* reset is a real <button type="reset">: read the values after they revert */
    form.addEventListener('reset', function () {
      window.setTimeout(function () { update(true); }, 0);
    });

    /* unavailable options give elegant feedback instead of doing nothing */
    form.addEventListener('click', function (e) {
      var label = e.target.closest ? e.target.closest('.chips__label, .swatches__label') : null;
      if (!label) return;
      var input = label.htmlFor ? document.getElementById(label.htmlFor) : null;
      if (!input || !input.disabled) return;
      e.preventDefault();
      bump(label, 'is-shake');
      if (noteEl) {
        var name = input.getAttribute('data-color-name') || label.textContent.trim();
        noteEl.textContent = '«' + name + '» در حال حاضر موجود نیست.';
      }
    });

    update(false);
  }());

  /* ------------- 7) quantity ------------- */
  (function initQuantity() {
    var valueEl = document.getElementById('p99-qty');
    var buttons = $$('.stepper__btn');
    if (!valueEl || !buttons.length) return;

    var MIN = 1, MAX = 5, qty = 1;

    function render() {
      valueEl.textContent = toFa(qty);
      bump(valueEl, 'is-bump');
      buttons.forEach(function (btn) {
        var step = Number(btn.getAttribute('data-step')) || 0;
        var blocked = (step < 0 && qty <= MIN) || (step > 0 && qty >= MAX);
        btn.classList.toggle('is-muted', blocked);
        btn.setAttribute('aria-disabled', blocked ? 'true' : 'false');
      });
    }

    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        bump(btn, 'is-press');
        var step = Number(btn.getAttribute('data-step')) || 0;
        var next = Math.min(MAX, Math.max(MIN, qty + step));
        if (next === qty) { /* tactile nudge at the bound instead of an ugly jump */
          bump(btn, 'is-shake');
          return;
        }
        qty = next;
        render();
      });
    });

    render();
  }());

  /* ------------- 8) add to cart ------------- */
  (function initCart() {
    var buttons = $$('[data-add-to-cart]');
    if (!buttons.length) return;

    var status = document.getElementById('p99-cart-status');
    var badge = document.getElementById('p99-cart-badge');
    var count = 1;
    var busy = false;

    function setState(state) {
      buttons.forEach(function (btn) {
        btn.classList.toggle('is-loading', state === 'loading');
        btn.classList.toggle('is-done', state === 'done');
        btn.setAttribute('aria-busy', state === 'loading' ? 'true' : 'false');
      });
    }

    buttons.forEach(function (btn) {
      btn.addEventListener('pointerdown', function (e) {
        if (reduced()) return;
        var rect = btn.getBoundingClientRect();
        var ripple = document.createElement('span');
        ripple.className = 'btn__ripple';
        ripple.style.left = (e.clientX - rect.left) + 'px';
        ripple.style.top = (e.clientY - rect.top) + 'px';
        btn.appendChild(ripple);
        window.setTimeout(function () {
          if (ripple.parentNode) ripple.parentNode.removeChild(ripple);
        }, 640);
      });

      btn.addEventListener('click', function () {
        if (busy) return;
        busy = true;
        setState('loading');

        window.setTimeout(function () {
          setState('done');
          count += 1;
          if (badge) {
            badge.textContent = toFa(count);
            bump(badge, 'is-pop');
          }
          if (status) status.textContent = 'پیراهن ابریشمی «نوا» به سبد خرید اضافه شد.';

          window.setTimeout(function () {
            setState('idle');
            busy = false;
            if (status) status.textContent = '';
          }, reduced() ? 500 : 1500);
        }, reduced() ? 140 : 760);
      });
    });
  }());

  /* ------------- 9) tabs ------------- */
  (function initTabs() {
    var tabsRoot = document.getElementById('p99-tabs');
    if (!tabsRoot) return;

    var nav = $('.tabs__nav', tabsRoot);
    var indicator = document.getElementById('p99-tab-indicator');
    var panelsWrap = document.getElementById('p99-tab-panels');
    var tabs = $$('.tabs__tab', nav);
    var panels = tabs.map(function (tab) { return document.getElementById(tab.getAttribute('aria-controls')); });
    var current = 0;

    function place(tab, animate) {
      if (!indicator || !tab || !nav) return;
      var navRect = nav.getBoundingClientRect();
      var rect = tab.getBoundingClientRect();
      if (!animate) indicator.style.transition = 'none';
      indicator.style.width = rect.width + 'px';
      indicator.style.transform =
        'translate3d(' + (rect.left - navRect.left) + 'px,' + (rect.bottom - navRect.top - 2) + 'px,0)';
      if (!animate) {
        void indicator.offsetWidth;
        indicator.style.transition = '';
      }
    }

    function select(i, moveFocus) {
      if (i === current) { if (moveFocus) tabs[i].focus(); return; }

      var outgoing = panels[current];
      var incoming = panels[i];

      tabs.forEach(function (tab, k) {
        var on = k === i;
        tab.classList.toggle('is-active', on);
        tab.setAttribute('aria-selected', on ? 'true' : 'false');
        tab.tabIndex = on ? 0 : -1;
      });
      place(tabs[i], true);
      current = i;
      if (moveFocus) tabs[i].focus();

      if (!outgoing || !incoming || !panelsWrap) return;

      if (reduced()) {
        outgoing.hidden = true;
        outgoing.classList.remove('is-active');
        incoming.hidden = false;
        incoming.classList.add('is-active');
        return;
      }

      var from = panelsWrap.getBoundingClientRect().height;
      panelsWrap.style.height = from + 'px';
      panelsWrap.classList.add('is-animating');

      outgoing.classList.add('is-leaving');   /* leaves the flow first… */
      outgoing.classList.remove('is-active');
      incoming.hidden = false;                /* …so this height is the new one */
      void panelsWrap.offsetHeight;
      var to = incoming.getBoundingClientRect().height;
      incoming.classList.add('is-active');
      panelsWrap.style.height = to + 'px';

      var settled = false;
      function done() {
        if (settled) return;
        settled = true;
        panelsWrap.style.height = '';
        panelsWrap.classList.remove('is-animating');
        outgoing.classList.remove('is-leaving');
        outgoing.hidden = true;
      }
      panelsWrap.addEventListener('transitionend', function onEnd(e) {
        if (e.target !== panelsWrap || e.propertyName !== 'height') return;
        panelsWrap.removeEventListener('transitionend', onEnd);
        done();
      });
      window.setTimeout(done, 480); /* guard when the height does not change */
    }

    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { select(i, false); });
    });

    nav.addEventListener('keydown', function (e) {
      var i = current;
      if (e.key === 'ArrowLeft') i = (current + 1) % tabs.length;          /* RTL */
      else if (e.key === 'ArrowRight') i = (current - 1 + tabs.length) % tabs.length;
      else if (e.key === 'Home') i = 0;
      else if (e.key === 'End') i = tabs.length - 1;
      else return;
      e.preventDefault();
      select(i, true);
    });

    var jump = $('[data-goto-reviews]');
    if (jump) {
      jump.addEventListener('click', function (e) {
        e.preventDefault();
        var i = tabs.indexOf(document.getElementById('tab-reviews'));
        if (i > -1) select(i, false);
      });
    }

    place(tabs[0], false);
    var queued = false;
    window.addEventListener('resize', function () {
      if (queued) return;
      queued = true;
      raf(function () { queued = false; place(tabs[current], false); });
    }, { passive: true });
  }());

  /* ------------- 10) sticky purchase bar (mobile) ------------- */
  (function initSticky() {
    var bar = document.getElementById('p99-sticky');
    var cta = document.getElementById('p99-add');
    if (!bar || !cta) return;

    /* Reserve space for an existing theme bottom toolbar (WoodMart) so the bar
       can never sit on top of it. Bail out entirely if that is not safe. */
    var reserved = 0;
    var toolbar = document.querySelector('.woodmart-toolbar, .wd-toolbar, .mobile-toolbar, [data-woodmart-toolbar]');
    if (toolbar) {
      var toolbarHeight = toolbar.getBoundingClientRect().height;
      if (toolbarHeight > 96) { bar.parentNode.removeChild(bar); return; }
      reserved = toolbarHeight > 0 ? Math.ceil(toolbarHeight) : 0;
    }
    root.style.setProperty('--p99-toolbar-h', reserved + 'px');

    var topBtn = document.getElementById('p99-top');
    if (topBtn) topBtn.style.setProperty('--p99-lift', '0px');

    var visible = false;
    function show(on) {
      var next = on && mobileMQ.matches;
      if (next === visible) return;
      visible = next;
      bar.classList.toggle('is-visible', next);
      bar.setAttribute('aria-hidden', next ? 'false' : 'true');
      root.classList.toggle('is-sticky-on', next);
      if (topBtn) topBtn.style.setProperty('--p99-lift', next ? '78px' : '0px');
    }

    watchPast(cta, show);

    if (mobileMQ.addEventListener) {
      mobileMQ.addEventListener('change', function () { if (!mobileMQ.matches) show(false); });
    }
  }());

  /* ------------- 11) back to top ------------- */
  (function initTop() {
    var btn = document.getElementById('p99-top');
    /* A 1px sentinel can jump straight past the viewport without ever reporting a
       crossing, so trigger on the tall gallery block instead. */
    var anchor = document.getElementById('p99-frame') || document.getElementById('p99-sentinel');
    if (!btn || !anchor) return;

    var visible = false;
    function show(on) {
      if (on === visible) return;
      visible = on;
      btn.classList.toggle('is-visible', on);
    }

    watchPast(anchor, show);

    btn.addEventListener('click', function () {
      bump(btn, 'is-pressed');
      window.scrollTo({ top: 0, behavior: reduced() ? 'auto' : 'smooth' });
      window.setTimeout(function () { btn.classList.remove('is-pressed'); }, 300);
    });
  }());

  /* ------------- 12) misc ------------- */
  (function initMisc() {
    /* animated price emphasis once the page is ready */
    var priceEl = $('[data-price-value]');
    var priceBox = document.getElementById('p99-price');
    if (priceEl) {
      var target = parseInt(priceEl.getAttribute('data-price-value'), 10) || 0;
      var started = false;

      var run = function () {
        if (started) return;
        started = true;
        if (reduced()) { priceEl.textContent = groupFa(target); return; }
        if (priceBox) priceBox.classList.add('is-emphasis');

        var t0 = null, duration = 850;
        var step = function (ts) {
          if (t0 === null) t0 = ts;
          var p = Math.min(1, (ts - t0) / duration);
          var eased = 1 - Math.pow(1 - p, 3);
          priceEl.textContent = groupFa(Math.round(target * eased));
          if (p < 1) raf(step);
          else priceEl.textContent = groupFa(target);
        };
        raf(step);
      };

      document.addEventListener('p99:ready', run, { once: true });
      window.setTimeout(run, 2200); /* fallback if the event already fired */
    }

    /* tiny animated feedback on the wishlist buttons */
    $$('[data-wish]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        btn.classList.toggle('is-on');
        bump(btn, 'is-pop');
      });
    });
  }());
}());
