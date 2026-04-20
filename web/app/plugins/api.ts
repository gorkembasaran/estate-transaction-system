import axios from 'axios'
import { defineNuxtPlugin, useRuntimeConfig } from 'nuxt/app'

const defaultApiBase = 'http://127.0.0.1:3000'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const apiBase = normalizeApiBase(config.public.apiBase)
  const apiTimeoutMs = normalizeApiTimeoutMs(config.public.apiTimeoutMs)

  const api = axios.create({
    baseURL: apiBase,
    timeout: apiTimeoutMs,
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

function normalizeApiTimeoutMs(value: unknown) {
  const fallbackTimeoutMs = 60000
  const timeoutMs = typeof value === 'number' ? value : Number(value)

  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    return fallbackTimeoutMs
  }

  return timeoutMs
}
