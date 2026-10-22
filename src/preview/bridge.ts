/**
 * Message bridge between the YAgent shell and the previewed page.
 *
 * The preview HTML runs inside an isolated `<iframe sandbox="allow-scripts">`,
 * so it is a different origin by design: the shell never reads
 * `contentDocument`, and never reaches into the page's DOM. Everything travels
 * through `postMessage` in both directions — the same contract works for a
 * same-origin WordPress page, a sandboxed preview document and, later, a page
 * served from the customer's site.
 *
 * Injected runtime responsibilities (inside the iframe):
 * - report readiness, page title, `data-yagent-id` list and document height
 * - draw pins / regions for the annotations the shell sends
 * - in annotate mode, capture a tap (pin) and a drag (region) — mouse, pen and
 *   touch alike, through Pointer Events with capture and cancellation
 */

export const HOST_SOURCE = 'yagent-host'
export const PREVIEW_SOURCE = 'yagent-preview'

export type PreviewMode = 'browse' | 'annotate'

export interface BridgeRect {
  x: number
  y: number
  width: number
  height: number
}

export interface BridgeAnnotationDraft {
  kind: 'pin' | 'region'
  rect: BridgeRect
  elementId?: string
  elementLabel?: string
}

export interface BridgeAnnotation {
  id: string
  index: number
  kind: 'pin' | 'region'
  rect: BridgeRect
  comment: string
  status: 'draft' | 'sent' | 'stale' | 'unmatched' | 'resolved'
  selected?: boolean
}

export interface PreviewReadyPayload {
  title: string
  elementIds: string[]
  width: number
  height: number
}

export type HostMessage =
  | { source: typeof HOST_SOURCE; type: 'hello' }
  | { source: typeof HOST_SOURCE; type: 'mode'; mode: PreviewMode }
  | { source: typeof HOST_SOURCE; type: 'sync'; annotations: BridgeAnnotation[] }
  | { source: typeof HOST_SOURCE; type: 'select'; annotationId?: string }

export type PreviewMessage =
  | { source: typeof PREVIEW_SOURCE; type: 'ready'; payload: PreviewReadyPayload }
  | { source: typeof PREVIEW_SOURCE; type: 'resize'; payload: { height: number } }
  | { source: typeof PREVIEW_SOURCE; type: 'created'; payload: BridgeAnnotationDraft }
  | { source: typeof PREVIEW_SOURCE; type: 'annotation:click'; payload: { annotationId: string } }
  | { source: typeof PREVIEW_SOURCE; type: 'annotation:cancelled'; payload: null }

export function isPreviewMessage(value: unknown): value is PreviewMessage {
  if (!value || typeof value !== 'object') return false
  return (value as { source?: string }).source === PREVIEW_SOURCE
}

/**
 * The runtime injected into the preview document. Kept as a plain ES5 string on
 * purpose: it must run inside the sandboxed page without any module loader, and
 * without being bundled with the shell's code.
 */
