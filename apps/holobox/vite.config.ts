import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { fileURLToPath, URL } from 'node:url'
import { existsSync, statSync, createReadStream } from 'node:fs'
import { extname, join } from 'node:path'

const PROJECTS_ROOT = fileURLToPath(new URL('../../projects', import.meta.url))

const MIME: Record<string, string> = {
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png':  'image/png',
  '.webp': 'image/webp',
  '.gif':  'image/gif',
  '.svg':  'image/svg+xml',
  '.mp4':  'video/mp4',
  '.webm': 'video/webm',
  '.mov':  'video/quicktime',
}

function projectsMiddleware(root: string) {
  return (req: { url?: string }, res: { setHeader: (k: string, v: string) => void; statusCode: number; end: () => void }, next: () => void) => {
    try {
      const urlPath  = decodeURIComponent(req.url ?? '')
      const filePath = join(root, urlPath)

      if (existsSync(filePath) && statSync(filePath).isFile()) {
        const contentType = MIME[extname(filePath).toLowerCase()] ?? 'application/octet-stream'
        res.setHeader('Content-Type', contentType)
        const stream = createReadStream(filePath)
        stream.on('error', () => { res.statusCode = 500; res.end() })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        stream.pipe(res as any)
      } else {
        next()
      }
    } catch {
      next()
    }
  }
}

// Serves the monorepo-level projects/ directory at /projects/ — both dev and preview.
// Production deployments must serve projects/ alongside dist/ at the same origin.
function serveProjects(): Plugin {
  return {
    name: 'serve-projects',
    configureServer(server) {
      server.middlewares.use('/projects', projectsMiddleware(PROJECTS_ROOT))
    },
    configurePreviewServer(server) {
      server.middlewares.use('/projects', projectsMiddleware(PROJECTS_ROOT))
    },
  }
}

export default defineConfig({
  plugins: [react(), serveProjects()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
