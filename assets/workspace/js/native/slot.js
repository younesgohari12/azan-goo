import { clone, Children } from './dom.js';
const putRef = (ref, node) => { if (typeof ref === 'function') ref(node); else if (ref) ref.current = node; };
/** Decorate an existing control without adding a layout wrapper. */
export function Slot({ children, ...props }) {
  const child = Children.only(children);
  if (!child?.type) return child;
  const merged = { ...props, ...child.props };
  for (const key of Object.keys(props)) {
    if (/^on[A-Z]/.test(key) && child.props[key]) merged[key] = event => { child.props[key](event); if (!event.defaultPrevented) props[key](event); };
  }
  if (props.className) merged.className = [props.className, child.props.className].filter(Boolean).join(' ');
  if (props.style) merged.style = { ...props.style, ...child.props.style };
  if (props.ref && child.props.ref) {
    merged.ref = node => { putRef(props.ref, node); putRef(child.props.ref, node); };
  } else merged.ref = props.ref || child.props.ref;
  return clone(child, merged);
}
