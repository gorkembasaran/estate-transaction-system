<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, onMounted, reactive, ref } from 'vue'
import AgentCombobox from '~/components/agents/AgentCombobox.vue'
import { useAgentsStore } from '~/stores/agents'
import { useTransactionsStore } from '~/stores/transactions'
import type { Agent } from '~/types/agent'
import type { CreateTransactionPayload } from '~/types/transaction'

const currencyOptions = [
  { label: 'US Dollar', value: 'USD' },
  { label: 'Euro', value: 'EUR' },
  { label: 'Turkish Lira', value: 'TRY' },
  { label: 'British Pound', value: 'GBP' },
]

const agentsStore = useAgentsStore()
const transactionsStore = useTransactionsStore()

const {
  error: agentsError,
  isLoading: agentsLoading,
  items: agents,
} = storeToRefs(agentsStore)
const { error: transactionError, isLoading: transactionLoading } =
  storeToRefs(transactionsStore)

const form = reactive<CreateTransactionPayload>({
  currency: 'USD',
  listingAgentId: '',
  propertyTitle: '',
  sellingAgentId: '',
  totalServiceFee: 0,
})
const serviceFeeInput = ref('')
const localError = ref<string | null>(null)
const hasCompletedInitialLoad = ref(false)

const isSubmitting = computed(() => transactionLoading.value)
const isPageLoading = computed(
  () =>
    !hasCompletedInitialLoad.value &&
    agents.value.length === 0 &&
    !agentsError.value,
)
const formError = computed(
  () => localError.value || transactionError.value || agentsError.value,
)
const hasAgents = computed(() => agents.value.length > 0)

async function loadAgents(forceRefresh = false): Promise<void> {
  try {
    await agentsStore
      .fetchAgents({
        forceRefresh,
        limit: 10,
        page: 1,
        status: 'active',
      })
      .catch(() => undefined)
  } finally {
    hasCompletedInitialLoad.value = true
  }
}

async function submitTransaction(): Promise<void> {
  localError.value = null

  const serviceFee = Number(serviceFeeInput.value)
  const payload: CreateTransactionPayload = {
    currency: form.currency,
    listingAgentId: form.listingAgentId,
    propertyTitle: form.propertyTitle.trim(),
    sellingAgentId: form.sellingAgentId,
    totalServiceFee: serviceFee,
  }

  if (!payload.propertyTitle) {
    localError.value = 'Property title is required.'
    return
  }

  if (!payload.listingAgentId || !payload.sellingAgentId) {
    localError.value = 'Listing agent and selling agent are required.'
    return
  }

  if (!Number.isFinite(payload.totalServiceFee) || payload.totalServiceFee <= 0) {
    localError.value = 'Service fee must be greater than zero.'
    return
  }

  if (!currencyOptions.some((currency) => currency.value === payload.currency)) {
    localError.value = 'Please select a supported currency.'
    return
  }

  try {
    await transactionsStore.createTransaction(payload)
    await navigateTo('/transactions')
  } catch {
    // Store error is displayed in the form.
  }
}

async function searchActiveAgents(query: string): Promise<Agent[]> {
  return agentsStore.searchAgents({
    limit: 10,
    page: 1,
    search: query,
    status: 'active',
  })
}

function resetForm(): void {
  form.currency = 'USD'
  form.listingAgentId = ''
  form.propertyTitle = ''
  form.sellingAgentId = ''
  form.totalServiceFee = 0
  serviceFeeInput.value = ''
  localError.value = null
}

onMounted(() => {
  void loadAgents()
})
</script>

