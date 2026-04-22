<script setup lang="ts">
import StageBadge from '~/components/transactions/StageBadge.vue'
import { useTransactionsListPage } from '~/composables/transactions/useTransactionsListPage'

const {
  clearFilters,
  currentPage,
  dateFrom,
  dateFromInput,
  dateTo,
  dateToInput,
  emptyStateDescription,
  emptyStateTitle,
  error,
  formatAmountWithCurrency,
  formatDate,
  formatDateFilterValue,
  getAgentDisplayName,
  getAgentEditPath,
  getSortAriaSort,
  getSortButtonLabel,
  getSortIndicatorState,
  goToNextPage,
  goToPreviousPage,
  hasActiveFilters,
  hasMultiplePages,
  isLoading,
  openDatePicker,
  pagination,
  resultSummary,
  retryTransactions,
  searchQuery,
  selectedStage,
  showSkeletonRows,
  stageOptions,
  toggleSort,
  transactions,
} = useTransactionsListPage()
</script>

<template>
  <section class="transactions-page" aria-labelledby="transactions-title">
    <header class="transactions-header">
      <div>
        <h1 id="transactions-title">Transactions</h1>
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

      <button type="button" @click="retryTransactions">Retry</button>
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
        />
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

      <div
        class="date-field"
        role="button"
        tabindex="0"
        @click="openDatePicker(dateFromInput)"
        @keydown.enter.prevent="openDatePicker(dateFromInput)"
        @keydown.space.prevent="openDatePicker(dateFromInput)"
      >
        <input
          ref="dateFromInput"
          v-model="dateFrom"
          type="date"
          :max="dateTo || undefined"
          aria-label="Filter transactions from date"
          tabindex="-1"
        />
        <span class="date-field-copy" aria-hidden="true">
          <span class="date-field-label">From</span>
          <span class="date-field-value" :class="{ 'is-empty': !dateFrom }">
            {{ formatDateFilterValue(dateFrom) }}
          </span>
        </span>
        <svg class="date-field-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M7 3.75v3" />
          <path d="M17 3.75v3" />
          <path d="M4.75 9.25h14.5" />
          <path
            d="M6.75 5.25h10.5a2 2 0 0 1 2 2v9.5a2 2 0 0 1-2 2H6.75a2 2 0 0 1-2-2v-9.5a2 2 0 0 1 2-2z"
          />
        </svg>
      </div>

      <div
        class="date-field"
        role="button"
        tabindex="0"
        @click="openDatePicker(dateToInput)"
        @keydown.enter.prevent="openDatePicker(dateToInput)"
        @keydown.space.prevent="openDatePicker(dateToInput)"
      >
        <input
          ref="dateToInput"
          v-model="dateTo"
          type="date"
          :min="dateFrom || undefined"
          aria-label="Filter transactions to date"
          tabindex="-1"
        />
        <span class="date-field-copy" aria-hidden="true">
          <span class="date-field-label">To</span>
          <span class="date-field-value" :class="{ 'is-empty': !dateTo }">
            {{ formatDateFilterValue(dateTo) }}
          </span>
        </span>
        <svg class="date-field-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M7 3.75v3" />
          <path d="M17 3.75v3" />
          <path d="M4.75 9.25h14.5" />
          <path
            d="M6.75 5.25h10.5a2 2 0 0 1 2 2v9.5a2 2 0 0 1-2 2H6.75a2 2 0 0 1-2-2v-9.5a2 2 0 0 1 2-2z"
          />
        </svg>
      </div>

      <button
        v-if="hasActiveFilters"
        class="clear-filters-button"
        type="button"
        @click="clearFilters"
      >
        Clear filters
      </button>

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
              <th :aria-sort="getSortAriaSort('totalServiceFee')">
                <button
                  class="sort-header-button"
                  type="button"
                  :aria-label="getSortButtonLabel('totalServiceFee')"
                  @click="toggleSort('totalServiceFee')"
                >
                  <span>Service Fee</span>
                  <svg
                    class="sort-indicator"
                    :class="`is-${getSortIndicatorState('totalServiceFee')}`"
                    viewBox="0 0 16 16"
                    aria-hidden="true"
                  >
                    <path
                      class="sort-chevron-up"
                      d="m4.5 9.25 3.5-3.5 3.5 3.5"
                    />
                    <path
                      class="sort-chevron-down"
                      d="m4.5 6.75 3.5 3.5 3.5-3.5"
                    />
                  </svg>
                </button>
              </th>
              <th :aria-sort="getSortAriaSort('createdAt')">
                <button
                  class="sort-header-button"
                  type="button"
                  :aria-label="getSortButtonLabel('createdAt')"
                  @click="toggleSort('createdAt')"
                >
                  <span>Created Date</span>
                  <svg
                    class="sort-indicator"
                    :class="`is-${getSortIndicatorState('createdAt')}`"
                    viewBox="0 0 16 16"
                    aria-hidden="true"
                  >
                    <path
                      class="sort-chevron-up"
                      d="m4.5 9.25 3.5-3.5 3.5 3.5"
                    />
                    <path
                      class="sort-chevron-down"
                      d="m4.5 6.75 3.5 3.5 3.5-3.5"
                    />
                  </svg>
                </button>
              </th>
              <th :aria-sort="getSortAriaSort('updatedAt')">
                <button
                  class="sort-header-button"
                  type="button"
                  :aria-label="getSortButtonLabel('updatedAt')"
                  @click="toggleSort('updatedAt')"
                >
                  <span>Last Update</span>
                  <svg
                    class="sort-indicator"
                    :class="`is-${getSortIndicatorState('updatedAt')}`"
                    viewBox="0 0 16 16"
                    aria-hidden="true"
                  >
                    <path
                      class="sort-chevron-up"
                      d="m4.5 9.25 3.5-3.5 3.5 3.5"
                    />
                    <path
                      class="sort-chevron-down"
                      d="m4.5 6.75 3.5 3.5 3.5-3.5"
                    />
                  </svg>
                </button>
              </th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody v-if="showSkeletonRows">
            <tr v-for="row in 8" :key="row">
              <td v-for="cell in 8" :key="cell">
                <span class="table-skeleton" />
              </td>
            </tr>
          </tbody>

          <tbody v-else-if="transactions.length > 0">
            <tr v-for="transaction in transactions" :key="transaction._id">
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
              <td>
                <NuxtLink
                  v-if="getAgentEditPath(transaction.listingAgentId)"
                  class="agent-link"
                  :to="getAgentEditPath(transaction.listingAgentId) || '/'"
                >
                  {{ getAgentDisplayName(transaction.listingAgentId) }}
                </NuxtLink>
                <span v-else>
                  {{ getAgentDisplayName(transaction.listingAgentId) }}
                </span>
              </td>
              <td>
                <NuxtLink
                  v-if="getAgentEditPath(transaction.sellingAgentId)"
                  class="agent-link"
                  :to="getAgentEditPath(transaction.sellingAgentId) || '/'"
                >
                  {{ getAgentDisplayName(transaction.sellingAgentId) }}
                </NuxtLink>
                <span v-else>
                  {{ getAgentDisplayName(transaction.sellingAgentId) }}
                </span>
              </td>
              <td class="fee-cell">
                {{
                  formatAmountWithCurrency(
                    transaction.totalServiceFee,
                    transaction.currency,
                  )
                }}
              </td>
              <td>{{ formatDate(transaction.createdAt) }}</td>
              <td>{{ formatDate(transaction.updatedAt) }}</td>
              <td>
                <NuxtLink
                  class="details-link"
                  :to="`/transactions/${transaction._id}`"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M2.75 12s3.5-5.75 9.25-5.75S21.25 12 21.25 12 17.75 17.75 12 17.75 2.75 12 2.75 12z"
                    />
                    <circle cx="12" cy="12" r="2.5" />
                  </svg>
                  View Details
                </NuxtLink>
              </td>
            </tr>
          </tbody>

          <tbody v-else>
            <tr>
              <td colspan="8">
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

        <span> Page {{ pagination.page }} of {{ pagination.totalPages }} </span>

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
  gap: 24px;
}

