import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  base: './', // usa caminhos relativos no build (evita 404 se for servido em um host/porta diferente)
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: [
        'favicon.ico',
        'robots.txt',
        'apple-touch-icon.png',
        'pwa-192x192.png',
        'pwa-512x512.png'
      ],
      devOptions: {
        enabled: false
      },
      manifest: {
        name: 'ABR Integra',
        short_name: 'ABR-I',
        description: 'Aplicação para controle de documentos ABR',
        theme_color: '#1976d2',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: './',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /\/api\/.*$/,
            handler: 'NetworkFirst',
            options: {
              networkTimeoutSeconds: 10,
              cacheName: 'api-cache'
            }
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30
              }
            }
          }
        ]
      }
    })
  ],

  build: {
    outDir: 'dist',
    emptyOutDir: true, // limpa dist antes de gerar — evita mixes entre dev/index.html e build
    sourcemap: false
  },

  server: {
    host: '0.0.0.0',
    port: 5173,
    https: {
      key: './10.0.0.46-key.pem',
      cert: './10.0.0.46.pem'
    },
    open: false,
    proxy: {
      '/api': {
        target: 'http://10.0.0.46:5050/',
        changeOrigin: true,
        secure: false
      }
    }
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  }
});