<script setup lang="ts">
import { useEditAgentPage } from '~/composables/agents/useEditAgentPage'

const {
  canSubmit,
  clearFieldError,
  error,
  fieldErrors,
  form,
  formError,
  fullNameInput,
  isInitialLoading,
  isSubmitting,
  submitAgent,
} = useEditAgentPage()
</script>

<template>
  <section
    class="edit-agent-page"
    aria-labelledby="edit-agent-title"
    data-testid="edit-agent-page"
  >
    <NuxtLink class="back-link" to="/agents">
      <span aria-hidden="true">←</span>
      Back to Agents
    </NuxtLink>

    <form class="agent-form-card" novalidate @submit.prevent="submitAgent">
      <header class="form-heading">
        <p>Agent profile</p>
        <h1 id="edit-agent-title">Edit Agent</h1>
      </header>

      <div v-if="error && !formError" class="form-alert" role="alert">
        {{ error }}
      </div>

      <div v-if="formError" class="form-alert" role="alert">
        {{ formError }}
      </div>

      <div
        v-if="isInitialLoading"
        class="form-skeleton"
        aria-label="Loading agent form"
      >
        <div v-for="index in 3" :key="index" class="form-skeleton__field">
          <span class="form-skeleton__line" />
          <span class="form-skeleton__input" />
        </div>
        <div class="form-skeleton__actions">
          <span class="form-skeleton__button" />
          <span class="form-skeleton__button" />
        </div>
      </div>

      <template v-else>
        <label class="form-field" for="fullName">
          <span>Full Name *</span>
          <input
            id="fullName"
            ref="fullNameInput"
            v-model="form.fullName"
            :aria-describedby="
              fieldErrors.fullName ? 'fullName-error' : undefined
            "
            :aria-invalid="Boolean(fieldErrors.fullName)"
            autocomplete="name"
            data-testid="agent-full-name-input"
            name="fullName"
            placeholder="Enter agent's full name"
            type="text"
            @input="clearFieldError('fullName')"
          />
          <small
            v-if="fieldErrors.fullName"
            id="fullName-error"
            class="field-error"
          >
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
          />
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
          />
          <span class="checkbox-control" aria-hidden="true">
            <svg viewBox="0 0 16 16">
              <path d="m3.75 8.25 2.5 2.5 6-6.5" />
            </svg>
          </span>
          <span class="checkbox-copy">
            <strong>Active Status</strong>
            <small>
              Inactive agents remain stored and can be viewed with the status
              filter.
            </small>
          </span>
        </label>

        <small v-if="fieldErrors.isActive" class="field-error">
          {{ fieldErrors.isActive }}
        </small>

        <div class="form-actions">
          <button
            class="primary-button"
            data-testid="edit-agent-submit"
            :disabled="!canSubmit"
            type="submit"
          >
            {{ isSubmitting ? 'Saving...' : 'Save Changes' }}
          </button>

          <NuxtLink class="secondary-button" to="/agents"> Cancel </NuxtLink>
        </div>
      </template>
    </form>
  </section>
</template>

<style scoped>
.edit-agent-page {
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

.form-loading {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  color: #4b5563;
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
