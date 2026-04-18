<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, onMounted, ref } from 'vue'
import StageBadge from '~/components/transactions/StageBadge.vue'
import { useTransactionsStore } from '~/stores/transactions'
import type { Transaction, TransactionStage } from '~/types/transaction'
import {
  formatAmountWithCurrency,
  formatDate,
  getAgentDisplayName,
  getTransactionStageLabel,
} from '~/utils/transaction-format'

const stageOptions: Array<{ label: string; value: TransactionStage | 'all' }> = [
  { label: 'All Stages', value: 'all' },
  { label: 'Agreement', value: 'agreement' },
  { label: 'Earnest Money', value: 'earnest_money' },
  { label: 'Title Deed', value: 'title_deed' },
  { label: 'Completed', value: 'completed' },
]

const transactionsStore = useTransactionsStore()
const { error, isLoading, items: transactions } = storeToRefs(transactionsStore)

const searchQuery = ref('')
const selectedStage = ref<TransactionStage | 'all'>('all')

const filteredTransactions = computed(() => {
  const normalizedQuery = searchQuery.value.trim().toLowerCase()

  return transactions.value.filter((transaction) => {
    const matchesStage =
      selectedStage.value === 'all' || transaction.stage === selectedStage.value

    if (!matchesStage) {
      return false
    }

    if (!normalizedQuery) {
      return true
    }

    return getSearchableTransactionText(transaction).includes(normalizedQuery)
  })
})

const resultSummary = computed(
  () =>
    `Showing ${filteredTransactions.value.length} of ${transactions.value.length} transaction${
      transactions.value.length === 1 ? '' : 's'
    }`,
)
const showSkeletonRows = computed(
  () => isLoading.value && transactions.value.length === 0,
)

async function loadTransactions(forceRefresh = false): Promise<void> {
  await transactionsStore.fetchTransactions(forceRefresh).catch(() => undefined)
}

async function retryTransactions(): Promise<void> {
  await loadTransactions(true)
}

function getSearchableTransactionText(transaction: Transaction): string {
  return [
    transaction.propertyTitle,
    getTransactionStageLabel(transaction.stage),
    getAgentDisplayName(transaction.listingAgentId),
    getAgentDisplayName(transaction.sellingAgentId),
    transaction.currency,
    String(transaction.totalServiceFee),
  ]
    .join(' ')
    .toLowerCase()
}

onMounted(() => {
  void loadTransactions()
})
</script>

<template>
  <section class="transactions-page" aria-labelledby="transactions-title">
    <header class="transactions-header">
      <div>
        <h1 id="transactions-title">
          Transactions
        </h1>
        <p>Manage all real estate transactions</p>
      </div>

      <NuxtLink class="create-button" to="/transactions/create">
        <span aria-hidden="true">+</span>
        Create Transaction
      </NuxtLink>
    </header>

    <div v-if="error" class="transactions-alert" role="alert">
      <div>
        <strong>Could not load transactions</strong>
        <p>{{ error }}</p>
      </div>

      <button type="button" @click="retryTransactions">
        Retry
      </button>
    </div>

    <section class="transactions-toolbar" aria-label="Transaction filters">
      <div class="search-field">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="m16.5 16.5 3.5 3.5" />
        </svg>
        <input
          v-model="searchQuery"
          type="search"
          placeholder="Search transactions..."
          aria-label="Search transactions"
        >
      </div>

      <select
        v-model="selectedStage"
        class="stage-select"
        aria-label="Filter transactions by stage"
      >
        <option
          v-for="stageOption in stageOptions"
          :key="stageOption.value"
          :value="stageOption.value"
        >
          {{ stageOption.label }}
        </option>
      </select>

      <p>{{ resultSummary }}</p>
    </section>

    <section class="transactions-table-card" aria-label="Transactions">
      <div class="transactions-table-wrap">
        <table class="transactions-table">
          <thead>
            <tr>
              <th>Property Title</th>
              <th>Stage</th>
              <th>Listing Agent</th>
              <th>Selling Agent</th>
              <th>Service Fee</th>
              <th>Created Date</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody v-if="showSkeletonRows">
            <tr v-for="row in 8" :key="row">
              <td v-for="cell in 7" :key="cell">
                <span class="table-skeleton" />
              </td>
            </tr>
          </tbody>

          <tbody v-else-if="filteredTransactions.length > 0">
            <tr
              v-for="transaction in filteredTransactions"
              :key="transaction._id"
            >
              <td>
                <NuxtLink
                  class="property-link"
                  :to="`/transactions/${transaction._id}`"
                >
                  {{ transaction.propertyTitle }}
                </NuxtLink>
              </td>
              <td>
                <StageBadge :stage="transaction.stage" />
              </td>
              <td>{{ getAgentDisplayName(transaction.listingAgentId) }}</td>
              <td>{{ getAgentDisplayName(transaction.sellingAgentId) }}</td>
              <td class="fee-cell">
                {{
                  formatAmountWithCurrency(
                    transaction.totalServiceFee,
                    transaction.currency,
                  )
                }}
              </td>
              <td>{{ formatDate(transaction.createdAt) }}</td>
              <td>
                <NuxtLink
                  class="details-link"
                  :to="`/transactions/${transaction._id}`"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M2.75 12s3.5-5.75 9.25-5.75S21.25 12 21.25 12 17.75 17.75 12 17.75 2.75 12 2.75 12z" />
                    <circle cx="12" cy="12" r="2.5" />
                  </svg>
                  View Details
                </NuxtLink>
              </td>
            </tr>
          </tbody>

          <tbody v-else>
            <tr>
              <td colspan="7">
                <div class="empty-state">
                  <strong>No transactions found</strong>
                  <span>
                    Try another search or create a new transaction.
                  </span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </section>
