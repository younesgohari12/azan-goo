/* Shared page building blocks. */

import { icon, refreshIcons, pageNumbers } from '../core/ui.js';
import { escapeHtml, fa } from '../core/utils.js';

export function pageHead({ title, sub = '', actions = '', badgeHtml = '' }) {
  return `
    <div class="page-head">
      <div class="u-grow" style="min-width:0">
        <div class="u-row gap-8" style="flex-wrap:wrap">
          <h1 class="t-page-title">${escapeHtml(title)}</h1>
          ${badgeHtml}
        </div>
        ${sub ? `<div class="t-page-sub">${sub}</div>` : ''}
      </div>
      ${actions ? `<div class="page-head__actions">${actions}</div>` : ''}
    </div>`;
}

export function card({
  title = '', sub = '', actions = '', body = '', flush = false,
  foot = '', className = '', id = '',
}) {
  return `
    <section class="card ${className}" ${id ? `id="${id}"` : ''}>
      ${title || actions ? `
        <div class="card__head">
          <div class="u-grow" style="min-width:0">
            <div class="card__title">${title}</div>
            ${sub ? `<div class="card__sub">${sub}</div>` : ''}
          </div>
          ${actions ? `<div class="card__actions">${actions}</div>` : ''}
        </div>` : ''}
      <div class="card__body ${flush ? 'card__body--flush' : ''}">${body}</div>
      ${foot ? `<div class="card__foot">${foot}</div>` : ''}
    </section>`;
}

export function statCard({ iconName, tone = '', label, value, foot = '', valueHtml = null }) {
  return `
    <article class="stat">
      <div class="stat__top">
        <div class="stat__icon ${tone ? `is-${tone}` : ''}">${icon(iconName)}</div>
        <div class="stat__label">${escapeHtml(label)}</div>
      </div>
      <div class="stat__value">${valueHtml ?? escapeHtml(String(value))}</div>
      <div class="stat__foot">${foot}</div>
    </article>`;
}

export function paginationBar({ page, pages, total, perPage, label = 'مورد' }) {
  const from = total === 0 ? 0 : (page - 1) * perPage + 1;
  const to = Math.min(total, page * perPage);
  const nums = pageNumbers(page, pages);
  return `
    <div class="pagination">
      <span class="pagination__info">نمایش ${fa(from)} تا ${fa(to)} از ${fa(total)} ${label}</span>
      <span class="pagination__spacer"></span>
      <button class="page-btn" data-page="${page - 1}" ${page <= 1 ? 'disabled' : ''} aria-label="قبلی">${icon('chevron-right')}</button>
      ${nums.map((n) => (n === '…'
        ? '<span class="t-faint" style="padding:0 3px">…</span>'
        : `<button class="page-btn ${n === page ? 'is-active' : ''}" data-page="${n}">${fa(n)}</button>`)).join('')}
      <button class="page-btn" data-page="${page + 1}" ${page >= pages ? 'disabled' : ''} aria-label="بعدی">${icon('chevron-left')}</button>
    </div>`;
}

export function bindPagination(root, handler) {
  root.querySelectorAll('[data-page]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const page = Number(btn.dataset.page);
      if (!Number.isFinite(page) || btn.disabled) return;
      handler(page);
    });
  });
}

export function tabs({ items, active, name = 'tab' }) {
  return `
    <div class="tabs" role="tablist" data-tabs="${name}">
      ${items.map((t) => `
        <button class="tab ${t.key === active ? 'is-active' : ''}" role="tab" data-tab="${t.key}" aria-selected="${t.key === active}">
          ${t.iconName ? icon(t.iconName) : ''}
          <span>${escapeHtml(t.label)}</span>
          ${t.count !== undefined ? `<span class="tab__count">${fa(t.count)}</span>` : ''}
        </button>`).join('')}
    </div>`;
}

export function bindTabs(root, handler) {
  root.querySelectorAll('[data-tab]').forEach((btn) => {
    btn.addEventListener('click', () => handler(btn.dataset.tab));
  });
}

export function toolbarSearch({ placeholder = 'جست‌وجو…', value = '', name = 'search' }) {
  return `
    <div class="search-box">
      ${icon('search')}
      <input class="input" name="${name}" placeholder="${escapeHtml(placeholder)}" value="${escapeHtml(value)}" />
    </div>`;
}

export function refresh(root) {
  refreshIcons(root);
}

export function moneyCell(value, { currency = 'تومان' } = {}) {
  if (value === null || value === undefined) return '<span class="t-faint">نامشخص</span>';
  return `<span class="t-num">${fa(Number(value))}</span> <span class="t-faint" style="font-size:10.5px">${currency}</span>`;
}

export function sectionTitle(title, sub = '', actions = '') {
  return `
    <div class="u-between" style="margin-bottom:10px">
      <div>
        <div class="t-section-title">${title}</div>
        ${sub ? `<div class="t-muted" style="font-size:11.5px">${sub}</div>` : ''}
      </div>
      ${actions}
    </div>`;
}
