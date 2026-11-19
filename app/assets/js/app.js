/* Bootstrap: mount the shell, start the router. */

import { mountShell } from './components/shell.js';
import { createRouter } from './core/router.js';
import { refreshIcons } from './core/ui.js';
import { icon } from './core/ui.js';

const app = document.getElementById('app');
const shell = mountShell(app);

const router = createRouter({
  onBeforeRender: (route) => shell.setRoute(route),
  onRender: () => refreshIcons(document.getElementById('page-root')),
  onError: (err) => {
    const root = document.getElementById('page-root');
    if (!root) return;
    root.innerHTML = `
      <div class="card" style="margin-top:20px">
        <div class="empty-state">
          <div class="empty-state__icon" style="background:var(--danger-soft);border-color:var(--danger-border);color:var(--danger)">
            ${icon('triangle-alert')}
          </div>
          <div class="empty-state__title">بارگذاری این صفحه ممکن نشد</div>
          <div class="empty-state__text">${err?.message ? err.message : 'خطای نامشخصی رخ داد.'}</div>
          <div class="empty-state__actions">
            <button class="btn btn--secondary btn--sm" onclick="location.reload()">بارگذاری مجدد</button>
          </div>
        </div>
      </div>`;
    refreshIcons(root);
  },
});

router.render();
