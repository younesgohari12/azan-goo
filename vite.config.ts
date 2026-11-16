import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * The preview proxy reaches the dev server as `3000-<preview suffix>` — a prefix,
 * not a subdomain — so the exact host is derived from the environment alongside
 * the domain wildcards. Outside preview mode no extra host is allowed.
 */
function previewAllowedHosts(): string[] | undefined {
  if (process.env.BASE44_PREVIEW_MODE !== '1') return undefined
  const hosts = new Set<string>()
  if (process.env.BASE44_SANDBOX_HOST_DOMAIN) hosts.add(`.${process.env.BASE44_SANDBOX_HOST_DOMAIN}`)
  if (process.env.BASE44_PUBLIC_HOST_SUFFIX) {
    hosts.add(`.${process.env.BASE44_PUBLIC_HOST_SUFFIX}`)
    hosts.add(`3000-${process.env.BASE44_PUBLIC_HOST_SUFFIX}`)
  }
  return hosts.size ? [...hosts] : undefined
}

// The dashboard is embedded inside WordPress at /wp-admin/admin.php?page=snappshop-automation,
// so built assets use relative URLs.
export default defineConfig({
  base: './',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
    allowedHosts: previewAllowedHosts(),
    watch: { usePolling: true, interval: 400 },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-charts': ['recharts'],
          'vendor-query': ['@tanstack/react-query'],
        },
      },
    },
  },
})
