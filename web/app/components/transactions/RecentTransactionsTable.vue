<script setup lang="ts">
import type { Transaction } from '~/types/transaction'
import {
  formatAmountWithCurrency,
  formatDate,
  getAgentDisplayName,
} from '~/utils/transaction-format'
import StageBadge from './StageBadge.vue'

defineProps<{
  isLoading: boolean
  transactions: Transaction[]
}>()
</script>

<template>
  <section class="recent-transactions" aria-labelledby="recent-transactions">
    <div class="recent-transactions__header">
      <div>
        <h2 id="recent-transactions">
          Recent Transactions
        </h2>
      </div>

      <NuxtLink to="/transactions" class="recent-transactions__link">
        View all →
      </NuxtLink>
    </div>

    <div class="recent-transactions__table-wrap">
      <table class="recent-transactions__table">
        <thead>
          <tr>
            <th>Property Title</th>
            <th>Stage</th>
            <th>Listing Agent</th>
            <th>Selling Agent</th>
            <th>Fee</th>
            <th>Date</th>
          </tr>
        </thead>

        <tbody v-if="isLoading">
          <tr v-for="item in 5" :key="item">
            <td v-for="cell in 6" :key="cell">
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
              {{ getAgentDisplayName(transaction.listingAgentId) }}
            </td>
            <td>
              {{ getAgentDisplayName(transaction.sellingAgentId) }}
            </td>
            <td class="fee-cell">
              {{
                formatAmountWithCurrency(
                  transaction.totalServiceFee,
                  transaction.currency,
                )
              }}
            </td>
            <td>
              {{ formatDate(transaction.createdAt) }}
            </td>
          </tr>
        </tbody>

        <tbody v-else>
          <tr>
            <td colspan="6">
              <div class="empty-state">
                <strong>No transactions yet</strong>
                <span>Create a transaction to see recent activity here.</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<style scoped>
.recent-transactions {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgb(15 23 42 / 0.08);
  overflow: hidden;
}

.recent-transactions__header {
  align-items: center;
  display: flex;
  gap: 16px;
  justify-content: space-between;
  min-height: 74px;
  padding: 0 24px;
}

.recent-transactions__header h2 {
  color: #111827;
  font-size: 18px;
  line-height: 1.2;
  margin: 0;
}

.recent-transactions__link {
  color: #4f46e5;
  flex: 0 0 auto;
  font-size: 14px;
  font-weight: 700;
}

.recent-transactions__link:hover {
  color: #312e81;
}

.recent-transactions__table-wrap {
  overflow-x: auto;
}

.recent-transactions__table {
  border-collapse: collapse;
  min-width: 900px;
  width: 100%;
}

.recent-transactions__table th,
.recent-transactions__table td {
  border-top: 1px solid #edf0f3;
  padding: 16px 24px;
  text-align: left;
  vertical-align: middle;
}

.recent-transactions__table th {
  background: #f9fafb;
  color: #6b7280;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0;
  text-transform: uppercase;
}

.recent-transactions__table td {
  color: #4b5563;
  font-size: 14px;
}

.property-link {
  color: #111827;
  font-weight: 700;
}

.property-link:hover {
  color: #0f766e;
}

.fee-cell {
  color: #111827;
  font-weight: 700;
  white-space: nowrap;
}

.table-skeleton {
  animation: pulse 1.25s ease-in-out infinite;
  background: #e5e7eb;
  border-radius: 8px;
  display: block;
  height: 18px;
  max-width: 148px;
  width: 100%;
}

.empty-state {
  align-items: center;
  color: #6b7280;
  display: flex;
  flex-direction: column;
  gap: 6px;
  justify-content: center;
  min-height: 150px;
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

@media (max-width: 720px) {
  .recent-transactions__header {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
