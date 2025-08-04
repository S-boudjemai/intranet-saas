import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'pwa-192x192.svg', 'pwa-512x512.svg'],
      strategies: 'generateSW',
      injectRegister: false,
      devOptions: {
        enabled: true
      },
      includeManifestIcons: true,
      manifest: {
        name: 'FranchiseDesk',
        short_name: 'FDesk',
        description: 'Plateforme de gestion franchiseur-franchisé',
        theme_color: '#2563eb',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        categories: ['business', 'productivity'],
        icons: [
          {
            src: '/pwa-192x192.svg',
            sizes: '192x192',
            type: 'image/svg+xml'
          },
          {
            src: '/pwa-512x512.svg',
            sizes: '512x512',
            type: 'image/svg+xml'
          },
          {
            src: '/pwa-192x192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'maskable'
          },
          {
            src: '/pwa-192x192.svg',
            sizes: '180x180',
            type: 'image/svg+xml',
            purpose: 'any'
          },
          {
            src: '/pwa-192x192.svg',
            sizes: '152x152',
            type: 'image/svg+xml',
            purpose: 'any'
          },
          {
            src: '/pwa-192x192.svg',
            sizes: '120x120',
            type: 'image/svg+xml',
            purpose: 'any'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        globDirectory: 'dist',
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          },
          {
            urlPattern: /^https:\/\/intranet-saas-backend\.onrender\.com\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              }
            }
          }
        ],
        // Service worker pour PWA uniquement (Firebase supprimé)
      }
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Dépendances lourdes séparées
          'vendor-charts': ['recharts'],
          'vendor-animations': ['framer-motion'],
          'vendor-icons': ['react-icons', 'lucide-react'],
          'vendor-react': ['react', 'react-dom'],
          'vendor-router': ['react-router-dom'],
          'vendor-socket': ['socket.io-client'],
          'vendor-utils': ['jwt-decode', 'dompurify', 'axios'],
          
          // Pages principales
          'page-documents': ['./src/pages/DocumentsPage.tsx'],
          'page-tickets': ['./src/pages/TicketsPages.tsx'],
          'page-admin': ['./src/pages/AdminGlobalDashboard.tsx']
        }
      }
    },
    target: 'esnext',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.warn']
      }
    },
    chunkSizeWarningLimit: 500
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
    exclude: ['@vitejs/plugin-react']
  },
  server: {
    host: '0.0.0.0', // Permet l'accès depuis d'autres appareils du réseau
    port: 5174,
    // Proxy supprimé - utilise VITE_API_URL en dev et prod
  }
});
