import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'pwa-192x192.svg', 'pwa-512x512.svg'],
      manifest: {
        name: 'MaternalCare Edge AI - Risk Scoring PWA',
        short_name: 'MaternalCare AI',
        description: 'Offline-first maternal health risk assessment and triage PWA for rural health workers with in-browser TensorFlow.js and AWS S3 sync.',
        theme_color: '#0f766e',
        background_color: '#042f2e',
        display: 'standalone',
        orientation: 'portrait-primary',
        icons: [
          {
            src: 'pwa-192x192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any'
          },
          {
            src: 'pwa-512x512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any'
          },
          {
            src: 'pwa-512x512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,bin,woff,woff2}'],
        runtimeCaching: [
          {
            // Cache TensorFlow.js model files (.json architecture and .bin weight shards)
            urlPattern: /^https?:\/\/.*\/model\/.*|.*model\.json$|.*\.bin$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'tfjs-model-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 Days cache
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
  build: {
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('@tensorflow')) {
            return 'tensorflow-core'
          }
          if (id.includes('@aws-sdk')) {
            return 'aws-sdk-s3'
          }
          if (id.includes('dexie')) {
            return 'vendor-db'
          }
        }
      }
    }
  }
})
