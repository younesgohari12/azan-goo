import { el, makeContext, contextValue, reference, stateCell, uniqueId, portal, afterRender } from './dom.js';
import { Slot } from './slot.js';
const Context = makeContext(null);
export const Provider = ({ children }) => children;
export function Root({ children }) {
  const [open, set] = stateCell(false);
  const trigger = reference(null);
  const timer = reference();
  const id = uniqueId();
  afterRender(() => () => clearTimeout(timer.current), []);
  const show = () => { clearTimeout(timer.current); timer.current = setTimeout(() => set(true), 280); };
  const hide = () => { clearTimeout(timer.current); set(false); };
  return el(Context.Provider, { value: { open, show, hide, trigger, id } }, children);
}
export function Trigger({ asChild, ...props }) {
  const ctx = contextValue(Context);
  return el(asChild ? Slot : 'button', { ...props, ref: ctx.trigger, 'aria-describedby': ctx.open ? ctx.id : undefined, onMouseEnter: ctx.show, onMouseLeave: ctx.hide, onFocus: ctx.show, onBlur: ctx.hide, onPointerDown: ctx.hide });
}
export function Portal({ children }) { return contextValue(Context).open ? portal(children) : null; }
export function Content({ children, side = 'bottom', sideOffset = 8, ...props }) {
  const ctx = contextValue(Context);
  const node = reference(null);
  afterRender(() => {
    if (!ctx.open || !node.current) return;
    const n = node.current;
    const t = ctx.trigger.current?.getBoundingClientRect();
    if (!t) return;
    const r = n.getBoundingClientRect();
    const x = side === 'left' ? t.left - r.width - sideOffset : side === 'right' ? t.right + sideOffset : t.left + (t.width - r.width) / 2;
    const y = side === 'top' ? t.top - r.height - sideOffset : side === 'bottom' ? t.bottom + sideOffset : t.top + (t.height - r.height) / 2;
    n.style.left = `${Math.max(8, Math.min(x, innerWidth - r.width - 8))}px`;
    n.style.top = `${Math.max(8, Math.min(y, innerHeight - r.height - 8))}px`;
    n.style.visibility = 'visible';
    const hide = e => { if (e.key === 'Escape') ctx.hide(); };
    document.addEventListener('keydown', hide);
    return () => document.removeEventListener('keydown', hide);
  }, [ctx.open, side, sideOffset]);
  return ctx.open ? el('div', { ...props, ref: node, role: 'tooltip', id: ctx.id, 'data-state': 'delayed-open', style: { position: 'fixed', visibility: 'hidden', pointerEvents: 'none' } }, children) : null;
}
