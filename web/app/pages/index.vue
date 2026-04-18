<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, onMounted } from 'vue'
import RecentTransactionsTable from '~/components/transactions/RecentTransactionsTable.vue'
import DashboardStatCard from '~/components/ui/DashboardStatCard.vue'
import { useAgentsStore } from '~/stores/agents'
import { useTransactionsStore } from '~/stores/transactions'
import {
  getCompletedRevenueSummary,
  getCompletedTransactionsTrendSummary,
} from '~/utils/transaction-format'

const agentsStore = useAgentsStore()
const transactionsStore = useTransactionsStore()

const {
  error: agentsError,
  isLoading: agentsLoading,
  items: agents,
} = storeToRefs(agentsStore)
const {
  error: transactionsError,
  isLoading: transactionsLoading,
  items: transactions,
} = storeToRefs(transactionsStore)

const totalTransactions = computed(() => transactions.value.length)
const completedTransactions = computed(
  () =>
    transactions.value.filter((transaction) => transaction.stage === 'completed')
      .length,
)
const activeTransactions = computed(
  () => totalTransactions.value - completedTransactions.value,
)
const successRate = computed(() => {
  if (totalTransactions.value === 0) {
    return 0
  }

  return Math.round(
    (completedTransactions.value / totalTransactions.value) * 100,
  )
})
const revenueSummary = computed(() =>
  getCompletedRevenueSummary(transactions.value),
)
const completedTransactionsTrend = computed(() =>
  getCompletedTransactionsTrendSummary(transactions.value),
)
const completedTransactionsSupportingLabel = computed(
  () =>
    `${completedTransactions.value} of ${totalTransactions.value} transactions completed`,
)
const recentTransactions = computed(() => transactions.value.slice(0, 5))
const isLoading = computed(
  () => agentsLoading.value || transactionsLoading.value,
)
const hasAnyData = computed(
  () => agents.value.length > 0 || transactions.value.length > 0,
)
const showSkeletons = computed(() => isLoading.value && !hasAnyData.value)
const errorMessage = computed(
  () => transactionsError.value || agentsError.value,
)

async function loadDashboard(forceRefresh = false): Promise<void> {
  const results = await Promise.allSettled([
    transactionsStore.fetchTransactions(forceRefresh),
    agentsStore.fetchAgents(forceRefresh),
  ])

  const rejectedResult = results.find((result) => result.status === 'rejected')

  if (rejectedResult?.status === 'rejected') {
    throw rejectedResult.reason
  }
}

async function retryDashboard(): Promise<void> {
  await loadDashboard(true).catch(() => undefined)
}

onMounted(() => {
  void loadDashboard().catch(() => undefined)
})
</script>

<template>
  <section class="dashboard-page" aria-labelledby="dashboard-title">
    <div class="dashboard-header">
      <div>
        <h1 id="dashboard-title">
          Dashboard
        </h1>
        <p>Overview of your estate transactions</p>
      </div>
    </div>

    <div v-if="errorMessage" class="dashboard-alert" role="alert">
      <div>
        <strong>Could not load dashboard data</strong>
        <p>{{ errorMessage }}</p>
      </div>

      <button type="button" @click="retryDashboard">
        Retry
      </button>
    </div>

    <div class="dashboard-grid dashboard-grid--summary">
      <DashboardStatCard
        icon="document"
        :is-loading="showSkeletons"
        label="Total Transactions"
        supporting-label="All time"
        :value="totalTransactions"
      />

      <DashboardStatCard
        :corner-metric="completedTransactionsTrend?.label"
        :corner-metric-tone="completedTransactionsTrend?.tone"
        icon="check"
        :is-loading="showSkeletons"
        label="Completed Transactions"
        supporting-label="Closed transactions"
        tone="success"
        :value="completedTransactions"
      />

      <DashboardStatCard
        icon="clock"
        :is-loading="showSkeletons"
        label="Active Transactions"
        supporting-label="Not yet completed"
        tone="warning"
        :value="activeTransactions"
      />

      <DashboardStatCard
        icon="users"
        :is-loading="showSkeletons"
        label="Active Agents"
        supporting-label="Available agents"
        :value="agents.length"
      />
    </div>

    <div class="dashboard-grid dashboard-grid--financial">
      <DashboardStatCard
        class="dashboard-revenue-card"
        icon="dollar"
        :is-loading="showSkeletons"
        label="Total Revenue"
        :corner-metric="
          revenueSummary.hasMultipleCurrencies ? 'Mixed currencies' : undefined
        "
        corner-metric-tone="neutral"
        :supporting-label="revenueSummary.supportingLabel"
        tone="accent"
        :value="revenueSummary.value"
      >
        <ul
          v-if="revenueSummary.currencyTotals.length > 1"
          class="revenue-breakdown"
          aria-label="Revenue by currency"
        >
          <li
            v-for="currencyTotal in revenueSummary.currencyTotals"
            :key="currencyTotal.currency"
          >
            <span>{{ currencyTotal.currency }}</span>
            <strong>{{ currencyTotal.formattedAmount }}</strong>
          </li>
        </ul>
      </DashboardStatCard>

      <DashboardStatCard
        icon="trend"
        :is-loading="showSkeletons"
        label="Success Rate"
        :supporting-label="completedTransactionsSupportingLabel"
        tone="success"
        :value="`${successRate}%`"
      />
    </div>

    <RecentTransactionsTable
      :is-loading="showSkeletons"
      :transactions="recentTransactions"
    />
  </section>
</template>

<style scoped>
.dashboard-page {
  display: grid;
  gap: 30px;
}

.dashboard-header {
  padding-bottom: 16px;
}

.dashboard-header h1 {
  color: #111827;
  font-size: 42px;
  line-height: 1.1;
  margin: 0;
}

.dashboard-header p {
  color: #4b5563;
  font-size: 20px;
  font-weight: 500;
  margin: 14px 0 0;
}

.dashboard-alert button {
  background: #ffffff;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  color: #111827;
  cursor: pointer;
  font-size: 14px;
  font-weight: 700;
  padding: 10px 14px;
}

.dashboard-alert button:hover {
  border-color: #0f766e;
  color: #0f766e;
}

.dashboard-alert {
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

.dashboard-alert strong {
  color: #7c2d12;
  display: block;
  font-size: 14px;
}

.dashboard-alert p {
  font-size: 14px;
  margin: 4px 0 0;
}

.dashboard-grid {
  display: grid;
  gap: 30px;
}

.dashboard-grid--summary {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.dashboard-grid--financial {
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
}

.dashboard-revenue-card {
  min-height: 252px;
}

.revenue-breakdown {
  display: grid;
  gap: 8px;
  list-style: none;
  margin: 18px 0 0;
  padding: 0;
}

.revenue-breakdown li {
  align-items: center;
  background: rgb(255 255 255 / 0.14);
  border-radius: 8px;
  display: flex;
  gap: 14px;
  justify-content: space-between;
  min-height: 34px;
  padding: 0 12px;
}

.revenue-breakdown span {
  color: rgb(255 255 255 / 0.72);
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0;
}

.revenue-breakdown strong {
  color: #ffffff;
  font-size: 14px;
  font-weight: 800;
}

@media (max-width: 1080px) {
  .dashboard-grid--summary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .dashboard-alert {
    align-items: flex-start;
    flex-direction: column;
  }

  .dashboard-grid--summary,
  .dashboard-grid--financial {
    grid-template-columns: 1fr;
  }

  .dashboard-header h1 {
    font-size: 34px;
  }

  .dashboard-header p {
    font-size: 17px;
  }
}
</style>
