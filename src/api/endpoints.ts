/**
 * Single map of every REST route the dashboard calls.
 *
 * NOTE: the plugin's API documentation has not been supplied yet. These paths
 * are the *only* place a route is declared, so confirming them against
 * `snappshop-automation/v1` docs is a one-file change. Until then the app runs
 * in demo mode (see docs/INTEGRATION.md) and never pretends to be live.
 */
export const endpoints = {
  dashboard: '/dashboard/summary',
  activity: '/activity',

  stores: '/stores',
  store: (id: number) => `/stores/${id}`,
  storeCheck: (id: number) => `/stores/${id}/check`,

  products: '/products',
  product: (id: number) => `/products/${id}`,
  productsBulk: '/products/bulk',
  priceHistory: '/pricing/history',

  inventorySummary: '/inventory/summary',

  orders: '/orders',
  order: (id: number) => `/orders/${id}`,

  syncStatus: '/sync/status',
  syncRun: '/sync/run',

  jobs: '/jobs',
  job: (id: number) => `/jobs/${id}`,
  jobCancel: (id: number) => `/jobs/${id}/cancel`,
  jobRetry: (id: number) => `/jobs/${id}/retry`,

  automations: '/automations',
  automation: (id: number) => `/automations/${id}`,
  automationToggle: (id: number) => `/automations/${id}/toggle`,
  automationRun: (id: number) => `/automations/${id}/run`,

  discounts: '/discounts',

  reports: '/reports',
  notifications: '/notifications',
  notificationsRead: '/notifications/read',

  settings: '/settings',
} as const