<template>
  <section class="create-transaction-page" aria-labelledby="create-title">
    <NuxtLink class="back-link" to="/transactions">
      <span aria-hidden="true">←</span>
      Back to Transactions
    </NuxtLink>

    <form class="transaction-form-card" @submit.prevent="submitTransaction">
      <h1 id="create-title">
        Create New Transaction
      </h1>

      <div v-if="formError" class="form-alert" role="alert">
        {{ formError }}
      </div>

      <div
        v-if="isPageLoading"
        class="form-skeleton"
        aria-label="Loading transaction form"
      >
        <div v-for="index in 5" :key="index" class="form-skeleton__field">
          <span class="form-skeleton__line" />
          <span class="form-skeleton__input" />
        </div>
        <div class="form-skeleton__actions">
          <span class="form-skeleton__button" />
          <span class="form-skeleton__button" />
        </div>
      </div>

      <template v-else>
        <label class="form-field">
          <span>Property Title *</span>
          <input
            v-model="form.propertyTitle"
            autocomplete="off"
            name="propertyTitle"
            placeholder="Enter property title"
            type="text"
          >
        </label>

        <AgentCombobox
          v-model="form.listingAgentId"
          :agents="agents"
          :disabled="!hasAgents"
          label="Listing Agent"
          :loading="agentsLoading"
          name="listingAgentId"
          placeholder="Select listing agent"
          :search-agents="searchActiveAgents"
        />

        <AgentCombobox
          v-model="form.sellingAgentId"
          :agents="agents"
          :disabled="!hasAgents"
          label="Selling Agent"
          :loading="agentsLoading"
          name="sellingAgentId"
          placeholder="Select selling agent"
          :search-agents="searchActiveAgents"
        />

        <label class="form-field">
          <span>Service Fee *</span>
          <input
            v-model="serviceFeeInput"
            min="0.01"
            name="totalServiceFee"
            placeholder="Enter service fee"
            step="0.01"
            type="number"
          >
        </label>

        <label class="form-field">
          <span>Currency *</span>
          <span class="select-control">
            <select
              v-model="form.currency"
              name="currency"
              aria-label="Select currency"
            >
              <option
                v-for="currency in currencyOptions"
                :key="currency.value"
                :value="currency.value"
              >
                {{ currency.value }} - {{ currency.label }}
              </option>
            </select>
            <svg class="select-chevron" viewBox="0 0 16 16" aria-hidden="true">
              <path d="m4 6 4 4 4-4" />
            </svg>
          </span>
        </label>

        <div v-if="!hasAgents" class="form-note">
          Create an agent before creating a transaction.
        </div>

        <div class="form-actions">
          <button
            class="primary-button"
            :disabled="isSubmitting || !hasAgents"
            type="submit"
          >
            {{ isSubmitting ? 'Creating...' : 'Create Transaction' }}
          </button>

          <NuxtLink class="secondary-button" to="/transactions" @click="resetForm">
            Cancel
          </NuxtLink>
        </div>
      </template>
    </form>
  </section>
</template>

<style scoped>
.create-transaction-page {
  min-height: calc(100vh - 98px);
  position: relative;
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

.transaction-form-card {
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

.transaction-form-card h1 {
  color: #111827;
  font-size: 24px;
  line-height: 1.2;
  margin: 0 0 2px;
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

.form-loading,
.form-note {
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

.form-field input,
.form-field select {
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

.form-field select {
  appearance: none;
  padding-right: 48px;
  width: 100%;
}

.form-field input:hover,
.form-field select:hover {
  background: #ffffff;
  border-color: #b8c0cc;
}

.form-field input[type='number'] {
  appearance: textfield;
  -moz-appearance: textfield;
}

.form-field input[type='number']::-webkit-inner-spin-button,
.form-field input[type='number']::-webkit-outer-spin-button {
  appearance: none;
  margin: 0;
}

.form-field input::placeholder {
  color: #9ca3af;
  font-weight: 600;
}

.form-field input:focus,
.form-field select:focus {
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgb(79 70 229 / 0.12);
}

.select-control {
  display: block;
  position: relative;
}

.select-chevron {
  color: #4f46e5;
  height: 18px;
  pointer-events: none;
  position: absolute;
  right: 18px;
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
}

.select-chevron * {
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2;
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
  .transaction-form-card {
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
