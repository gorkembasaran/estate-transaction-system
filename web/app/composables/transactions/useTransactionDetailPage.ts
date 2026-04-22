import { storeToRefs } from 'pinia'
import { computed, onMounted, ref, watch } from 'vue'
import { useTransactionsStore } from '~/stores/transactions'
import type {
  FinancialBreakdown,
  StageHistoryItem,
  Transaction,
  TransactionStage,
} from '~/types/transaction'
import {
  formatAmountWithCurrency,
  formatDate,
  formatDateTime,
  getAgentDisplayEmail,
  getAgentDisplayName,
  getAgentEditPath,
  getTransactionStageLabel,
} from '~/utils/transaction-format'

const nextStageByStage: Partial<Record<TransactionStage, TransactionStage>> = {
  agreement: 'earnest_money',
  earnest_money: 'title_deed',
  title_deed: 'completed',
}

export function useTransactionDetailPage() {
  const route = useRoute()
  const transactionsStore = useTransactionsStore()
  const { error, isLoading, selectedTransaction } =
    storeToRefs(transactionsStore)

  const selectedNextStage = ref<TransactionStage | ''>('')
  const localError = ref<string | null>(null)
  const hasCompletedInitialLoad = ref(false)

  const transactionId = computed(() => {
    const param = route.params.id

    return Array.isArray(param) ? param[0] : param
  })
  const transaction = computed<Transaction | null>(() =>
    selectedTransaction.value?._id === transactionId.value
      ? selectedTransaction.value
      : null,
  )
  const breakdown = computed(() => transaction.value?.breakdown ?? null)
  const stageHistory = computed(() =>
    [...(transaction.value?.stageHistory ?? [])].sort(
      (firstItem, secondItem) =>
        new Date(firstItem.changedAt).getTime() -
        new Date(secondItem.changedAt).getTime(),
    ),
  )
  const nextStageOptions = computed(() => {
    const currentStage = transaction.value?.stage

    if (!currentStage) {
      return []
    }

    const nextStage = nextStageByStage[currentStage]

    return nextStage
      ? [
          {
            label: getTransactionStageLabel(nextStage),
            value: nextStage,
          },
        ]
      : []
  })
  const canUpdateStage = computed(
    () => selectedNextStage.value !== '' && !isLoading.value,
  )
  const pageError = computed(() => localError.value || error.value)
  const showInitialLoading = computed(
    () =>
      !hasCompletedInitialLoad.value &&
      transaction.value === null &&
      !pageError.value,
  )

  async function loadTransaction(): Promise<void> {
    localError.value = null

    if (!transactionId.value) {
      localError.value = 'Transaction id is missing.'
      hasCompletedInitialLoad.value = true
      return
    }

    try {
      await transactionsStore
        .fetchTransactionById(transactionId.value)
        .catch(() => undefined)
    } finally {
      hasCompletedInitialLoad.value = true
    }
  }

  async function updateStage(): Promise<void> {
    localError.value = null

    if (!transaction.value || !selectedNextStage.value) {
      return
    }

    try {
      await transactionsStore.updateTransactionStage(
        transaction.value._id,
        selectedNextStage.value,
      )
      selectedNextStage.value = ''
    } catch {
      // Store error is displayed on the page.
    }
  }

  function isCurrentHistoryItem(
    item: StageHistoryItem,
    index: number,
  ): boolean {
    return (
      index === stageHistory.value.length - 1 &&
      item.toStage === transaction.value?.stage
    )
  }

  function getAgencyShareLabel(currentBreakdown: FinancialBreakdown): string {
    if (!transaction.value || transaction.value.totalServiceFee <= 0) {
      return 'Agency share'
    }

    const percentage = Math.round(
      (currentBreakdown.agencyAmount / transaction.value.totalServiceFee) * 100,
    )

    return `${percentage}% of total service fee`
  }

  watch(
    () => transaction.value?.stage,
    () => {
      selectedNextStage.value = ''
    },
  )

  onMounted(() => {
    void loadTransaction()
  })

  return {
    breakdown,
    canUpdateStage,
    formatAmountWithCurrency,
    formatDate,
    formatDateTime,
    getAgencyShareLabel,
    getAgentDisplayEmail,
    getAgentDisplayName,
    getAgentEditPath,
    isCurrentHistoryItem,
    isLoading,
    loadTransaction,
    nextStageOptions,
    pageError,
    selectedNextStage,
    showInitialLoading,
    stageHistory,
    transaction,
    updateStage,
  }
}
