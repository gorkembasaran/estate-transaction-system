// https://nuxt.com/docs/api/configuration/nuxt-config

const defaultApiBase = 'http://127.0.0.1:3000'
const defaultApiTimeoutMs = 60000

const themeInitScript = `
(function () {
  try {
    var savedTheme = localStorage.getItem('estate-manager-theme')
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    var theme = savedTheme === 'light' || savedTheme === 'dark'
      ? savedTheme
      : prefersDark
        ? 'dark'
        : 'light'

    document.documentElement.dataset.theme = theme
    document.documentElement.style.colorScheme = theme
  } catch (_) {}
})()
`

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
      script: [
        {
          innerHTML: themeInitScript,
          tagPriority: -20,
          tagPosition: 'head',
        },
      ],
    },
  },

  compatibilityDate: '2025-07-15',

  devtools: {
    enabled: true,
  },

  experimental: {
    serverAppConfig: false,
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
      apiBase: defaultApiBase,
      apiTimeoutMs: defaultApiTimeoutMs,
    },
  },
})
