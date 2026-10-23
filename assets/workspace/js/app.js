import { el, mount, Fragment } from './native/dom.js';
import { WorkspaceBar } from './components/shell/WorkspaceBar.js';
import { YAgentApp } from './components/shell/YAgentApp.js';
import { YAgentProvider } from './state/YAgentProvider.js';
const root = document.getElementById('root');
if (!root) throw new Error('missing #root container');
root.replaceChildren();
mount(root, el(YAgentProvider, null, el(Fragment, null, el(WorkspaceBar), el(YAgentApp))));
