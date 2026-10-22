import type { YAgentAdapter } from './types'
import { createMockAdapter, type MockAdapterOptions } from './mock/mockAdapter'

export * from './types'

/**
 * The single switch point between the demo and the real backend.
 *
 * When the WordPress plugin is ready, replace the body of this function with
 * `createRestAdapter({ baseUrl: window.yagentSettings.restUrl, nonce })` — the
 * interface does not change, because every component only talks to
 * `YAgentAdapter`.
 */
export function createYAgentAdapter(options?: MockAdapterOptions): YAgentAdapter {
  return createMockAdapter(options)
}
