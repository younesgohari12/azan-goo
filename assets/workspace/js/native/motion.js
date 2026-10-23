import { el, reference, afterRender, Fragment, stateCell } from './dom.js';
export const MotionConfig = ({ children }) => children;
const keyframes = (value, node) => {
  const result = {};
  for (const [key, v] of Object.entries(value || {})) {
    if (key === 'y') result.transform = `translateY(${v}px)`;
    else result[key] = key === 'height' && v === 'auto' ? `${node.scrollHeight}px` : typeof v === 'number' && key === 'height' ? `${v}px` : v;
  }
  return result;
};
function animated(tag) {
  return function Animated({ initial, animate, exit, transition = {}, children, ...props }) {
    const node = reference(null);
    afterRender(() => {
      if (!node.current || !initial || initial === false || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const animation = node.current.animate([keyframes(initial, node.current), keyframes(animate, node.current)], { duration: (transition.duration ?? .19) * 1000, delay: (transition.delay || 0) * 1000, easing: Array.isArray(transition.ease) ? `cubic-bezier(${transition.ease.join(',')})` : 'ease', fill: 'backwards' });
      return () => animation.cancel();
    }, []);
    return el(tag, { ...props, ref: node }, children);
  };
}
export const motion = { div: animated('div'), button: animated('button') };
/** Keep exiting panels mounted until their native collapse animation ends. */
export function AnimatePresence({ children }) {
  const nodes = reference(children);
  const host = reference(null);
  const visible = Boolean(children && (!Array.isArray(children) || children.some(Boolean)));
  const previous = reference(visible);
  const [exiting, setExiting] = stateCell(false);
  if (visible) nodes.current = children;
  afterRender(() => {
    if (visible) { setExiting(false); return; }
    if (!previous.current || !host.current) return;
    setExiting(true);
    const target = host.current.firstElementChild;
    const time = (nodes.current?.props?.transition?.duration ?? .19) * 1000;
    const animation = target?.animate([{ height: `${target.scrollHeight}px`, opacity: 1 }, { height: '0px', opacity: 0 }], { duration: matchMedia('(prefers-reduced-motion: reduce)').matches ? 1 : time, easing: 'cubic-bezier(.22,.61,.36,1)' });
    const timer = setTimeout(() => { previous.current = false; setExiting(false); }, time);
    return () => { clearTimeout(timer); animation?.cancel(); };
  }, [visible]);
  if (visible) previous.current = true;
  return el('div', { ref: host, style: { display: 'contents' } }, visible ? children : previous.current || exiting ? nodes.current : null);
}
