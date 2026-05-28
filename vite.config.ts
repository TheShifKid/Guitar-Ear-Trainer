import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { resolve } from 'path';

// Standalone web-mode config — same renderer code, no Electron.
// `npm run dev:web` to develop; `npm run build:web` to produce a deployable PWA.
export default defineConfig({
  // On GitHub Pages a project repo is served from /<repo>/, so CI sets
  // PAGES_BASE=/<repo>/. Locally it's unset and we serve from root.
  base: process.env.PAGES_BASE || '/',
  root: 'src/renderer',
  publicDir: resolve(__dirname, 'public'),
  server: {
    host: '0.0.0.0',
    port: 5174,
    strictPort: false,
  },
  resolve: {
    alias: {
      '@renderer': resolve(__dirname, 'src/renderer'),
      '@shared': resolve(__dirname, 'src/shared'),
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'apple-touch-icon-180x180.png', 'favicon.ico'],
      manifest: {
        name: 'Guitar Ear Trainer',
        short_name: 'Ear Trainer',
        description: 'Drill interval recognition on guitar',
        theme_color: '#22d3ee',
        background_color: '#070b14',
        display: 'standalone',
        orientation: 'any',
        start_url: '.',
        scope: '.',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Precache the app shell; cache the guitar samples on first use so the
        // app works offline once you've played a few notes.
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/nbrosowsky\.github\.io\/.*\.(mp3|ogg|wav)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'guitar-samples',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  build: {
    outDir: resolve(__dirname, 'dist-web'),
    emptyOutDir: true,
  },
});
