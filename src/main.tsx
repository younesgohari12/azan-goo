import React from 'react'
import { createRoot } from 'react-dom/client'

import '@fontsource-variable/vazirmatn'
import '@/styles/demo-shell.css'
import '@/styles/globals.css'

import { YAgentApp } from '@/components/shell/YAgentApp'
import { YAgentProvider } from '@/state/YAgentProvider'

/**
 * Demo host bootstrap.
 *
 * Everything product-related lives under `src/components` + `src/state` + `src/adapters`
 * and is scoped to `.yagent-root`, so the same tree can be mounted inside a WordPress
 * admin page instead of this demo shell.
 */
const container = document.getElementById('root')
if (!container) throw new Error('missing #root container')

createRoot(container).render(
  <React.StrictMode>
    <YAgentProvider>
      <YAgentApp />
    </YAgentProvider>
  </React.StrictMode>,
)
