import { el, makeContext, contextValue, reference, stateCell, uniqueId, portal, afterRender, callback } from './dom.js';
import { Slot } from './slot.js';
import { focusScope } from './overlay.js';
const Context = makeContext(null);
function containsDescription(value) {
  if (Array.isArray(value)) return value.some(containsDescription);
  return Boolean(value && typeof value === 'object' && (value.type === Description || containsDescription(value.props?.children)));
}
export function Root({ open: controlled, defaultOpen = false, onOpenChange, children }) {
  const [local, setLocal] = stateCell(defaultOpen);
  const open = controlled ?? local;
  const trigger = reference(null);
  const id = uniqueId();
  const change = callback(value => { setLocal(value); onOpenChange?.(value); }, [onOpenChange]);
  return el(Context.Provider, { value: { open, change, trigger, titleId: id + '-title', descriptionId: id + '-description' } }, children);
}
export function Portal({ children }) { return contextValue(Context)?.open ? portal(children) : null; }
export function Overlay({ onClick, ...props }) {
  const ctx = contextValue(Context);
  return ctx.open ? el('div', { ...props, 'data-state': 'open', 'aria-hidden': 'true', onClick: e => { onClick?.(e); if (e.target === e.currentTarget) ctx.change(false); } }) : null;
}
export function Content({ children, ...props }) {
  const ctx = contextValue(Context);
  const node = reference(null);
  const closeRef = reference(); closeRef.current = () => ctx.change(false);
  afterRender(() => ctx.open ? focusScope(node.current, () => closeRef.current(), { modal: true, trigger: ctx.trigger }) : undefined, [ctx.open]);
  if (!ctx.open) return null;
  return el('section', { role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': props['aria-label'] ? undefined : ctx.titleId, 'aria-describedby': containsDescription(children) ? ctx.descriptionId : undefined, tabIndex: -1, 'data-state': 'open', ...props, ref: node }, children);
}
export function Title(props) { return el('h2', { ...props, id: contextValue(Context).titleId }); }
export function Description(props) { return el('p', { ...props, id: contextValue(Context).descriptionId }); }
export function Close({ asChild, ...props }) {
  const ctx = contextValue(Context);
  return el(asChild ? Slot : 'button', { type: 'button', ...props, onClick: e => { props.onClick?.(e); ctx.change(false); } });
}
