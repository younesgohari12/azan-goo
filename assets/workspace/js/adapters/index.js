import { createRestAdapter } from './rest/restAdapter.js';
import { createMockAdapter } from './mock/mockAdapter.js';
export * from './types.js';
/** Production entry point: authenticated WordPress data, with no demo seed. */
export function createYAgentAdapter(options) {
    const config = options || window.YAgentUI;
    // The standalone demo (host page or preview) boots with `demo: true`; the
    // WordPress plugin never sets it, so production always talks to the REST API.
    if (config?.demo === true)
        return createMockAdapter(config);
    return createRestAdapter(config);
}