export const PREVIEW_BRIDGE_SCRIPT = `(function () {
  'use strict';
  var PREVIEW_SOURCE = 'yagent-preview';
  var HOST_SOURCE = 'yagent-host';
  var DRAG_THRESHOLD = 7;
  var state = { mode: 'browse', annotations: [], selectedId: null };
  var layer = null;
  var gesture = null;
  var size = { width: 0, height: 0 };
  var origin = { x: 0, y: 0 };
  var lastHeight = 0;
  var stylesInjected = false;

  function send(type, payload) {
    try {
      parent.postMessage({ source: PREVIEW_SOURCE, type: type, payload: payload || null }, '*');
    } catch (error) {
      /* the host is gone; nothing else to do */
    }
  }

  function measure() {
    var body = document.body || document.documentElement;
    size.width = Math.max(body.scrollWidth, document.documentElement.scrollWidth, window.innerWidth);
    size.height = Math.max(body.scrollHeight, document.documentElement.scrollHeight, window.innerHeight);
    return size;
  }

  function injectStyles() {
    if (stylesInjected) return;
    var style = document.createElement('style');
    style.textContent = [
      '#yagent-layer{position:absolute;top:0;left:0;z-index:2147483000;pointer-events:none}',
      '.yagent-an{position:absolute;pointer-events:auto;box-sizing:border-box;cursor:pointer}',
      '.yagent-an--region{border:1.5px solid rgba(139,124,246,.85);border-radius:10px;background:rgba(139,124,246,.10)}',
      '.yagent-an--pin{width:28px;height:28px;margin:-14px 0 0 -14px;border-radius:50%;background:#8b7cf6;color:#fff;',
      'font:600 12px/28px Vazirmatn,system-ui,sans-serif;text-align:center;box-shadow:0 4px 14px rgba(0,0,0,.35)}',
      '.yagent-an__index{position:absolute;left:-11px;top:-11px;width:22px;height:22px;border-radius:50%;background:#8b7cf6;',
      'color:#fff;font:600 11px/22px Vazirmatn,system-ui,sans-serif;text-align:center;box-shadow:0 3px 10px rgba(0,0,0,.35)}',
      '.yagent-an--selected{border-color:#34d399;background:rgba(52,211,153,.12)}',
      '.yagent-an--selected .yagent-an__index,.yagent-an--pin.yagent-an--selected{background:#34d399}',
      '.yagent-an--stale{opacity:.72;border-style:dashed}',
      '#yagent-draw{position:absolute;border:1.5px dashed #8b7cf6;background:rgba(139,124,246,.12);',
      'border-radius:8px;pointer-events:none}',
      'body.yagent-annotating,body.yagent-annotating *{cursor:crosshair !important}',
      /* While marking, the page itself must not scroll — the gesture is the drawing.
         In browse mode nothing here applies and the page scrolls normally. */
      'html.yagent-annotating,body.yagent-annotating{touch-action:none !important;overscroll-behavior:none}'
    ].join('');
    (document.head || document.documentElement).appendChild(style);
    stylesInjected = true;
  }

  function ensureLayer() {
    if (layer && layer.parentNode) return layer;
    injectStyles();
    layer = document.createElement('div');
    layer.id = 'yagent-layer';
    (document.body || document.documentElement).appendChild(layer);
    return layer;
  }

  function layout() {
    ensureLayer();
    measure();
    layer.style.width = size.width + 'px';
    layer.style.height = size.height + 'px';
    var rect = layer.getBoundingClientRect();
    origin.x = rect.left + window.scrollX;
    origin.y = rect.top + window.scrollY;
  }

  function px(value, total) { return Math.round(value * total); }

  function render() {
    var host = ensureLayer();
    host.innerHTML = '';
    layout();
    state.annotations.forEach(function (annotation) {
      var node = document.createElement('div');
      var kind = annotation.kind === 'pin' ? 'pin' : 'region';
      var classes = 'yagent-an yagent-an--' + kind;
      if (annotation.status === 'stale' || annotation.status === 'unmatched') classes += ' yagent-an--stale';
      if (annotation.id === state.selectedId) classes += ' yagent-an--selected';
      node.className = classes;
      node.setAttribute('data-yagent-id-annotation', annotation.id);
      node.setAttribute('title', annotation.comment || '');
      node.style.left = (px(annotation.rect.x, size.width) - origin.x) + 'px';
      node.style.top = (px(annotation.rect.y, size.height) - origin.y) + 'px';
      if (kind === 'pin') {
        node.textContent = String(annotation.index);
      } else {
        node.style.width = Math.max(24, px(annotation.rect.width, size.width)) + 'px';
        node.style.height = Math.max(24, px(annotation.rect.height, size.height)) + 'px';
        var badge = document.createElement('span');
        badge.className = 'yagent-an__index';
        badge.textContent = String(annotation.index);
        node.appendChild(badge);
      }
      node.addEventListener('click', function (event) {
        event.preventDefault();
        event.stopPropagation();
        var id = node.getAttribute('data-yagent-id-annotation');
        state.selectedId = id;
        send('annotation:click', { annotationId: id });
        render();
      });
      host.appendChild(node);
    });
  }

  function normalize(clientX, clientY) {
    var docX = clientX + window.scrollX - origin.x;
    var docY = clientY + window.scrollY - origin.y;
    return {
      x: Math.min(1, Math.max(0, docX / (size.width || 1))),
      y: Math.min(1, Math.max(0, docY / (size.height || 1)))
    };
  }

  function elementInfo(clientX, clientY) {
    var element = document.elementFromPoint(clientX, clientY);
    if (!element) return {};
    var holder = element.closest ? element.closest('[data-yagent-id]') : null;
    var target = holder || element;
    var label = (target.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 70);
    return {
      elementId: target.getAttribute ? (target.getAttribute('data-yagent-id') || undefined) : undefined,
      elementLabel: label || (target.tagName || '').toLowerCase()
    };
  }

  function isPrimary(event) {
    if (event.pointerType === 'mouse' && event.button !== 0) return false;
    return true;
  }

  function clearDragNode() {
    if (gesture && gesture.node && gesture.node.parentNode) gesture.node.parentNode.removeChild(gesture.node);
    var stray = document.getElementById('yagent-draw');
    if (stray && stray.parentNode) stray.parentNode.removeChild(stray);
  }

  function cancelGesture(notify) {
    if (!gesture) return;
    var captured = gesture;
    gesture = null;
    clearDragNode();
    if (captured.pointerId !== undefined && document.documentElement.releasePointerCapture) {
      try { document.documentElement.releasePointerCapture(captured.pointerId); } catch (error) {}
    }
    if (notify) send('annotation:cancelled', null);
  }

  function onPointerDown(event) {
    if (state.mode !== 'annotate' || gesture || !isPrimary(event)) return;
    layout();
    gesture = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      start: normalize(event.clientX, event.clientY),
      node: null,
      info: elementInfo(event.clientX, event.clientY)
    };
    /* Capture on the root element: the gesture keeps tracking when the finger
       leaves the original target, and we still get pointerup/pointercancel. */
    if (document.documentElement.setPointerCapture && event.pointerId !== undefined) {
      try { document.documentElement.setPointerCapture(event.pointerId); } catch (error) {}
    }
    if (event.cancelable) event.preventDefault();
    event.stopPropagation();
  }

  function onPointerMove(event) {
    if (!gesture || event.pointerId !== gesture.pointerId || state.mode !== 'annotate') return;
    var dx = Math.abs(event.clientX - gesture.startX);
    var dy = Math.abs(event.clientY - gesture.startY);
    if (!gesture.node && dx + dy > DRAG_THRESHOLD) {
      gesture.node = document.createElement('div');
      gesture.node.id = 'yagent-draw';
      ensureLayer().appendChild(gesture.node);
    }
    if (!gesture.node) return;
    gesture.node.style.left = (Math.min(gesture.startX, event.clientX) + window.scrollX - origin.x) + 'px';
    gesture.node.style.top = (Math.min(gesture.startY, event.clientY) + window.scrollY - origin.y) + 'px';
    gesture.node.style.width = dx + 'px';
    gesture.node.style.height = dy + 'px';
    if (event.cancelable) event.preventDefault();
  }

  function onPointerUp(event) {
    if (!gesture || event.pointerId !== gesture.pointerId) return;
    var ended = gesture;
    var end = normalize(event.clientX, event.clientY);
    var dragged = Boolean(ended.node);
    gesture = null;
    clearDragNode();
    if (document.documentElement.releasePointerCapture && event.pointerId !== undefined) {
      try { document.documentElement.releasePointerCapture(event.pointerId); } catch (error) {}
    }
    if (state.mode !== 'annotate') return;
    if (event.cancelable) event.preventDefault();
    event.stopPropagation();

    var width = Math.abs(end.x - ended.start.x);
    var height = Math.abs(end.y - ended.start.y);
    if (dragged && (width > 0.004 || height > 0.004)) {
      send('created', {
        kind: 'region',
        rect: {
          x: Math.min(ended.start.x, end.x),
          y: Math.min(ended.start.y, end.y),
          width: width,
          height: height
        },
        elementId: ended.info && ended.info.elementId,
        elementLabel: ended.info && ended.info.elementLabel
      });
      return;
    }
    send('created', {
      kind: 'pin',
      rect: { x: ended.start.x, y: ended.start.y, width: 0, height: 0 },
      elementId: ended.info && ended.info.elementId,
      elementLabel: ended.info && ended.info.elementLabel
    });
  }

  function onClickCapture(event) {
    if (state.mode !== 'annotate') return;
    event.preventDefault();
    event.stopPropagation();
  }

  function onKeyDown(event) {
    if (event.key !== 'Escape' || state.mode !== 'annotate') return;
    cancelGesture(true);
  }

  function setMode(mode) {
    state.mode = mode === 'annotate' ? 'annotate' : 'browse';
    var annotating = state.mode === 'annotate';
    if (document.body) {
      document.body.classList[annotating ? 'add' : 'remove']('yagent-annotating');
    }
    if (document.documentElement) {
      document.documentElement.classList[annotating ? 'add' : 'remove']('yagent-annotating');
    }
    if (!annotating) cancelGesture(false);
  }

  function syncAnnotations(annotations) {
    state.annotations = Array.isArray(annotations) ? annotations : [];
    render();
  }

  function selectAnnotation(annotationId) {
    state.selectedId = annotationId || null;
    render();
    if (!annotationId || !layer) return;
    var node = layer.querySelector('[data-yagent-id-annotation="' + annotationId + '"]');
    if (node && node.scrollIntoView) {
      try { node.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (error) { node.scrollIntoView(); }
    }
  }

  function announce() {
    measure();
    var ids = [];
    var nodes = document.querySelectorAll('[data-yagent-id]');
    for (var index = 0; index < nodes.length; index += 1) {
      var value = nodes[index].getAttribute('data-yagent-id');
      if (value && ids.indexOf(value) === -1) ids.push(value);
    }
    lastHeight = size.height;
    send('ready', {
      title: document.title || '',
      elementIds: ids,
      width: size.width,
      height: size.height
    });
  }

  function reportSize() {
    measure();
    if (layer) layout();
    if (Math.abs(size.height - lastHeight) > 2) {
      lastHeight = size.height;
      send('resize', { height: size.height });
    }
  }

  window.addEventListener('message', function (event) {
    var data = event.data;
    if (!data || data.source !== HOST_SOURCE) return;
    if (data.type === 'hello') announce();
    else if (data.type === 'mode') setMode(data.mode);
    else if (data.type === 'sync') syncAnnotations(data.annotations);
    else if (data.type === 'select') selectAnnotation(data.annotationId);
  });

  document.addEventListener('pointerdown', onPointerDown, true);
  document.addEventListener('pointermove', onPointerMove, true);
  document.addEventListener('pointerup', onPointerUp, true);
  document.addEventListener('pointercancel', function () { cancelGesture(false); }, true);
  document.addEventListener('lostpointercapture', function (event) {
    if (gesture && gesture.pointerId === event.pointerId) cancelGesture(false);
  }, true);
  document.addEventListener('click', onClickCapture, true);
  document.addEventListener('keydown', onKeyDown, true);
  window.addEventListener('resize', reportSize);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', announce);
  } else {
    announce();
  }
  window.setTimeout(reportSize, 400);
  window.setTimeout(reportSize, 1500);
})();`
