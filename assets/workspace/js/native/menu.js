import { el, makeContext, contextValue, reference, stateCell, uniqueId, portal, afterRender, callback } from './dom.js';
import { Slot } from './slot.js';
import { focusScope } from './overlay.js';
const Context = makeContext(null);
export function Root({ children, dir = 'rtl', open: controlled, onOpenChange }) {
  const [local, set] = stateCell(false);
  const trigger = reference(null);
  const usingKeyboard = reference(false);
  const id = uniqueId();
  const change = callback(value => { set(value); onOpenChange?.(value); }, [onOpenChange]);
  return el(Context.Provider, { value: { open: controlled ?? local, change, trigger, usingKeyboard, id, dir } }, children);
}
export const Sub = Root;
export function Trigger({ asChild, ...props }) {
  const ctx = contextValue(Context);
  return el(asChild ? Slot : 'button', { ...props, ref: ctx.trigger, type: 'button', 'aria-haspopup': 'menu', 'aria-expanded': ctx.open, 'aria-controls': ctx.open ? ctx.id : undefined, 'data-state': ctx.open ? 'open' : 'closed', onClick: e => { e.stopPropagation(); ctx.usingKeyboard.current = false; ctx.change(!ctx.open); }, onKeyDown: e => { if (['ArrowDown', 'Enter', ' '].includes(e.key)) { e.preventDefault(); ctx.usingKeyboard.current = true; ctx.change(true); } } });
}
export function Portal({ children }) { return contextValue(Context).open ? portal(children) : null; }
export function Content({ children, side = 'bottom', align = 'center', sideOffset = 6, collisionPadding = 8, ref: outerRef, ...props }) {
  const ctx = contextValue(Context);
  const node = reference(null);
  const close = reference(); close.current = () => ctx.change(false);
  afterRender(() => {
    if (!ctx.open || !node.current) return;
    const menu = node.current;
    function place() {
      const anchor = ctx.trigger.current?.getBoundingClientRect();
      if (!anchor) return;
      const below = Math.max(0, window.innerHeight - anchor.bottom - sideOffset - collisionPadding);
      const above = Math.max(0, anchor.top - sideOffset - collisionPadding);
      const naturalHeight = menu.scrollHeight + 2;
      let placement = side;
      if (side === 'bottom' && naturalHeight > below && above > below) placement = 'top';
      if (side === 'top' && naturalHeight > above && below > above) placement = 'bottom';
      const maxHeight = placement === 'top' ? above : below;
      menu.style.setProperty('--radix-dropdown-menu-content-available-height', `${maxHeight}px`);
      menu.style.maxHeight = `${maxHeight}px`;
      const r = menu.getBoundingClientRect();
      let x = align === 'center' ? anchor.left + (anchor.width - r.width) / 2 : (align === 'start') === (ctx.dir !== 'rtl') ? anchor.left : anchor.right - r.width;
      let y = placement === 'top' ? anchor.top - r.height - sideOffset : anchor.bottom + sideOffset;
      const round = value => Math.round(value * devicePixelRatio) / devicePixelRatio;
      menu.style.left = `${round(Math.max(collisionPadding, Math.min(x, window.innerWidth - r.width - collisionPadding)))}px`;
      menu.style.top = `${round(Math.max(collisionPadding, Math.min(y, window.innerHeight - r.height - collisionPadding)))}px`;
      menu.style.visibility = 'visible';
    }
    place();
    const stop = focusScope(menu, () => close.current(), { trigger: ctx.trigger, menu: true, initialItem: ctx.usingKeyboard.current });
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(place);
    observer?.observe(menu);
    if (ctx.trigger.current) observer?.observe(ctx.trigger.current);
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => { observer?.disconnect(); stop?.(); window.removeEventListener('resize', place); window.removeEventListener('scroll', place, true); };
  }, [ctx.open, side, align, sideOffset, collisionPadding]);
  if (!ctx.open) return null;
  return el('div', { ...props, ref: node, role: 'menu', id: ctx.id, dir: ctx.dir, tabIndex: -1, 'data-state': 'open', 'aria-orientation': 'vertical', style: { ...props.style, position: 'fixed', width: 'max-content', visibility: 'hidden' } }, children);
}
export function Item({ children, disabled = false, onSelect, onClick, ...props }) {
  const ctx = contextValue(Context);
  function select(event) { if (disabled) return; onClick?.(event); onSelect?.(event); if (!event.defaultPrevented) ctx.change(false); }
  return el('div', { ...props, role: 'menuitem', tabIndex: disabled ? -1 : 0, 'aria-disabled': disabled || undefined, 'data-disabled': disabled ? '' : undefined, onClick: select, onKeyDown: e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(e); ctx.change(false); } }, onMouseEnter: e => { if (!disabled) { e.currentTarget.setAttribute('data-highlighted', ''); e.currentTarget.focus({ preventScroll: true }); } }, onMouseLeave: e => e.currentTarget.removeAttribute('data-highlighted'), onFocus: e => e.currentTarget.setAttribute('data-highlighted', ''), onBlur: e => e.currentTarget.removeAttribute('data-highlighted') }, children);
}
export const Separator = props => el('div', { ...props, role: 'separator' });