</template>

<style scoped>
.transactions-page {
  display: grid;
  gap: 32px;
}

.transactions-header {
  align-items: flex-start;
  display: flex;
  gap: 24px;
  justify-content: space-between;
}

.transactions-header h1 {
  color: #111827;
  font-size: 42px;
  line-height: 1.1;
  margin: 0;
}

.transactions-header p {
  color: #4b5563;
  font-size: 20px;
  font-weight: 500;
  margin: 14px 0 0;
}

.create-button {
  align-items: center;
  background: #4f46e5;
  border-radius: 8px;
  box-shadow: 0 3px 6px rgb(79 70 229 / 0.26);
  color: #ffffff;
  display: inline-flex;
  flex: 0 0 auto;
  font-size: 16px;
  font-weight: 800;
  gap: 10px;
  min-height: 52px;
  padding: 0 26px;
}

.create-button:hover {
  background: #4338ca;
}

.create-button span {
  font-size: 28px;
  font-weight: 400;
  line-height: 1;
  margin-top: -2px;
}

.transactions-alert {
  align-items: center;
  background: #fff7ed;
  border: 1px solid #fed7aa;
  border-radius: 8px;
  color: #9a3412;
  display: flex;
  gap: 16px;
  justify-content: space-between;
  padding: 16px 18px;
}

.transactions-alert strong {
  color: #7c2d12;
  display: block;
  font-size: 14px;
}

.transactions-alert p {
  font-size: 14px;
  margin: 4px 0 0;
}

.transactions-alert button {
  background: #ffffff;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  color: #111827;
  cursor: pointer;
  font-size: 14px;
  font-weight: 700;
  padding: 10px 14px;
}

.transactions-alert button:hover {
  border-color: #4f46e5;
  color: #4f46e5;
}

.transactions-toolbar {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgb(15 23 42 / 0.08);
  display: grid;
  gap: 18px 22px;
  grid-template-columns: minmax(260px, 1fr) minmax(220px, 1fr);
  padding: 32px;
}

.transactions-toolbar p {
  color: #4b5563;
  font-size: 16px;
  font-weight: 600;
  grid-column: 1 / -1;
  margin: 0;
}

.search-field {
  align-items: center;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  display: flex;
  gap: 12px;
  min-height: 50px;
  padding: 0 16px;
}

.search-field svg {
  color: #9ca3af;
  flex: 0 0 auto;
  height: 24px;
  width: 24px;
}

.search-field svg * {
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2;
}

.search-field input {
  border: 0;
  color: #111827;
  flex: 1;
  font: inherit;
  font-size: 17px;
  min-width: 0;
  outline: 0;
}

.search-field input::placeholder {
  color: #6b7280;
}

.stage-select {
  appearance: auto;
  background: #ffffff;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  color: #111827;
  font: inherit;
  font-size: 17px;
  min-height: 50px;
  outline: 0;
  padding: 0 16px;
}

.search-field:focus-within,
.stage-select:focus {
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgb(79 70 229 / 0.12);
}

.transactions-table-card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgb(15 23 42 / 0.08);
  overflow: hidden;
}

.transactions-table-wrap {
  overflow-x: auto;
}

.transactions-table {
  border-collapse: collapse;
  min-width: 1180px;
  width: 100%;
}

.transactions-table th,
.transactions-table td {
  border-top: 1px solid #edf0f3;
  padding: 20px 32px;
  text-align: left;
  vertical-align: middle;
}

.transactions-table thead tr:first-child th {
  border-top: 0;
}

.transactions-table th {
  background: #f9fafb;
  color: #6b7280;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.transactions-table td {
  color: #374151;
  font-size: 15px;
}

.property-link {
  color: #111827;
  font-weight: 800;
}

.property-link:hover {
  color: #4f46e5;
}

.fee-cell {
  color: #111827;
  font-weight: 800;
  white-space: nowrap;
}

.details-link {
  align-items: center;
  color: #4f46e5;
  display: inline-flex;
  font-weight: 800;
  gap: 8px;
  white-space: nowrap;
}

.details-link:hover {
  color: #312e81;
}

.details-link svg {
  height: 18px;
  width: 18px;
}

.details-link svg * {
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2;
}

.table-skeleton {
  animation: pulse 1.25s ease-in-out infinite;
  background: #e5e7eb;
  border-radius: 8px;
  display: block;
  height: 18px;
  max-width: 150px;
  width: 100%;
}

.empty-state {
  align-items: center;
  color: #6b7280;
  display: flex;
  flex-direction: column;
  gap: 8px;
  justify-content: center;
  min-height: 168px;
  text-align: center;
}

.empty-state strong {
  color: #111827;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 0.65;
  }

  50% {
    opacity: 1;
  }
}

@media (max-width: 900px) {
  .transactions-header {
    flex-direction: column;
  }

  .transactions-toolbar {
    grid-template-columns: 1fr;
    padding: 22px;
  }
}

@media (max-width: 720px) {
  .transactions-header h1 {
    font-size: 34px;
  }

  .transactions-header p {
    font-size: 17px;
  }

  .create-button {
    justify-content: center;
    width: 100%;
  }

  .transactions-alert {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
