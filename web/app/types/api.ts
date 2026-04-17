import type { AxiosInstance } from 'axios'

export type ApiErrorMessage = string | string[]

export interface ApiValidationError {
  field: string
  messages: string[]
}

export interface ApiErrorResponse {
  statusCode?: number
  message: ApiErrorMessage
  error?: string
  errors?: ApiValidationError[]
}

declare module 'nuxt/app' {
  interface NuxtApp {
    $api: AxiosInstance
  }
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $api: AxiosInstance
  }
}

export {}
