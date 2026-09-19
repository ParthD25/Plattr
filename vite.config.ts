/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Open Food Facts free-text search sends no CORS header, so the dev/preview server forwards it.
const proxy = { '/api/off-search': { target: 'https://search.openfoodfacts.org', changeOrigin: true, rewrite: (p: string) => p.replace(/^\/api\/off-search/, '/search') } }

export default defineConfig({
  plugins: [react()],
  // Replit serves the app from a generated *.replit.dev / *.replit.app host
  server: { host: true, allowedHosts: true, proxy },
  preview: { host: true, allowedHosts: true, proxy },
  test: { environment: 'node' },
})
