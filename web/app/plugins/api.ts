import axios from 'axios'
import { defineNuxtPlugin, useRuntimeConfig } from 'nuxt/app'

const defaultApiBase = 'http://127.0.0.1:3000'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const apiBase = normalizeApiBase(config.public.apiBase)

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

function normalizeApiBase(value: unknown) {
  if (typeof value !== 'string') {
    return defaultApiBase
  }

  const trimmedValue = value.trim()

  if (!trimmedValue) {
    return defaultApiBase
  }

  return trimmedValue.replace(/\/+$/g, '')
}
