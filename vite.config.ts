import { copyFileSync, existsSync } from 'node:fs'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

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

const base = '/css-specificity-game/'

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false,
      manifest: {
        id: base,
        name: 'Selector Wars',
        short_name: 'Selector Wars',
        description: 'Ids, klassen, attributen en elementen. Alleen, of daag iemand uit!',
        lang: 'nl',
        dir: 'ltr',
        start_url: base,
        scope: base,
        display: 'standalone',
        display_override: ['standalone', 'browser'],
        orientation: 'any',
        background_color: '#ffffff',
        theme_color: '#c47810',
        categories: ['education', 'games'],
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'pwa-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        navigateFallback: `${base}index.html`,
        navigateFallbackDenylist: [/^\/api\//],
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2,webmanifest}'],
      },
    }),
    spaFallback(),
  ],
  server: {
    host: '0.0.0.0',
    port: 47231,
  },
  preview: {
    host: '0.0.0.0',
    port: 47231,
  },
})
