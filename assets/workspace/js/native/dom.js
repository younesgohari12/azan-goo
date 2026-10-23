/**
 * Native DOM templates and state cells. No framework or build step at runtime.
 * Comment-delimited ranges keep component DOM (especially iframes and inputs)
 * stable across updates. Every mounted component owns its state and cleanups.
 */
export const Fragment = Symbol('fragment');
const TEXT = Symbol('text');
const EMPTY = Symbol('empty');
const PORTAL = Symbol('portal');
const SVG = 'http://www.w3.org/2000/svg';
let active = null;
let nextId = 0;
const unitless = new Set(['opacity', 'zIndex', 'fontWeight', 'lineHeight', 'flex', 'flexGrow', 'flexShrink', 'order', 'scale', 'strokeWidth', 'gridRow', 'gridColumn']);

export function el(type, props, ...children) {
  const p = { ...(props || {}) };
  if (children.length) p.children = children.length === 1 ? children[0] : children;
  return { type, props: p, key: p.key ?? null };
}
export function clone(node, props = {}) {
  return el(node.type, { ...node.props, ...props });
}
export const withRef = fn => props => fn(props, props.ref);
export const memo = fn => fn;
export const portal = (children, target = document.body) => el(PORTAL, { children, target });
export const Children = { only: c => Array.isArray(c) ? c.filter(Boolean)[0] : c, toArray: c => [c].flat(Infinity).filter(c => c != null && typeof c !== 'boolean') };

function normal(value) {
  if (Array.isArray(value)) return el(Fragment, { children: value });
  if (value == null || typeof value === 'boolean') return el(EMPTY);
  if (typeof value === 'string' || typeof value === 'number') return el(TEXT, { value: String(value) });
  return value;
}
const setRef = (ref, node) => { if (typeof ref === 'function') ref(node); else if (ref) ref.current = node; };
const sameDeps = (a, b) => a && b && a.length === b.length && a.every((v, i) => Object.is(v, b[i]));

export function stateCell(initial) {
  const owner = active;
  const i = owner.cursor++;
  if (!owner.hooks[i]) {
    const cell = { value: typeof initial === 'function' ? initial() : initial };
    cell.set = value => {
      if (owner.disposed) return;
      const next = typeof value === 'function' ? value(cell.value) : value;
      if (Object.is(cell.value, next)) return;
      cell.value = next;
      owner.root.schedule();
    };
    owner.hooks[i] = cell;
  }
  const cell = owner.hooks[i];
  return [cell.value, cell.set];
}
export function reducerCell(reducer, initial, init) {
  const [value, set] = stateCell(() => init ? init(initial) : initial);
  const ref = reference();
  ref.current = reducer;
  const dispatch = memoValue(() => action => set(value => ref.current(value, action)), []);
  return [value, dispatch];
}
export function reference(initial) {
  const i = active.cursor++;
  return active.hooks[i] || (active.hooks[i] = { current: initial });
}
export function memoValue(fn, deps) {
  const i = active.cursor++;
  const old = active.hooks[i];
  if (old && sameDeps(old.deps, deps)) return old.value;
  const value = fn();
  active.hooks[i] = { value, deps };
  return value;
}
export const callback = (fn, deps) => memoValue(() => fn, deps);
export function afterRender(fn, deps) {
  const owner = active;
  const i = owner.cursor++;
  const cell = owner.hooks[i] || (owner.hooks[i] = {});
  if (sameDeps(cell.deps, deps)) return;
  cell.deps = deps;
  cell.next = fn;
  if (cell.pending) return;
  cell.pending = true;
  owner.root.effects.push(() => {
    cell.pending = false;
    if (owner.disposed) return;
    cell.cleanup?.();
    cell.cleanup = cell.next();
  });
}
export const beforePaint = afterRender;
export function makeContext(fallback) {
  const key = Symbol('context');
  function Provider({ children }) { return children; }
  Provider.contextKey = key;
  return { key, fallback, Provider };
}
export const contextValue = ctx => active.context.has(ctx.key) ? active.context.get(ctx.key) : ctx.fallback;
export const uniqueId = () => memoValue(() => `y-dom-${++nextId}`, []);

