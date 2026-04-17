import axios from 'axios'
import type { ApiErrorResponse } from '~/types/api'

export function getStoreErrorMessage(error: unknown): string {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    const responseData = error.response?.data

    if (!responseData) {
      return error.message
    }

    if (Array.isArray(responseData.message)) {
      return responseData.message.join(', ')
    }

    if (typeof responseData.message === 'string') {
      return responseData.message
    }

    if (responseData.errors?.length) {
      return responseData.errors
        .flatMap((item) => item.messages)
        .join(', ')
    }

    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Unexpected error'
}
