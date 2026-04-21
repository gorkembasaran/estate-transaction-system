<script setup lang="ts">
import axios from 'axios'
import { computed, onMounted, reactive, ref } from 'vue'
import { useAgentsStore } from '~/stores/agents'
import type { CreateAgentPayload } from '~/types/agent'
import type { ApiErrorResponse } from '~/types/api'

interface AgentFormState {
  fullName: string
  email: string
  isActive: boolean
}

interface AgentFormErrors {
  fullName?: string
  email?: string
  isActive?: string
}

const agentsStore = useAgentsStore()

const form = reactive<AgentFormState>({
  email: '',
  fullName: '',
  isActive: true,
})
const fieldErrors = reactive<AgentFormErrors>({})
const formError = ref<string | null>(null)
const isSubmitting = ref(false)
const fullNameInput = ref<HTMLInputElement | null>(null)

const canSubmit = computed(() => !isSubmitting.value)

function clearErrors(): void {
  fieldErrors.email = undefined
  fieldErrors.fullName = undefined
  fieldErrors.isActive = undefined
  formError.value = null
}

function validateForm(): CreateAgentPayload | null {
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

async function submitAgent(): Promise<void> {
  if (isSubmitting.value) {
    return
  }

  const payload = validateForm()

  if (!payload) {
    return
  }

  isSubmitting.value = true

  try {
    await agentsStore.createAgent(payload)
    await navigateTo('/agents')
  } catch (error) {
    applyBackendErrors(error)
  } finally {
    isSubmitting.value = false
  }
}

function applyBackendErrors(error: unknown): void {
  clearErrors()

  if (!axios.isAxiosError<ApiErrorResponse>(error)) {
    formError.value = agentsStore.error || 'Could not create agent'
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

  formError.value = message || agentsStore.error || 'Could not create agent'
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
    return responseData.errors
      .flatMap((error) => error.messages)
      .join(', ')
  }

  return 'Could not create agent'
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function clearFieldError(field: keyof AgentFormErrors): void {
  fieldErrors[field] = undefined

  if (formError.value) {
    formError.value = null
  }
}

onMounted(() => {
  fullNameInput.value?.focus()
})
</script>

<template>
  <section
    class="create-agent-page"
    aria-labelledby="create-agent-title"
    data-testid="create-agent-page"
  >
    <NuxtLink class="back-link" to="/agents">
      <span aria-hidden="true">←</span>
      Back to Agents
    </NuxtLink>

    <form class="agent-form-card" novalidate @submit.prevent="submitAgent">
      <header class="form-heading">
        <p>Active agent directory</p>
        <h1 id="create-agent-title">
          Create New Agent
        </h1>
      </header>

      <div v-if="formError" class="form-alert" role="alert">
        {{ formError }}
      </div>

      <label class="form-field" for="fullName">
        <span>Full Name *</span>
        <input
          id="fullName"
          ref="fullNameInput"
          v-model="form.fullName"
          :aria-describedby="fieldErrors.fullName ? 'fullName-error' : undefined"
          :aria-invalid="Boolean(fieldErrors.fullName)"
          autocomplete="name"
          data-testid="agent-full-name-input"
          name="fullName"
          placeholder="Enter agent's full name"
          type="text"
          @input="clearFieldError('fullName')"
        >
        <small v-if="fieldErrors.fullName" id="fullName-error" class="field-error">
          {{ fieldErrors.fullName }}
        </small>
      </label>

      <label class="form-field" for="email">
        <span>Email *</span>
        <input
          id="email"
          v-model="form.email"
          :aria-describedby="fieldErrors.email ? 'email-error' : undefined"
          :aria-invalid="Boolean(fieldErrors.email)"
          autocomplete="email"
          data-testid="agent-email-input"
          inputmode="email"
          name="email"
          placeholder="agent@example.com"
          type="email"
          @input="clearFieldError('email')"
        >
        <small v-if="fieldErrors.email" id="email-error" class="field-error">
          {{ fieldErrors.email }}
        </small>
      </label>

      <label class="checkbox-field" for="isActive">
        <input
          id="isActive"
          v-model="form.isActive"
          data-testid="agent-is-active-input"
          name="isActive"
          type="checkbox"
          @change="clearFieldError('isActive')"
        >
        <span class="checkbox-control" aria-hidden="true">
          <svg viewBox="0 0 16 16">
            <path d="m3.75 8.25 2.5 2.5 6-6.5" />
          </svg>
        </span>
        <span class="checkbox-copy">
          <strong>Active Status</strong>
          <small>
            Active agents are available for selection in transaction forms.
          </small>
        </span>
      </label>

      <small v-if="fieldErrors.isActive" class="field-error">
        {{ fieldErrors.isActive }}
      </small>

      <div class="form-actions">
        <button
          class="primary-button"
          data-testid="create-agent-submit"
          :disabled="!canSubmit"
          type="submit"
        >
          {{ isSubmitting ? 'Creating...' : 'Create Agent' }}
        </button>

        <NuxtLink class="secondary-button" to="/agents">
          Cancel
        </NuxtLink>
      </div>
    </form>
  </section>
</template>

<style scoped>
.create-agent-page {
  min-height: calc(100vh - 98px);
}

.back-link {
  align-items: center;
  color: #4b5563;
  display: inline-flex;
  font-size: 15px;
  font-weight: 700;
  gap: 8px;
  margin-bottom: 24px;
}

.back-link:hover {
  color: #4f46e5;
}

.back-link span {
  font-size: 20px;
  line-height: 1;
}

.agent-form-card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow:
    0 12px 28px rgb(15 23 42 / 0.07),
    0 2px 8px rgb(15 23 42 / 0.04);
  display: grid;
  gap: 18px;
  margin: 0 auto;
  max-width: 580px;
  padding: 32px;
}

.form-heading {
  display: grid;
  gap: 6px;
}

.form-heading p {
  color: #4f46e5;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0;
  margin: 0;
}

.form-heading h1 {
  color: #111827;
  font-size: 24px;
  line-height: 1.2;
  margin: 0;
}

.form-alert {
  background: #fff7ed;
  border: 1px solid #fed7aa;
  border-radius: 8px;
  color: #9a3412;
  font-size: 14px;
  font-weight: 700;
  padding: 12px 14px;
}

.form-field {
  display: grid;
  gap: 8px;
}

.form-field span {
  color: #374151;
  font-size: 13px;
  font-weight: 800;
}

.form-field input {
  background: #fcfcfd;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  color: #111827;
  font: inherit;
  font-size: 15px;
  font-weight: 650;
  min-height: 48px;
  outline: 0;
  padding: 0 14px;
  transition:
    background-color 160ms ease,
    border-color 160ms ease,
    box-shadow 160ms ease;
}

.form-field input:hover {
  background: #ffffff;
  border-color: #b8c0cc;
}

.form-field input::placeholder {
  color: #9ca3af;
  font-weight: 600;
}

.form-field input:focus {
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgb(79 70 229 / 0.12);
}

.form-field input[aria-invalid='true'] {
  border-color: #dc2626;
  box-shadow: 0 0 0 3px rgb(220 38 38 / 0.1);
}

.field-error {
  color: #b91c1c;
  font-size: 13px;
  font-weight: 700;
}

.checkbox-field {
  align-items: flex-start;
  cursor: pointer;
  display: grid;
  gap: 12px;
  grid-template-columns: 22px minmax(0, 1fr);
  margin-top: 2px;
  position: relative;
}

.checkbox-field input {
  height: 22px;
  margin: 0;
  opacity: 0;
  position: absolute;
  width: 22px;
}

.checkbox-control {
  align-items: center;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  color: #ffffff;
  display: inline-flex;
  height: 22px;
  justify-content: center;
  transition:
    background-color 160ms ease,
    border-color 160ms ease,
    box-shadow 160ms ease;
  width: 22px;
}

.checkbox-control svg {
  height: 15px;
  width: 15px;
}

.checkbox-control path {
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2.4;
}

.checkbox-field input:checked + .checkbox-control {
  background: #4f46e5;
  border-color: #4f46e5;
}

.checkbox-field input:focus-visible + .checkbox-control {
  box-shadow: 0 0 0 3px rgb(79 70 229 / 0.16);
}

.checkbox-copy {
  display: grid;
  gap: 4px;
}

.checkbox-copy strong {
  color: #374151;
  font-size: 14px;
}

.checkbox-copy small {
  color: #6b7280;
  font-size: 13px;
  font-weight: 650;
  line-height: 1.45;
}

.form-actions {
  display: grid;
  gap: 14px;
  grid-template-columns: minmax(0, 1fr) 110px;
  margin-top: 10px;
}

.primary-button,
.secondary-button {
  align-items: center;
  border-radius: 8px;
  display: inline-flex;
  font: inherit;
  font-size: 14px;
  font-weight: 800;
  justify-content: center;
  min-height: 46px;
  padding: 0 16px;
}

.primary-button {
  background: #4f46e5;
  border: 1px solid #4f46e5;
  box-shadow: 0 8px 18px rgb(79 70 229 / 0.22);
  color: #ffffff;
  cursor: pointer;
  transition:
    background-color 160ms ease,
    box-shadow 160ms ease,
    transform 160ms ease;
}

.primary-button:hover:not(:disabled) {
  background: #4338ca;
  box-shadow: 0 10px 22px rgb(79 70 229 / 0.26);
  transform: translateY(-1px);
}

.primary-button:disabled {
  cursor: not-allowed;
  opacity: 0.62;
}

.secondary-button {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  color: #374151;
  transition:
    border-color 160ms ease,
    color 160ms ease,
    background-color 160ms ease;
}

.secondary-button:hover {
  background: #f9fafb;
  border-color: #c7d2fe;
  color: #4f46e5;
}

@media (max-width: 720px) {
  .agent-form-card {
    max-width: none;
    padding: 24px;
  }

  .form-actions {
    grid-template-columns: 1fr;
  }

  .secondary-button {
    min-height: 42px;
  }
}
</style>
