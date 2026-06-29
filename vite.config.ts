import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
// Proxy: durante `npm run dev`, las llamadas a /api/* se reenvían al servidor
// de Vercel local (`vercel dev` en el puerto 3000). Así el frontend de Vite
// y las funciones serverless corren juntos sin CORS ni rutas 404.
export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        // Si usás vercel dev en el 3000, esto redirige /api/groq/chat → http://localhost:3000/api/groq/chat
      },
      '/socket.io': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        ws: true,
      },
    },
    fs: {
      allow: ['..'],
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: './index.html',
        spotify: './nex-music.html',
      },
    },
  },
  plugins: [
    react(),
    // Custom middleware for /nex-music rewrite (dev only)
    {
      name: 'custom-rewrite',
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          if (req.url === '/nex-music' || req.url === '/nex-music/') {
            req.url = '/nex-music.html'
          }
          next()
        })
      },
    },
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons.svg', 'robots.txt'],
      manifest: {
        name: 'NEX OS Ecosystem',
        short_name: 'NEX OS',
        description: 'Ecosistema y entorno de desarrollo web de alto rendimiento.',
        theme_color: '#0078d4',
        background_color: '#1c1c1c',
        display: 'standalone',
        orientation: 'any',
        icons: [
          {
            src: 'favicon.svg',
            sizes: '192x192',
            type: 'image/svg+xml'
          },
          {
            src: 'favicon.svg',
            sizes: '512x512',
            type: 'image/svg+xml'
          },
          {
            src: 'favicon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,wasm}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days
              },
              cacheableResponse: {
                statuses: [0, 20]
              }
            }
          }
        ]
      }
    })
  ],
})