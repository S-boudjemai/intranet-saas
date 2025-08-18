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
      // Configuration minimale pour injectManifest
      // Les stratégies de cache sont maintenant dans service-worker.js
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
