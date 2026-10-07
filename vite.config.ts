import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { loadEnv } from 'vite'
import { handleExamMarker } from './api/exam-marker-handler'


function examMarkerApi() {
  let apiKey: string | undefined

  return {
    name: 'exam-marker-api',
    configResolved(config) {
      apiKey = loadEnv(config.mode, process.cwd(), '').GROQ_API_KEY || process.env.GROQ_API_KEY
    },
    configureServer(server) {
      server.middlewares.use('/api/exam-marker', (request, response) => {
        response.setHeader('Cache-Control', 'no-store')
        if (request.method !== 'POST') {
          response.statusCode = 405
          response.end(JSON.stringify({ error: 'Method not allowed.' }))
          return
        }
        const chunks = []
        let size = 0
        request.on('data', (chunk) => {
          size += chunk.length
          if (size > 5 * 1024 * 1024) {
            response.statusCode = 413
            response.end(JSON.stringify({ error: 'Images exceed the 3 MB total limit. Upload fewer or smaller images.' }))
            request.destroy()
            return
          }
          chunks.push(chunk)
        })
        request.on('end', async () => {
          if (response.writableEnded) return
          try {
            const payload = JSON.parse(Buffer.concat(chunks).toString('utf8'))
            const result = await handleExamMarker(payload, apiKey, request.socket.remoteAddress || 'local')
            response.statusCode = result.status
            response.setHeader('Content-Type', 'application/json')
            response.end(JSON.stringify(result.body))
          } catch {
            response.statusCode = 400
            response.setHeader('Content-Type', 'application/json')
            response.end(JSON.stringify({ error: 'The request body must be valid JSON.' }))
          }
        })
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const appEnv = loadEnv(mode, process.cwd(), '')
  return {
  envDir: path.resolve(__dirname, ".vscode"),
  define: {
    'import.meta.env.VITE_FIREBASE_API_KEY': JSON.stringify(appEnv.VITE_FIREBASE_API_KEY || ''),
    'import.meta.env.VITE_FIREBASE_AUTH_DOMAIN': JSON.stringify(appEnv.VITE_FIREBASE_AUTH_DOMAIN || ''),
    'import.meta.env.VITE_FIREBASE_PROJECT_ID': JSON.stringify(appEnv.VITE_FIREBASE_PROJECT_ID || ''),
    'import.meta.env.VITE_FIREBASE_STORAGE_BUCKET': JSON.stringify(appEnv.VITE_FIREBASE_STORAGE_BUCKET || ''),
    'import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(appEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || ''),
    'import.meta.env.VITE_FIREBASE_APP_ID': JSON.stringify(appEnv.VITE_FIREBASE_APP_ID || ''),
  },
  plugins: [
    examMarkerApi(),
    // Keep both plugins enabled for React and Tailwind support.
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],
  }
})
