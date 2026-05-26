import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { VitePWA } from 'vite-plugin-pwa'
import { resolve } from 'path'

export default defineConfig({
  base: '/flexipayroll/',
  server: { host: true },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@lib': resolve(__dirname, 'src/lib'),
      '@components': resolve(__dirname, 'src/components'),
      '@styles': resolve(__dirname, 'src/styles.sass')
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        includePaths: ['node_modules']
      }
    }
  },
  plugins: [
    svelte({
      compilerOptions: {
        runes: true
      }
    }),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['main.svg', 'logo.svg', 'bg-animated.svg', 'scheme/dark.svg', 'scheme/light.svg'],
      manifest: {
        id: '/flexipayroll/',
        name: 'FlexiPayroll',
        short_name: 'FlexiPayroll',
        description: 'A lightweight, browser-based payroll management system for SMEs.',
        start_url: '/flexipayroll/',
        scope: '/flexipayroll/',
        display: 'standalone',
        theme_color: '#ffa3a5',
        background_color: '#131214',
        icons: [
          {
            src: 'main.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          },
          {
            src: 'main.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any'
          },
          {
            src: 'main.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024
      }
    })
  ]
})
