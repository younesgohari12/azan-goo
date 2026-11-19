/* API service layer.
 *
 * The whole UI talks to this module only. In the WordPress plugin the transport
 * is the existing REST namespace and authentication happens through the WP
 * session + X-WP-Nonce header (never a token in JS storage). In the standalone
 * preview the same contract is served by the mock adapter.
 */

import { createDb } from './mock-data.js';
import { createMockApi } from './mock-api.js';
import { store } from './store.js';

const config = window.SNAPP_AUTOMATION || {};
export const API_BASE = config.apiBase || '/wp-json/snappshop-automation/v1';
export const API_MODE = config.mode === 'live' ? 'live' : 'mock';

const mockDb = createDb();
const mockHandler = createMockApi(mockDb);

function normalizeError(err) {
  if (err && typeof err === 'object' && 'message' in err) {
    return {
      status: err.status ?? 0,
      code: err.code || (err.status === 0 ? 'connection_error' : 'api_error'),
      message: err.message || 'خطای نامشخص',
      data: err.data || null,
    };
  }
  return { status: 0, code: 'unknown_error', message: 'خطای نامشخص در ارتباط با سرور', data: null };
}

function queryString(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '' || value === 'all') return;
    search.set(key, String(value));
  });
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

const latency = () => 90 + Math.random() * 260;

async function request(method, path, { params = {}, body = null } = {}) {
  if (!store.state.online) {
    throw normalizeError({
      status: 0,
      code: 'connection_error',
      message: 'اتصال به اسنپ‌شاپ برقرار نیست. شبکه یا وضعیت اتصال را بررسی کنید.',
    });
  }

  if (API_MODE === 'mock') {
    await new Promise((resolve) => setTimeout(resolve, latency()));
    try {
      return await mockHandler(method, path, params, body);
    } catch (err) {
      throw normalizeError(err);
    }
  }

  const url = `${API_BASE}${path.startsWith('/') ? path : `/${path}`}${queryString(params)}`;
  let response;
  try {
    response = await fetch(url, {
      method,
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        // Nonce is supplied by wp_localize_script and lives only in memory.
        ...(config.nonce ? { 'X-WP-Nonce': config.nonce } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    throw normalizeError({ status: 0, code: 'connection_error', message: 'ارتباط با سرور وردپرس برقرار نشد.' });
  }

  let data = null;
  try { data = await response.json(); } catch (e) { data = null; }

  if (!response.ok) {
    throw normalizeError({
      status: response.status,
      code: data?.code || 'api_error',
      message: data?.message || `درخواست با خطای ${response.status} پاسخ داد`,
      data,
    });
  }
  return data;
}

export const api = {
  mode: API_MODE,
  base: API_BASE,
  db: mockDb,
  get: (path, params) => request('GET', path, { params }),
  post: (path, body, params) => request('POST', path, { body, params }),
  patch: (path, body) => request('PATCH', path, { body }),
  put: (path, body) => request('PUT', path, { body }),
  del: (path, params) => request('DELETE', path, { params }),
};

export function isConnectionError(err) {
  return !err || err.status === 0 || err.code === 'connection_error';
}
