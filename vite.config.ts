import { copyFileSync, existsSync } from 'node:fs'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

function spaFallback(): Plugin {
  return {
    name: 'spa-fallback',
    closeBundle() {
      if (existsSync('dist/index.html')) {
        copyFileSync('dist/index.html', 'dist/404.html')
      }
    },
  }
}

export default defineConfig({
  plugins: [react(), spaFallback()],
  server: {
    host: '0.0.0.0',
    port: 47231,
  },
  preview: {
    host: '0.0.0.0',
    port: 47231,
  },
})
