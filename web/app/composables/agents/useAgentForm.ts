import axios from 'axios'
import { computed, reactive, ref } from 'vue'
import type {
  Agent,
  CreateAgentPayload,
  UpdateAgentPayload,
} from '~/types/agent'
import type { ApiErrorResponse } from '~/types/api'

export interface AgentFormState {
  fullName: string
  email: string
  isActive: boolean
}

export interface AgentFormErrors {
  fullName?: string
  email?: string
  isActive?: string
}

type AgentFormPayload = Required<CreateAgentPayload>

interface UseAgentFormOptions {
  fallbackErrorMessage: string
}

export function useAgentForm({ fallbackErrorMessage }: UseAgentFormOptions) {
  const form = reactive<AgentFormState>({
    email: '',
    fullName: '',
    isActive: true,
  })
  const fieldErrors = reactive<AgentFormErrors>({})
  const formError = ref<string | null>(null)
  const isSubmitting = ref(false)
  const canSubmit = computed(() => !isSubmitting.value)

  function clearErrors(): void {
    fieldErrors.email = undefined
    fieldErrors.fullName = undefined
    fieldErrors.isActive = undefined
    formError.value = null
  }

  function clearFieldError(field: keyof AgentFormErrors): void {
    fieldErrors[field] = undefined

    if (formError.value) {
      formError.value = null
    }
  }

  function populateForm(agent: Agent | null): void {
    if (!agent) {
      return
    }

    form.email = agent.email
    form.fullName = agent.fullName
    form.isActive = agent.isActive
  }

  function validateForm(): AgentFormPayload | null {
    clearErrors()

    const fullName = form.fullName.trim()
    const email = form.email.trim().toLowerCase()

    if (!fullName) {
      fieldErrors.fullName = 'Full name is required'
    } else if (fullName.length < 2) {
      fieldErrors.fullName = 'Full name must be at least 2 characters'
    }

    if (!email) {
      fieldErrors.email = 'Email is required'
    } else if (!isValidEmail(email)) {
      fieldErrors.email = 'Please enter a valid email address'
    }

    if (fieldErrors.fullName || fieldErrors.email) {
      return null
    }

    return {
      email,
      fullName,
      isActive: form.isActive,
    }
  }

  function applyBackendErrors(
    error: unknown,
    storeError?: string | null,
  ): void {
    clearErrors()

    if (!axios.isAxiosError<ApiErrorResponse>(error)) {
      formError.value = storeError || fallbackErrorMessage
      return
    }

    const responseData = error.response?.data

    if (!responseData) {
      formError.value = error.message
      return
    }

    const mappedFieldErrors = mapValidationErrors(responseData)

    if (mappedFieldErrors) {
      return
    }

    const message = normalizeErrorMessage(responseData)

    if (message.toLowerCase().includes('email')) {
      fieldErrors.email = message
      return
    }

    formError.value = message || storeError || fallbackErrorMessage
  }

  function toCreatePayload(): CreateAgentPayload | null {
    return validateForm()
  }

  function toUpdatePayload(): UpdateAgentPayload | null {
    return validateForm()
  }

  function mapValidationErrors(responseData: ApiErrorResponse): boolean {
    if (!responseData.errors?.length) {
      return false
    }

    for (const error of responseData.errors) {
      const message = error.messages.join(', ')

      if (error.field === 'fullName') {
        fieldErrors.fullName = message
        continue
      }

      if (error.field === 'email') {
        fieldErrors.email = message
        continue
      }

      if (error.field === 'isActive') {
        fieldErrors.isActive = message
      }
    }

    if (!fieldErrors.fullName && !fieldErrors.email && !fieldErrors.isActive) {
      formError.value = normalizeErrorMessage(responseData)
    }

    return true
  }

  function normalizeErrorMessage(responseData: ApiErrorResponse): string {
    if (Array.isArray(responseData.message)) {
      return responseData.message.join(', ')
    }

    if (typeof responseData.message === 'string') {
      return responseData.message
    }

    if (responseData.errors?.length) {
      return responseData.errors.flatMap((error) => error.messages).join(', ')
    }

    return fallbackErrorMessage
  }

  return {
    applyBackendErrors,
    canSubmit,
    clearErrors,
    clearFieldError,
    fieldErrors,
    form,
    formError,
    isSubmitting,
    populateForm,
    toCreatePayload,
    toUpdatePayload,
  }
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}
