import { el, Fragment } from './dom.js';
import { parseMarkdown } from '../vendor.js';
function safeURL(value) {
  const url = String(value || '');
  const colon = url.indexOf(':');
  if (colon < 0 || /^(https?|ircs?|mailto|xmpp)$/i.test(url.slice(0, colon))) return url;
  if (['/', '?', '#'].some(c => url.indexOf(c) >= 0 && url.indexOf(c) < colon)) return url;
  return '';
}
/** Framework-independent Markdown/GFM to local DOM templates. Raw HTML is text. */
export default function Markdown({ children, components = {} }) {
  function visit(node, index = 0) {
    if (node.type === 'text' || node.type === 'raw') return node.value;
    if (node.type === 'root') return el(Fragment, null, (node.children || []).map(visit));
    if (node.type !== 'element') return null;
    const props = { ...node.properties, key: `${node.tagName}-${index}`, node };
    if (Array.isArray(props.className)) props.className = props.className.join(' ');
    for (const key of ['href', 'src', 'cite']) if (props[key] != null) props[key] = safeURL(props[key]);
    return el(components[node.tagName] || node.tagName, props, (node.children || []).map(visit));
  }
  return visit(parseMarkdown(String(children || '')));
}
