import { storeToRefs } from 'pinia'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useAgentsStore } from '~/stores/agents'
import type { Agent, AgentStatusFilter, GetAgentsParams } from '~/types/agent'
import { formatDate } from '~/utils/transaction-format'

const PAGE_SIZE = 10
const SEARCH_DEBOUNCE_MS = 300

const statusOptions: Array<{ label: string; value: AgentStatusFilter }> = [
  { label: 'All Agents', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
]

export function useAgentsListPage() {
  const agentsStore = useAgentsStore()
  const {
    error,
    isLoading,
    items: agents,
    lastFetchParams,
    pagination,
  } = storeToRefs(agentsStore)

  const searchQuery = ref('')
  const selectedStatus = ref<AgentStatusFilter>('all')
  const currentPage = ref(1)

  let searchDebounce: ReturnType<typeof setTimeout> | null = null

  const normalizedSearchQuery = computed(() => searchQuery.value.trim())
  const hasSearch = computed(() => normalizedSearchQuery.value.length > 0)
  const hasActiveFilters = computed(
    () => hasSearch.value || selectedStatus.value !== 'all',
  )
  const currentFetchParams = computed(() => ({
    limit: PAGE_SIZE,
    page: currentPage.value,
    search: normalizedSearchQuery.value || undefined,
    status: selectedStatus.value,
  }))
  const isCurrentQueryLoaded = computed(() =>
    doFetchParamsMatch(lastFetchParams.value, currentFetchParams.value),
  )
  const displayedAgents = computed(() =>
    isCurrentQueryLoaded.value ? agents.value : [],
  )
  const showSkeletonRows = computed(
    () => !isCurrentQueryLoaded.value && !error.value,
  )
  const hasMultiplePages = computed(
    () => isCurrentQueryLoaded.value && pagination.value.totalPages > 1,
  )
  const resultScopeLabel = computed(() => {
    if (selectedStatus.value === 'active') {
      return 'active agent'
    }

    if (selectedStatus.value === 'inactive') {
      return 'inactive agent'
    }

    return 'agent'
  })
  const resultSummary = computed(() => {
    if (!isCurrentQueryLoaded.value && error.value) {
      return 'Could not load agents'
    }

    if (!isCurrentQueryLoaded.value) {
      return 'Loading agents...'
    }

    const scopeLabel = `${resultScopeLabel.value}${
      pagination.value.totalItems === 1 ? '' : 's'
    }`

    if (pagination.value.totalItems === 0) {
      return `Showing 0 of 0 ${scopeLabel}`
    }

    const startItem = (pagination.value.page - 1) * pagination.value.limit + 1
    const endItem = startItem + displayedAgents.value.length - 1

    return `Showing ${startItem}-${endItem} of ${
      pagination.value.totalItems
    } ${scopeLabel}`
  })
  const emptyStateTitle = computed(() => {
    if (hasActiveFilters.value) {
      return 'No agents match your current filters'
    }

    return 'No agents yet'
  })
  const emptyStateDescription = computed(() => {
    if (hasActiveFilters.value) {
      return 'Try a different name, email address, or status filter.'
    }

    return 'Create your first agent before creating transactions.'
  })

  async function loadAgents(forceRefresh = false): Promise<void> {
    await agentsStore
      .fetchAgents({
        forceRefresh,
        limit: PAGE_SIZE,
        page: currentPage.value,
        search: normalizedSearchQuery.value || undefined,
        status: selectedStatus.value,
      })
      .catch(() => undefined)
  }

  async function retryAgents(): Promise<void> {
    await loadAgents(true)
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
    selectedStatus.value = 'all'
    resetToFirstPageAndLoad()
  }

  function getAgentInitials(agent: Agent): string {
    const initials = agent.fullName
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('')

    return initials || 'A'
  }

  function resetToFirstPageAndLoad(): void {
    if (currentPage.value === 1) {
      void loadAgents()
      return
    }

    currentPage.value = 1
  }

  onMounted(() => {
    void loadAgents()
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

  watch(selectedStatus, () => {
    resetToFirstPageAndLoad()
  })

  watch(currentPage, () => {
    void loadAgents()
  })

  return {
    clearFilters,
    currentPage,
    displayedAgents,
    emptyStateDescription,
    emptyStateTitle,
    error,
    formatDate,
    getAgentInitials,
    goToNextPage,
    goToPreviousPage,
    hasActiveFilters,
    hasMultiplePages,
    isLoading,
    pagination,
    resultSummary,
    retryAgents,
    searchQuery,
    selectedStatus,
    showSkeletonRows,
    statusOptions,
  }
}

function doFetchParamsMatch(
  loadedParams: GetAgentsParams | null,
  expectedParams: {
    limit: number
    page: number
    search?: string
    status: AgentStatusFilter
  },
): boolean {
  if (!loadedParams) {
    return false
  }

  return (
    loadedParams.limit === expectedParams.limit &&
    loadedParams.page === expectedParams.page &&
    (loadedParams.search || undefined) === expectedParams.search &&
    (loadedParams.status ?? 'all') === expectedParams.status
  )
}
