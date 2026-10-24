import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const isPreview = process.env.BASE44_PREVIEW_MODE === '1'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    // Sandbox preview: the proxy reaches the dev server via the rotating
    // sandbox host domain; allow it only while BASE44_PREVIEW_MODE === '1'.
    allowedHosts: isPreview && process.env.BASE44_SANDBOX_HOST_DOMAIN
      ? ['.' + process.env.BASE44_SANDBOX_HOST_DOMAIN]
      : undefined,
    watch: {
      usePolling: process.env.CHOKIDAR_USEPOLLING === '1',
    },
  },
})
