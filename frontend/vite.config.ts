import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/', // Explicitement défini pour éviter les problèmes de déploiement
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'pwa-192x192.svg', 'pwa-512x512.svg', 'apple-touch-icon.png', '*.png'],
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'service-worker.js',
      injectRegister: 'auto',
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
        // Configuration iOS spécifique
        prefer_related_applications: false,
        lang: 'fr-FR',
        icons: [
          // Icônes PNG pour iOS (obligatoires)
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/apple-touch-icon.png',
            sizes: '180x180',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable'
          },
          // Icônes iOS spécifiques
          {
            src: '/apple-touch-icon-152x152.png',
            sizes: '152x152',
            type: 'image/png'
          },
          {
            src: '/apple-touch-icon-120x120.png',
            sizes: '120x120',
            type: 'image/png'
          },
          // Fallback SVG
          {
            src: '/pwa-192x192.svg',
            sizes: '192x192',
            type: 'image/svg+xml'
          },
          {
            src: '/pwa-512x512.svg',
            sizes: '512x512',
            type: 'image/svg+xml'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        globDirectory: 'dist',
        // Import OneSignal dans le service worker généré
        importScripts: ['https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js'],
        // Configuration navigation fallback pour éviter 404
        navigateFallback: '/index.html',
        navigateFallbackAllowlist: [/.*/], // Autoriser TOUTES les routes SPA
        navigateFallbackDenylist: [/^\/api\//, /\/__/, /\.(?:css|js|ico|png|svg|jpg|jpeg|gif|webp)$/], // Exclure API et assets
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
            urlPattern: /^https:\/\/intranet-saas-backend\.onrender\.com\/api\/auth\/.*/i,
            handler: 'NetworkOnly', // JAMAIS cacher l'authentification
            options: {
              cacheName: 'auth-no-cache'
            }
          },
          {
            urlPattern: /^https:\/\/intranet-saas-backend\.onrender\.com\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 // Réduit à 1h au lieu de 24h
              }
            }
          },
          {
            urlPattern: /^https:\/\/cdn\.onesignal\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'onesignal-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 1 week
              }
            }
          }
        ]
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
