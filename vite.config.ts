import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * In the Base44 sandbox the preview is served through a proxy host.
 * The platform injects the allowed preview hostnames through
 * `__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS`; outside the sandbox the variable is
 * simply absent and Vite keeps its default behaviour.
 */
const extraAllowedHosts = (process.env.__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS ?? '')
  .split(',')
  .map((host) => host.trim())
  .filter(Boolean)

const isPreviewSandbox = process.env.BASE44_PREVIEW_MODE === '1'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 3000,
    strictPort: true,
    ...(extraAllowedHosts.length ? { allowedHosts: extraAllowedHosts } : {}),
    ...(isPreviewSandbox ? { watch: { usePolling: true, interval: 150 } } : {}),
  },
  preview: { host: true, port: 3000 },
  build: { outDir: 'dist', sourcemap: false },
})
