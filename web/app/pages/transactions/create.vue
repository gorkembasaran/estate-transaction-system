<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, onMounted, reactive, ref } from 'vue'
import { useAgentsStore } from '~/stores/agents'
import { useTransactionsStore } from '~/stores/transactions'
import type { CreateTransactionPayload } from '~/types/transaction'

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

const isSubmitting = computed(() => transactionLoading.value)
const isPageLoading = computed(() => agentsLoading.value && agents.value.length === 0)
const formError = computed(
  () => localError.value || transactionError.value || agentsError.value,
)
const hasAgents = computed(() => agents.value.length > 0)

async function loadAgents(forceRefresh = false): Promise<void> {
  await agentsStore.fetchAgents(forceRefresh).catch(() => undefined)
}

async function submitTransaction(): Promise<void> {
  localError.value = null

  const serviceFee = Number(serviceFeeInput.value)
  const payload: CreateTransactionPayload = {
    currency: form.currency.trim().toUpperCase(),
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

  if (payload.currency.length !== 3) {
    localError.value = 'Currency must use a 3-letter code.'
    return
  }

  try {
    await transactionsStore.createTransaction(payload)
    await navigateTo('/transactions')
  } catch {
    // Store error is displayed in the form.
  }
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

      <div v-if="isPageLoading" class="form-loading">
        Loading agents...
      </div>

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

      <label class="form-field">
        <span>Listing Agent *</span>
        <select v-model="form.listingAgentId" name="listingAgentId">
          <option value="" disabled>
            Select listing agent
          </option>
          <option v-for="agent in agents" :key="agent._id" :value="agent._id">
            {{ agent.fullName }}
          </option>
        </select>
      </label>

      <label class="form-field">
        <span>Selling Agent *</span>
        <select v-model="form.sellingAgentId" name="sellingAgentId">
          <option value="" disabled>
            Select selling agent
          </option>
          <option v-for="agent in agents" :key="agent._id" :value="agent._id">
            {{ agent.fullName }}
          </option>
        </select>
      </label>

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
        <input
          v-model="form.currency"
          autocomplete="off"
          maxlength="3"
          name="currency"
          placeholder="USD"
          type="text"
          @blur="form.currency = form.currency.trim().toUpperCase()"
        >
      </label>

      <div v-if="!isPageLoading && !hasAgents" class="form-note">
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
  box-shadow: 0 2px 5px rgb(15 23 42 / 0.08);
  display: grid;
  gap: 20px;
  margin: 0 auto;
  max-width: 548px;
  padding: 32px;
}

.transaction-form-card h1 {
  color: #111827;
  font-size: 24px;
  line-height: 1.2;
  margin: 0 0 4px;
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
  background: #ffffff;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  color: #111827;
  font: inherit;
  font-size: 15px;
  min-height: 42px;
  outline: 0;
  padding: 0 14px;
}

.form-field select {
  appearance: auto;
}

.form-field input::placeholder {
  color: #9ca3af;
}

.form-field input:focus,
.form-field select:focus {
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgb(79 70 229 / 0.12);
}

.form-actions {
  display: grid;
  gap: 10px;
  grid-template-columns: minmax(0, 1fr) 82px;
  margin-top: 12px;
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
  min-height: 44px;
  padding: 0 18px;
}

.primary-button {
  background: #4f46e5;
  border: 1px solid #4f46e5;
  color: #ffffff;
  cursor: pointer;
}

.primary-button:hover:not(:disabled) {
  background: #4338ca;
}

.primary-button:disabled {
  cursor: not-allowed;
  opacity: 0.62;
}

.secondary-button {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  color: #374151;
}

.secondary-button:hover {
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
