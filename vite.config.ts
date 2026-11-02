/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const isDesktop = env.VITE_TARGET === 'desktop'

  return {
    // Electron loads the desktop build over file://, so assets must be relative.
    base: isDesktop ? './' : '/',
    build: { outDir: isDesktop ? 'dist-desktop' : 'dist' },
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        disable: isDesktop,
        registerType: 'autoUpdate',
        includeAssets: ['icons/favicon-48.png'],
        manifest: {
          name: 'Happy meal',
          short_name: 'Happy meal',
          description: 'Ton plan alimentaire, tes courses et ton suivi, 100 % local.',
          lang: 'fr',
          start_url: '/app',
          scope: '/',
          display: 'standalone',
          background_color: '#F8F6EE',
          theme_color: '#F8F6EE',
          icons: [
            { src: '/icons/pwa-192.png', sizes: '192x192', type: 'image/png' },
            { src: '/icons/pwa-512.png', sizes: '512x512', type: 'image/png' },
            { src: '/icons/pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,png,webp,woff2,json}'],
          navigateFallback: '/index.html',
        },
      }),
    ],
    test: {
      include: ['src/**/*.test.ts'],
      environment: 'node',
      passWithNoTests: true,
    },
  }
})