.transactions-header {
  align-items: flex-start;
  display: flex;
  gap: 24px;
  justify-content: space-between;
}

.transactions-header h1 {
  color: #111827;
  font-size: 36px;
  line-height: 1.1;
  margin: 0;
}

.transactions-header p {
  color: #4b5563;
  font-size: 17px;
  font-weight: 500;
  margin: 10px 0 0;
}

.create-button {
  align-items: center;
  background: #4f46e5;
  border-radius: 8px;
  box-shadow: 0 3px 6px rgb(79 70 229 / 0.26);
  color: #ffffff;
  display: inline-flex;
  flex: 0 0 auto;
  font-size: 15px;
  font-weight: 800;
  gap: 10px;
  min-height: 44px;
  padding: 0 20px;
}

.create-button:hover {
  background: #4338ca;
}

.create-button span {
  font-size: 24px;
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
  gap: 14px 16px;
  grid-template-columns:
    minmax(260px, 1.35fr)
    minmax(180px, 0.8fr)
    minmax(150px, 0.55fr)
    minmax(150px, 0.55fr)
    auto;
  padding: 22px 24px;
}

.transactions-toolbar p {
  color: #4b5563;
  font-size: 14px;
  font-weight: 600;
  grid-column: 1 / -1;
  margin: 0;
}

