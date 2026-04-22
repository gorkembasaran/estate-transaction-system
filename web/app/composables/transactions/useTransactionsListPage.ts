import { storeToRefs } from 'pinia'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useTransactionsStore } from '~/stores/transactions'
import type {
  TransactionSortBy,
  TransactionSortOrder,
  TransactionStage,
} from '~/types/transaction'
import {
  formatAmountWithCurrency,
  formatDate,
  getAgentDisplayName,
  getAgentEditPath,
} from '~/utils/transaction-format'

const PAGE_SIZE = 10
const SEARCH_DEBOUNCE_MS = 300

const stageOptions: Array<{ label: string; value: TransactionStage | 'all' }> =
  [
    { label: 'All Stages', value: 'all' },
    { label: 'Agreement', value: 'agreement' },
    { label: 'Earnest Money', value: 'earnest_money' },
    { label: 'Title Deed', value: 'title_deed' },
    { label: 'Completed', value: 'completed' },
  ]

const dateFilterFormatter = new Intl.DateTimeFormat('en-US', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

export function useTransactionsListPage() {
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
  const dateFromInput = ref<HTMLInputElement | null>(null)
  const dateToInput = ref<HTMLInputElement | null>(null)
  const currentPage = ref(1)
  const sortBy = ref<TransactionSortBy>('updatedAt')
  const sortOrder = ref<TransactionSortOrder>('desc')
  const hasCompletedInitialLoad = ref(false)

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
  const showSkeletonRows = computed(
    () =>
      !hasCompletedInitialLoad.value &&
      transactions.value.length === 0 &&
      !error.value,
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
    try {
      await transactionsStore
        .fetchTransactions({
          forceRefresh,
          dateFrom: dateFrom.value || undefined,
          dateTo: dateTo.value || undefined,
          limit: PAGE_SIZE,
          page: currentPage.value,
          search: normalizedSearchQuery.value || undefined,
          sortBy: sortBy.value,
          sortOrder: sortOrder.value,
          stage:
            selectedStage.value === 'all' ? undefined : selectedStage.value,
        })
        .catch(() => undefined)
    } finally {
      hasCompletedInitialLoad.value = true
    }
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

  function formatDateFilterValue(value: string): string {
    if (!value) {
      return 'Select date'
    }

    const dateParts = value.split('-')
    const yearValue = dateParts[0]
    const monthValue = dateParts[1]
    const dayValue = dateParts[2]

    if (!yearValue || !monthValue || !dayValue) {
      return value
    }

    const year = Number(yearValue)
    const month = Number(monthValue)
    const day = Number(dayValue)
    const date = new Date(year, month - 1, day)

    if (Number.isNaN(date.getTime())) {
      return value
    }

    return dateFilterFormatter.format(date)
  }

  function openDatePicker(input: HTMLInputElement | null): void {
    if (!input) {
      return
    }

    if (typeof input.showPicker === 'function') {
      input.showPicker()
      return
    }

    input.focus()
    input.click()
  }

  function toggleSort(nextSortBy: TransactionSortBy): void {
    if (sortBy.value === nextSortBy) {
      sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
    } else {
      sortBy.value = nextSortBy
      sortOrder.value = 'desc'
    }

    resetToFirstPageAndLoad()
  }

  function getSortIndicatorState(
    targetSortBy: TransactionSortBy,
  ): 'neutral' | 'ascending' | 'descending' {
    if (sortBy.value !== targetSortBy) {
      return 'neutral'
    }

    return sortOrder.value === 'asc' ? 'ascending' : 'descending'
  }

  function getSortAriaSort(
    targetSortBy: TransactionSortBy,
  ): 'ascending' | 'descending' | 'none' {
    if (sortBy.value !== targetSortBy) {
      return 'none'
    }

    return sortOrder.value === 'asc' ? 'ascending' : 'descending'
  }

  function getSortButtonLabel(targetSortBy: TransactionSortBy): string {
    const labels: Record<TransactionSortBy, string> = {
      createdAt: 'created date',
      totalServiceFee: 'service fee amount',
      updatedAt: 'last update date',
    }
    const label = labels[targetSortBy]

    if (sortBy.value !== targetSortBy) {
      return `Sort by ${label}`
    }

    return `Sort ${label} ${
      sortOrder.value === 'asc' ? 'descending' : 'ascending'
    }`
  }

  function resetToFirstPageAndLoad(): void {
    if (currentPage.value === 1) {
      void loadTransactions()
      return
    }

    currentPage.value = 1
  }

  onMounted(() => {
    void loadTransactions()
  })

  onBeforeUnmount(() => {
    if (searchDebounce) {
      clearTimeout(searchDebounce)
    }
  })

  watch(searchQuery, () => {
    if (searchDebounce) {
      clearTimeout(searchDebounce)
    }

    searchDebounce = setTimeout(() => {
      resetToFirstPageAndLoad()
    }, SEARCH_DEBOUNCE_MS)
  })

  watch([selectedStage, dateFrom, dateTo], () => {
    resetToFirstPageAndLoad()
  })

  watch(currentPage, () => {
    void loadTransactions()
  })

  return {
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
  }
}
