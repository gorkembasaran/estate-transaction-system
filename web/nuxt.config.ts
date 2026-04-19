// https://nuxt.com/docs/api/configuration/nuxt-config

export default defineNuxtConfig({
  app: {
    head: {
      title: 'Estate Manager',
      meta: [
        {
          name: 'description',
          content: 'Estate transaction and commission management system',
        },
      ],
      link: [
        {
          rel: 'icon',
          type: 'image/svg+xml',
          href: '/favicon.svg',
        },
        {
          rel: 'alternate icon',
          type: 'image/x-icon',
          href: '/favicon.ico',
        },
      ],
    },
  },

  compatibilityDate: '2025-07-15',

  devtools: {
    enabled: true,
  },

  modules: [
    '@pinia/nuxt',
    '@nuxtjs/tailwindcss',
  ],

  css: [
    '~~/assets/css/main.css',
  ],

  runtimeConfig: {
    public: {
      apiBase:
        process.env.NUXT_PUBLIC_API_BASE ||
        'http://127.0.0.1:3000',
    },
  },
})