.search-field {
  align-items: center;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  display: flex;
  gap: 10px;
  min-height: 44px;
  padding: 0 14px;
}

.search-field svg {
  color: #9ca3af;
  flex: 0 0 auto;
  height: 21px;
  width: 21px;
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
  font-size: 15px;
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
  font-size: 15px;
  min-height: 44px;
  outline: 0;
  padding: 0 16px;
}

.date-field {
  align-items: center;
  background: #ffffff;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  display: flex;
  gap: 10px;
  min-height: 44px;
  padding: 0 12px 0 14px;
  position: relative;
  transition:
    border-color 160ms ease,
    box-shadow 160ms ease,
    background-color 160ms ease;
}

.date-field:hover {
  background: #f9fafb;
  border-color: #b8c0cc;
}

.date-field input {
  appearance: none;
  cursor: pointer;
  inset: 0;
  opacity: 0;
  position: absolute;
  width: 100%;
}

.date-field input::-webkit-calendar-picker-indicator {
  cursor: pointer;
}

.date-field-copy {
  display: grid;
  flex: 1;
  gap: 2px;
  min-width: 0;
  pointer-events: none;
}

.date-field-label {
  color: #6b7280;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.02em;
  line-height: 1;
  text-transform: uppercase;
}

.date-field-value {
  color: #111827;
  font-size: 15px;
  font-weight: 800;
  line-height: 1.25;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.date-field-value.is-empty {
  color: #9ca3af;
  font-weight: 700;
}

.date-field-icon {
  color: #4f46e5;
  flex: 0 0 auto;
  height: 20px;
  pointer-events: none;
  width: 20px;
}

.date-field-icon * {
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2;
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
  min-height: 44px;
  padding: 0 14px;
  white-space: nowrap;
}

.clear-filters-button:hover {
  border-color: #4f46e5;
  color: #4f46e5;
}

.search-field:focus-within,
.stage-select:focus,
.date-field:focus-within,
.date-field:focus,
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
  min-width: 1320px;
  width: 100%;
}

.transactions-table th,
.transactions-table td {
  border-top: 1px solid #edf0f3;
  padding: 16px 24px;
  text-align: left;
  vertical-align: middle;
}

.transactions-table thead tr:first-child th {
  border-top: 0;
}

.transactions-table th {
  background: #f9fafb;
  color: #6b7280;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.sort-header-button {
  align-items: center;
  background: transparent;
  border: 0;
  color: inherit;
  cursor: pointer;
  display: inline-flex;
  font: inherit;
  gap: 8px;
  letter-spacing: inherit;
  padding: 0;
  text-align: left;
  text-transform: inherit;
}

.sort-header-button:hover {
  color: #4f46e5;
}

.sort-header-button:focus-visible {
  border-radius: 8px;
  box-shadow: 0 0 0 3px rgb(79 70 229 / 0.14);
  outline: 0;
}

.sort-indicator {
  color: #9ca3af;
  flex: 0 0 auto;
  height: 16px;
  width: 16px;
}

.sort-indicator * {
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2;
}

.sort-indicator.is-neutral .sort-chevron-up,
.sort-indicator.is-neutral .sort-chevron-down {
  opacity: 0.45;
}

.sort-indicator.is-ascending,
.sort-indicator.is-descending {
  color: #4f46e5;
}

.sort-indicator.is-ascending .sort-chevron-down,
.sort-indicator.is-descending .sort-chevron-up {
  opacity: 0.2;
}

.transactions-table td {
  color: #374151;
  font-size: 14px;
}

.property-link {
  color: #111827;
  font-weight: 800;
}

.property-link:hover {
  color: #4f46e5;
}

.agent-link {
  color: #374151;
  font-weight: 700;
}

.agent-link:hover {
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
  min-height: 58px;
  padding: 0 24px;
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