function eventName(key, node) {
  let name = key.slice(2);
  let capture = false;
  if (name.endsWith('Capture')) { name = name.slice(0, -7); capture = true; }
  if (name === 'Change' && /^(INPUT|TEXTAREA|SELECT)$/.test(node.tagName)) name = node.type === 'file' || node.type === 'checkbox' || node.tagName === 'SELECT' ? 'change' : 'input';
  else if (name === 'DoubleClick') name = 'dblclick';
  else name = name.toLowerCase();
  return [name, capture];
}
function property(node, key, value, old) {
  if (['children', 'key', 'ref', 'node'].includes(key)) return;
  if (key.startsWith('on') && key[2] === key[2]?.toUpperCase()) {
    const events = node.__events || (node.__events = {});
    if (!value) {
      if (events[key]) node.removeEventListener(events[key].name, events[key].listener, events[key].capture);
      delete events[key];
    } else if (events[key]) events[key].handler = value;
    else {
      const [name, capture] = eventName(key, node);
      const entry = { name, capture, handler: value };
      entry.listener = event => {
        if (!event.nativeEvent) Object.defineProperty(event, 'nativeEvent', { value: event });
        entry.handler(event);
      };
      events[key] = entry;
      node.addEventListener(name, entry.listener, capture);
    }
    return;
  }
  if (key === 'style') {
    if (typeof value === 'string') { node.style.cssText = value; return; }
    if (typeof old === 'string') node.style.cssText = '';
    for (const name of Object.keys(old || {})) if (!(name in (value || {}))) node.style.removeProperty(name.replace(/[A-Z]/g, c => '-' + c.toLowerCase()));
    for (const [name, val] of Object.entries(value || {})) {
      if (old && typeof old === 'object' && Object.is(old[name], val)) continue;
      const cssName = name.startsWith('--') ? name : name.replace(/[A-Z]/g, c => '-' + c.toLowerCase());
      node.style.setProperty(cssName, val == null ? '' : typeof val === 'number' && val !== 0 && !unitless.has(name) && !name.startsWith('--') ? `${val}px` : String(val));
    }
    return;
  }
  if (key === 'dangerouslySetInnerHTML') {
    const html = value?.__html || '';
    if (node.innerHTML !== html) node.innerHTML = html;
    return;
  }
  if (key === 'className') key = 'class';
  if (key === 'htmlFor') key = 'for';
  if (key === 'srcDoc') key = 'srcdoc';
  if (key === 'tabIndex') key = 'tabindex';
  if (key === 'autoFocus') { if (value && !old) queueMicrotask(() => node.isConnected && node.focus()); return; }
  if (key === 'value' || key === 'checked') {
    if (value != null && node[key] !== value) node[key] = value;
    return;
  }
  if (key === 'defaultValue') { if (old === undefined) node.defaultValue = value; return; }
  if (key === 'defaultChecked') { if (old === undefined) node.defaultChecked = value; return; }
  if (['disabled', 'multiple', 'selected', 'hidden', 'readOnly', 'required', 'open', 'controls', 'download'].includes(key) && typeof value === 'boolean') {
    if (value) node.setAttribute(key.toLowerCase(), ''); else node.removeAttribute(key.toLowerCase());
    return;
  }
  const attr = node.namespaceURI === SVG && !['viewBox', 'preserveAspectRatio'].includes(key) ? key.replace(/[A-Z]/g, c => '-' + c.toLowerCase()) : key;
  if (value == null || (value === false && !key.startsWith('aria-') && !key.startsWith('data-'))) node.removeAttribute(attr);
  else node.setAttribute(attr, String(value));
}

