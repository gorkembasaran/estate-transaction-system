import axios from 'axios'
import { defineNuxtPlugin, useRuntimeConfig } from 'nuxt/app'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()

  const apiBase =
    typeof config.public.apiBase === 'string'
      ? config.public.apiBase
      : 'http://localhost:3000'

  const api = axios.create({
    baseURL: apiBase,
    timeout: 10000,
  })

  return {
    provide: {
      api,
    },
  }
})