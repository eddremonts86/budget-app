import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000
const clientDir = path.join(__dirname, 'dist', 'client')

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.webp': 'image/webp',
}

const { default: app } = await import('./dist/server/server.js')

function tryServeStatic(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return false

  const urlPath = new URL(req.url, 'http://localhost').pathname
  const safePath = path.normalize(urlPath).replace(/^(\.\.[/\\])+/, '')
  const filePath = path.join(clientDir, safePath)

  // Prevent path traversal
  if (!filePath.startsWith(clientDir)) return false

  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) return false

  const ext = path.extname(filePath).toLowerCase()
  const mime = MIME_TYPES[ext] || 'application/octet-stream'
  const isImmutable = urlPath.startsWith('/assets/')

  res.writeHead(200, {
    'Content-Type': mime,
    'Cache-Control': isImmutable
      ? 'public, max-age=31536000, immutable'
      : 'public, max-age=3600',
  })
  fs.createReadStream(filePath).pipe(res)
  return true
}

const server = http.createServer(async (req, res) => {
  if (tryServeStatic(req, res)) return

  try {
    const url = `http://${req.headers.host || 'localhost'}${req.url}`
    const headers = {}
    for (const [k, v] of Object.entries(req.headers)) {
      if (v !== undefined) headers[k] = Array.isArray(v) ? v.join(', ') : v
    }

    const chunks = []
    for await (const chunk of req) chunks.push(chunk)
    const body = chunks.length > 0 ? Buffer.concat(chunks) : undefined

    const webRequest = new Request(url, {
      method: req.method,
      headers,
      body: body && body.length > 0 ? body : undefined,
    })

    const webResponse = await app.fetch(webRequest)

    res.writeHead(webResponse.status, Object.fromEntries(webResponse.headers.entries()))

    if (webResponse.body) {
      const reader = webResponse.body.getReader()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        res.write(value)
      }
    }
    res.end()
  } catch (err) {
    console.error('[server] SSR error:', err)
    res.writeHead(500, { 'Content-Type': 'text/plain' })
    res.end('Internal Server Error')
  }
})

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[server] Listening on http://0.0.0.0:${PORT}`)
})
