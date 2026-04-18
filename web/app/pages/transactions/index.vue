<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, onMounted, ref, watch } from 'vue'
import StageBadge from '~/components/transactions/StageBadge.vue'
import { useTransactionsStore } from '~/stores/transactions'
import type { TransactionStage } from '~/types/transaction'
import {
  formatAmountWithCurrency,
  formatDate,
  getAgentDisplayName,
} from '~/utils/transaction-format'

const stageOptions: Array<{ label: string; value: TransactionStage | 'all' }> = [
  { label: 'All Stages', value: 'all' },
  { label: 'Agreement', value: 'agreement' },
  { label: 'Earnest Money', value: 'earnest_money' },
  { label: 'Title Deed', value: 'title_deed' },
  { label: 'Completed', value: 'completed' },
]

const transactionsStore = useTransactionsStore()
const {
  error,
  isLoading,
  items: transactions,
  pagination,
} = storeToRefs(transactionsStore)

const searchQuery = ref('')
const selectedStage = ref<TransactionStage | 'all'>('all')
const dateFrom = ref('')
const dateTo = ref('')
const currentPage = ref(1)
const pageSize = 10

let searchDebounce: ReturnType<typeof setTimeout> | null = null

const normalizedSearchQuery = computed(() =>
  searchQuery.value.trim().toLowerCase(),
)
const hasActiveFilters = computed(
  () =>
    normalizedSearchQuery.value.length > 0 ||
    selectedStage.value !== 'all' ||
    dateFrom.value.length > 0 ||
    dateTo.value.length > 0,
)
const resultSummary = computed(() => {
  if (pagination.value.totalItems === 0) {
    return 'Showing 0 of 0 transactions'
  }

  const startItem = (pagination.value.page - 1) * pagination.value.limit + 1
  const endItem = startItem + transactions.value.length - 1

  return `Showing ${startItem}-${endItem} of ${pagination.value.totalItems} transactions`
})
const loadedSummary = computed(() => {
  if (!hasActiveFilters.value) {
    return ''
  }

  return 'Filtered by the transaction API'
})
const showSkeletonRows = computed(
  () => isLoading.value && transactions.value.length === 0,
)
const hasMultiplePages = computed(() => pagination.value.totalPages > 1)
const emptyStateTitle = computed(() =>
  hasActiveFilters.value
    ? 'No transactions match your current filters'
    : 'No transactions yet',
)
const emptyStateDescription = computed(() =>
  hasActiveFilters.value
    ? 'Adjust the search text or stage filter to widen the result set.'
    : 'Create a transaction to start tracking lifecycle and commission activity.',
)

async function loadTransactions(forceRefresh = false): Promise<void> {
  await transactionsStore
    .fetchTransactions({
      forceRefresh,
      dateFrom: dateFrom.value || undefined,
      dateTo: dateTo.value || undefined,
      limit: pageSize,
      page: currentPage.value,
      search: normalizedSearchQuery.value || undefined,
      stage: selectedStage.value === 'all' ? undefined : selectedStage.value,
    })
    .catch(() => undefined)
}

async function retryTransactions(): Promise<void> {
  await loadTransactions(true)
}

function goToPreviousPage(): void {
  if (!pagination.value.hasPreviousPage || isLoading.value) {
    return
  }

  currentPage.value -= 1
}

function goToNextPage(): void {
  if (!pagination.value.hasNextPage || isLoading.value) {
    return
  }

  currentPage.value += 1
}

function clearFilters(): void {
  searchQuery.value = ''
  selectedStage.value = 'all'
  dateFrom.value = ''
  dateTo.value = ''
  resetToFirstPageAndLoad()
}

onMounted(() => {
  void loadTransactions()
})

watch(searchQuery, () => {
  if (searchDebounce) {
    clearTimeout(searchDebounce)
  }

  searchDebounce = setTimeout(() => {
    resetToFirstPageAndLoad()
  }, 300)
})

watch([selectedStage, dateFrom, dateTo], () => {
  resetToFirstPageAndLoad()
})

