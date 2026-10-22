import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { IncomingMessage, ServerResponse } from 'node:http'

const rootDir = path.dirname(fileURLToPath(import.meta.url))

/**
 * Sandbox/dev only: the preview proxy forwards requests for the public host
 * (`https://3000-$BASE44_PUBLIC_HOST_SUFFIX`) and rewrites the Host header to
 * `<port>-<sandbox id>.$BASE44_SANDBOX_HOST_DOMAIN`. Vite validates that Host header,
 * so the sandbox domain is allowed — and only while BASE44_PREVIEW_MODE is exactly "1".
 * Outside the sandbox this returns undefined and Vite keeps its default behaviour.
 */
const sandboxHostDomain = process.env.BASE44_SANDBOX_HOST_DOMAIN
const allowedHosts =
  process.env.BASE44_PREVIEW_MODE === '1' && sandboxHostDomain ? [`.${sandboxHostDomain}`] : undefined

/**
 * Dev-only middleware that archives the current source tree on demand
 * (`GET /yagent-source.zip`) so the code can be downloaded with one direct link.
 * The archive is built in memory by scripts/make-source-zip.mjs — no external
 * `zip` binary and no extra dependency (see README).
 */
function sourceZipPlugin(): Plugin {
  return {
    name: 'yagent-source-zip',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req: IncomingMessage, res: ServerResponse, next: () => void) => {
        const url = (req.url ?? '').split('?')[0]
        if (url !== '/yagent-source.zip') {
          next()
          return
        }
        void (async () => {
          try {
            const { buildSourceZip } = await import('./scripts/make-source-zip.mjs')
            const archive = await buildSourceZip(rootDir)
            res.setHeader('Content-Type', 'application/zip')
            res.setHeader('Content-Length', String(archive.length))
            res.setHeader('Content-Disposition', 'attachment; filename="yagent-ui-source.zip"')
            res.setHeader('Cache-Control', 'no-store')
            res.end(archive)
          } catch (error) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'text/plain; charset=utf-8')
            res.end(`zip build failed: ${String(error)}`)
          }
        })()
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), sourceZipPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(rootDir, 'src'),
    },
  },
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    allowedHosts,
  },
})
