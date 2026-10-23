/** Shared keyboard behavior for native dialogs, dropdowns and tooltips. */
const stack = [];
let locks = 0;
let previousOverflow = '';
export const tabbables = node => [...node.querySelectorAll('button:not(:disabled), [href], input:not(:disabled), textarea:not(:disabled), select:not(:disabled), [tabindex]:not([tabindex="-1"])')].filter(el => el.getClientRects().length && el.getAttribute('aria-disabled') !== 'true');
export function focusScope(node, close, { modal = false, trigger, menu = false, initialItem = true } = {}) {
  if (!node) return;
  const previous = trigger?.current || document.activeElement;
  let search = '';
  let searchTimer;
  const entry = {};
  stack.push(entry);
  let inertBefore;
  const root = document.getElementById('root');
  if (modal) {
    if (locks++ === 0) { previousOverflow = document.body.style.overflow; document.body.style.overflow = 'hidden'; }
    if (root) { inertBefore = root.inert; root.inert = true; }
  }
  queueMicrotask(() => { if (node.isConnected) (menu ? initialItem ? node.querySelector('[role="menuitem"]:not([aria-disabled="true"])') || node : node : tabbables(node)[0] || node)?.focus({ preventScroll: true }); });
  function keydown(event) {
    if (stack.at(-1) !== entry) return;
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(); return; }
    if (menu && ['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      const items = [...node.querySelectorAll('[role="menuitem"]:not([aria-disabled="true"])')];
      const i = items.indexOf(document.activeElement);
      const index = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : (i + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
      items[index]?.focus();
    }
    if (menu && event.key.length === 1 && !event.ctrlKey && !event.altKey && !event.metaKey && !event.isComposing) {
      // Match Radix's one-second typeahead, including cycling repeated letters.
      // Space still activates a focused item when no typeahead is in progress.
      if (event.key === ' ' && !search) return;
      if (event.key === ' ') { event.preventDefault(); event.stopPropagation(); }
      search += event.key.toLocaleLowerCase();
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => { search = ''; }, 1000);
      const term = [...search].every(c => c === search[0]) ? search[0] : search;
      const items = [...node.querySelectorAll('[role="menuitem"]:not([aria-disabled="true"])')];
      const current = items.indexOf(document.activeElement);
      const candidates = [...items.slice(current + 1), ...items.slice(0, current + 1)];
      const match = candidates.find(item => (item.textContent || '').trim().toLocaleLowerCase().startsWith(term));
      if (match) { event.preventDefault(); match.focus({ preventScroll: true }); }
    }
    if (event.key === 'Tab') {
      if (menu) { close(); return; }
      if (!modal) return;
      const items = tabbables(node);
      if (!items.length) { event.preventDefault(); node.focus(); return; }
      if (event.shiftKey && (document.activeElement === items[0] || !node.contains(document.activeElement))) { event.preventDefault(); items.at(-1).focus(); }
      else if (!event.shiftKey && document.activeElement === items.at(-1)) { event.preventDefault(); items[0].focus(); }
    }
  }
  function outside(event) {
    if (stack.at(-1) !== entry || modal) return;
    if (!node.contains(event.target) && !trigger?.current?.contains(event.target)) close();
  }
  function focusin(event) {
    if (modal && stack.at(-1) === entry && !node.contains(event.target)) (tabbables(node)[0] || node).focus({ preventScroll: true });
  }
  document.addEventListener('keydown', keydown, true);
  document.addEventListener('pointerdown', outside, true);
  document.addEventListener('focusin', focusin);
  return () => {
    clearTimeout(searchTimer);
    stack.splice(stack.indexOf(entry), 1);
    document.removeEventListener('keydown', keydown, true);
    document.removeEventListener('pointerdown', outside, true);
    document.removeEventListener('focusin', focusin);
    if (modal) {
      if (--locks === 0) document.body.style.overflow = previousOverflow;
      if (root) root.inert = inertBefore;
    }
    queueMicrotask(() => {
      if (previous?.isConnected && !previous.closest('[inert]') && (document.activeElement === document.body || document.activeElement === node || !document.activeElement?.isConnected)) previous.focus({ preventScroll: true });
    });
  };
}