watch(currentPage, () => {
  void loadTransactions()
})

function resetToFirstPageAndLoad(): void {
  if (currentPage.value === 1) {
    void loadTransactions()
    return
  }

  currentPage.value = 1
}
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
          placeholder="Search property or currency..."
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

      <label class="date-field">
        <span>From</span>
        <input
          v-model="dateFrom"
          type="date"
          aria-label="Filter transactions from date"
        >
      </label>

      <label class="date-field">
        <span>To</span>
        <input
          v-model="dateTo"
          type="date"
          aria-label="Filter transactions to date"
        >
      </label>

      <button
        v-if="hasActiveFilters"
        class="clear-filters-button"
        type="button"
        @click="clearFilters"
      >
        Clear filters
      </button>

      <p>{{ resultSummary }}</p>
      <span v-if="loadedSummary" class="loaded-summary">
        {{ loadedSummary }}
      </span>
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

          <tbody v-else-if="transactions.length > 0">
            <tr
              v-for="transaction in transactions"
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
                  <strong>{{ emptyStateTitle }}</strong>
                  <span>{{ emptyStateDescription }}</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <footer v-if="hasMultiplePages" class="pagination-bar">
        <button
          type="button"
          :disabled="!pagination.hasPreviousPage || isLoading"
          @click="goToPreviousPage"
        >
          Previous
        </button>

        <span>
          Page {{ pagination.page }} of {{ pagination.totalPages }}
        </span>

        <button
          type="button"
          :disabled="!pagination.hasNextPage || isLoading"
          @click="goToNextPage"
        >
          Next
        </button>
      </footer>
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
  grid-template-columns:
    minmax(260px, 1.35fr)
    minmax(180px, 0.8fr)
    minmax(150px, 0.55fr)
    minmax(150px, 0.55fr)
    auto;
  padding: 32px;
}

.transactions-toolbar p {
  color: #4b5563;
  font-size: 16px;
  font-weight: 600;
  grid-column: 1 / -1;
  margin: 0;
}

.loaded-summary {
  color: #6b7280;
  font-size: 14px;
  font-weight: 600;
  grid-column: 1 / -1;
  margin-top: -10px;
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

.date-field {
  align-items: center;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  display: flex;
  gap: 10px;
  min-height: 50px;
  padding: 0 14px;
}

.date-field span {
  color: #6b7280;
  font-size: 14px;
  font-weight: 800;
}

.date-field input {
  border: 0;
  color: #111827;
  flex: 1;
  font: inherit;
  font-size: 15px;
  min-width: 0;
  outline: 0;
}

.clear-filters-button {
  align-items: center;
  background: #ffffff;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  color: #374151;
  cursor: pointer;
  display: inline-flex;
  font: inherit;
  font-size: 14px;
  font-weight: 800;
  justify-content: center;
  min-height: 50px;
  padding: 0 16px;
  white-space: nowrap;
}

.clear-filters-button:hover {
  border-color: #4f46e5;
  color: #4f46e5;
}

.search-field:focus-within,
.stage-select:focus,
.date-field:focus-within,
.clear-filters-button:focus {
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

.pagination-bar {
  align-items: center;
  border-top: 1px solid #edf0f3;
  display: flex;
  gap: 16px;
  justify-content: flex-end;
  min-height: 68px;
  padding: 0 32px;
}

.pagination-bar span {
  color: #4b5563;
  font-size: 14px;
  font-weight: 700;
}

.pagination-bar button {
  background: #ffffff;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  color: #111827;
  cursor: pointer;
  font: inherit;
  font-size: 14px;
  font-weight: 800;
  min-height: 38px;
  padding: 0 14px;
}

.pagination-bar button:hover:not(:disabled) {
  border-color: #4f46e5;
  color: #4f46e5;
}

.pagination-bar button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
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

  .pagination-bar {
    align-items: stretch;
    flex-direction: column;
    padding: 18px 22px;
  }
}
</style>
