import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      manifestFilename: 'manifest.webmanifest',
      includeAssets: [
        'favicon.ico',
        'favicon.svg',
        'apple-touch-icon.png',
        'seeded-icon.png',
        'seeded-logo.png',
      ],
      manifest: {
        name: 'Seeded — Sermon Notes That Grow Into Action',
        short_name: 'Seeded',
        description: 'A dedicated sermon-notes app for capturing church messages, prayer points, reflections, and weekly action steps so the Word can take root in everyday life.',
        theme_color: '#0F2F24',
        background_color: '#0F2F24',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/android-chrome-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff,woff2}'],
        cleanupOutdatedCaches: true,
      },
    }),
  ],
})
