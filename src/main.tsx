import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, HashRouter } from 'react-router-dom'
import App from './App'
import { PreferencesProvider } from '@/app/preferences'
import { ToastProvider } from '@/components/ui/toast'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 15_000,
      refetchOnWindowFocus: false,
    },
  },
})

/** HashRouter is used inside wp-admin, where the page URL is not a clean SPA path. */
const Router = import.meta.env.VITE_ROUTER === 'hash' ? HashRouter : BrowserRouter

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <PreferencesProvider>
        <ToastProvider>
          <Router>
            <App />
          </Router>
        </ToastProvider>
      </PreferencesProvider>
    </QueryClientProvider>
  </StrictMode>,
)
