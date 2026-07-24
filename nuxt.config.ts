import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  css: ['@/assets/css/tailwind.css'],
  vite: {
    plugins: [tailwindcss()],
  },
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: [
    'shadcn-nuxt',
    '@nuxt/eslint',
    '@pinia/nuxt',
    'pinia-plugin-persistedstate/nuxt',
    '@vite-pwa/nuxt',
  ],
  shadcn: {
    prefix: '',
    componentDir: '@/components/ui',
  },
  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'Kanji SRS - JLPT N5',
      short_name: 'Kanji SRS',
      description: 'Client-side spaced repetition study app for JLPT N5 kanji using FSRS algorithm',
      theme_color: '#7f1d1d',
      background_color: '#fbf9f5',
      display: 'standalone',
      orientation: 'portrait',
      icons: [
        {
          src: '/pwa-192x192.png',
          sizes: '192x192',
          type: 'image/png',
        },
        {
          src: '/pwa-512x512.png',
          sizes: '512x512',
          type: 'image/png',
        },
      ],
    },
    workbox: {
      navigateFallback: '/',
      globPatterns: ['**/*.{js,css,html,png,svg,ico,json}'],
    },
    client: {
      installPrompt: true,
    },

    devOptions: {
      enabled: true,
      type: 'module',
    },
  },
})
