import { storeToRefs } from 'pinia'
import { computed, onMounted, ref } from 'vue'
import { useAgentsStore } from '~/stores/agents'
import { useTransactionsStore } from '~/stores/transactions'
import type { Transaction } from '~/types/transaction'
import { getCompletedRevenueSummary } from '~/utils/transaction-format'

export function useDashboardPage() {
  const agentsStore = useAgentsStore()
  const transactionsStore = useTransactionsStore()
  const hasCompletedInitialLoad = ref(false)
  const isDashboardLoading = ref(true)
  const completedTransactionsCount = ref<number | null>(null)

  const { error: agentsError, pagination: agentsPagination } =
    storeToRefs(agentsStore)
  const {
    error: transactionsError,
    items: transactions,
    pagination: transactionsPagination,
  } = storeToRefs(transactionsStore)

  const totalTransactions = computed(
    () => transactionsPagination.value.totalItems,
  )
  const completedTransactions = computed(
    () => completedTransactionsCount.value ?? 0,
  )
  const activeTransactions = computed(() =>
    Math.max(totalTransactions.value - completedTransactions.value, 0),
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
    getLoadedCompletedRevenueSummary(transactions.value),
  )
  const completedTransactionsSupportingLabel = computed(
    () =>
      `${completedTransactions.value} of ${totalTransactions.value} transactions completed`,
  )
  const recentTransactions = computed(() => transactions.value.slice(0, 5))
  const errorMessage = computed(
    () => transactionsError.value || agentsError.value,
  )
  const showSkeletons = computed(
    () =>
      !hasCompletedInitialLoad.value &&
      isDashboardLoading.value &&
      !errorMessage.value,
  )
  const showCountSkeletons = computed(
    () => completedTransactionsCount.value === null && !errorMessage.value,
  )

  async function loadDashboard(forceRefresh = false): Promise<void> {
    isDashboardLoading.value = true

    try {
      const results = await Promise.allSettled([
        transactionsStore.fetchTransactions({
          forceRefresh,
          limit: 100,
          page: 1,
          sortBy: 'updatedAt',
          sortOrder: 'desc',
        }),
        transactionsStore.fetchTransactionCount({
          stage: 'completed',
        }),
        agentsStore.fetchAgents({
          forceRefresh,
          status: 'active',
        }),
      ])

      applyCompletedCountResult(results[1])
      throwFirstRejectedResult(results)
    } finally {
      hasCompletedInitialLoad.value = true
      isDashboardLoading.value = false
    }
  }

  async function retryDashboard(): Promise<void> {
    await loadDashboard(true).catch(() => undefined)
  }

  onMounted(() => {
    void loadDashboard().catch(() => undefined)
  })

  return {
    activeTransactions,
    agentsPagination,
    completedTransactions,
    completedTransactionsSupportingLabel,
    errorMessage,
    recentTransactions,
    retryDashboard,
    revenueSummary,
    showCountSkeletons,
    showSkeletons,
    successRate,
    totalTransactions,
  }

  function applyCompletedCountResult(
    result: PromiseSettledResult<void | number>,
  ): void {
    if (result.status === 'fulfilled' && typeof result.value === 'number') {
      completedTransactionsCount.value = result.value
    }
  }
}

function throwFirstRejectedResult(
  results: Array<PromiseSettledResult<unknown>>,
): void {
  const rejectedResult = results.find((result) => result.status === 'rejected')

  if (rejectedResult?.status === 'rejected') {
    throw rejectedResult.reason
  }
}

function getLoadedCompletedRevenueSummary(transactions: Transaction[]) {
  const summary = getCompletedRevenueSummary(transactions)
  const loadedCompletedCount = transactions.filter(
    (transaction) => transaction.stage === 'completed',
  ).length

  return {
    ...summary,
    supportingLabel: `From ${loadedCompletedCount} loaded completed transaction${
      loadedCompletedCount === 1 ? '' : 's'
    }`,
  }
}