function dispose(instance, remove = true) {
  if (!instance || instance.disposed) return;
  instance.disposed = true;
  for (const hook of instance.hooks || []) hook?.cleanup?.();
  for (const child of instance.children || []) dispose(child, false);
  if (instance.child) dispose(instance.child, false);
  if (instance.vnode?.props?.ref && typeof instance.vnode.type === 'string') setRef(instance.vnode.props.ref, null);
  if (instance.portalChild) dispose(instance.portalChild);
  if (remove) {
    let node = instance.first;
    while (node) {
      const next = node.nextSibling;
      node.remove();
      if (node === instance.last) break;
      node = next;
    }
  }
}
function move(instance, parent, before) {
  if (instance.first === before) return;
  const nodes = [];
  for (let node = instance.first; node; node = node.nextSibling) { nodes.push(node); if (node === instance.last) break; }
  for (const node of nodes) parent.insertBefore(node, before);
}
function children(parent, values, old, end, context, root, svg) {
  const list = Array.isArray(values) ? values : [values];
  const previous = old || [];
  const used = new Set();
  const result = list.map((value, index) => {
    const vnode = normal(value);
    let match;
    if (vnode.key != null) match = previous.find(v => !used.has(v) && v.vnode.key === vnode.key && v.vnode.type === vnode.type);
    else if (previous[index]?.vnode.key == null && !used.has(previous[index])) match = previous[index];
    if (match) used.add(match);
    return patch(parent, vnode, match, end, context, root, svg);
  });
  for (const instance of previous) if (!used.has(instance)) dispose(instance);
  let cursor = result.length ? result[0].first : end;
  // Reorder from the end, moving only displaced ranges: an iframe that is
  // already correctly positioned must never be detached and reloaded.
  let before = end;
  for (let i = result.length - 1; i >= 0; i--) {
    const instance = result[i];
    if (instance.last.nextSibling !== before) move(instance, parent, before);
    before = instance.first;
  }
  return result;
}
function patch(parent, vnode, old, before, context, root, svg = false) {
  if (old && (old.vnode.type !== vnode.type || old.vnode.key !== vnode.key)) { dispose(old); old = null; }
  const instance = old || { root, hooks: [], context, disposed: false };
  const previous = instance.vnode?.props || {};
  instance.vnode = vnode;
  instance.context = context;
  const { type, props } = vnode;
  if (type === TEXT || type === EMPTY) {
    if (!old) {
      instance.first = instance.last = type === TEXT ? document.createTextNode(props.value) : document.createComment('');
      parent.insertBefore(instance.first, before);
    } else if (type === TEXT && instance.first.nodeValue !== props.value) instance.first.nodeValue = props.value;
    return instance;
  }
  if (typeof type === 'string') {
    const isSVG = svg || type === 'svg';
    if (!old) {
      instance.first = instance.last = isSVG ? document.createElementNS(SVG, type) : document.createElement(type);
      // Sandboxing must exist before a connected iframe starts its first srcdoc
      // navigation. Adding the attribute afterwards does not sandbox that load.
      if (type === 'iframe' && props.sandbox != null) property(instance.first, 'sandbox', props.sandbox);
      parent.insertBefore(instance.first, before);
    }
    const node = instance.first;
    for (const key of Object.keys(previous)) if (!(key in props)) property(node, key, null, previous[key]);
    for (const key of Object.keys(props)) if (props[key] !== previous[key]) property(node, key, props[key], previous[key]);
    if (!props.dangerouslySetInnerHTML) instance.children = children(node, props.children ?? [], instance.children, null, context, root, isSVG && type !== 'foreignObject');
    if (props.value != null && node.value !== props.value) node.value = props.value;
    if (previous.ref !== props.ref) { setRef(previous.ref, null); setRef(props.ref, node); }
    return instance;
  }
  if (!old) {
    instance.first = document.createComment('y');
    instance.last = document.createComment('/y');
    parent.insertBefore(instance.first, before);
    parent.insertBefore(instance.last, before);
  }
  if (type === PORTAL) {
    instance.portalChild = patch(props.target, normal(props.children), instance.portalChild, null, context, root, false);
  } else if (type === Fragment) {
    instance.children = children(parent, props.children ?? [], instance.children, instance.last, context, root, svg);
  } else if (typeof type === 'function') {
    const saved = active;
    active = instance;
    instance.cursor = 0;
    let output;
    try { output = type(props); } finally { active = saved; }
    let childContext = context;
    if (type.contextKey) { childContext = new Map(context); childContext.set(type.contextKey, props.value); }
    instance.child = patch(parent, normal(output), instance.child, instance.last, childContext, root, svg);
  } else throw new Error('Invalid DOM template type');
  return instance;
}
export function mount(container, template) {
  const root = {
    template, instance: null, effects: [], pending: false,
    schedule() {
      if (this.pending) return;
      this.pending = true;
      queueMicrotask(() => this.render());
    },
    render() {
      this.pending = false;
      this.instance = patch(container, normal(this.template), this.instance, null, new Map(), this);
      const effects = this.effects.splice(0);
      for (const effect of effects) effect();
    },
    unmount() { dispose(this.instance); this.instance = null; this.template = null; }
  };
  root.render();
  return root;
}
