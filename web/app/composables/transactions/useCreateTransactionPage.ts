import { storeToRefs } from 'pinia'
import { computed, onMounted, reactive, ref } from 'vue'
import {
  currencyOptions,
  isSupportedCurrency,
} from '~/constants/currency-options'
import { useAgentsStore } from '~/stores/agents'
import { useTransactionsStore } from '~/stores/transactions'
import type { Agent } from '~/types/agent'
import type { CreateTransactionPayload } from '~/types/transaction'

export function useCreateTransactionPage() {
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
  const hasCompletedInitialLoad = ref(false)

  const isSubmitting = computed(() => transactionLoading.value)
  const isPageLoading = computed(
    () =>
      !hasCompletedInitialLoad.value &&
      agents.value.length === 0 &&
      !agentsError.value,
  )
  const formError = computed(
    () => localError.value || transactionError.value || agentsError.value,
  )
  const hasAgents = computed(() => agents.value.length > 0)

  async function loadAgents(forceRefresh = false): Promise<void> {
    try {
      await agentsStore
        .fetchAgents({
          forceRefresh,
          limit: 10,
          page: 1,
          status: 'active',
        })
        .catch(() => undefined)
    } finally {
      hasCompletedInitialLoad.value = true
    }
  }

  async function submitTransaction(): Promise<void> {
    localError.value = null

    const payload = buildPayload()

    if (!payload) {
      return
    }

    try {
      await transactionsStore.createTransaction(payload)
      await navigateTo('/transactions')
    } catch {
      // Store error is displayed in the form.
    }
  }

  async function searchActiveAgents(query: string): Promise<Agent[]> {
    return agentsStore.searchAgents({
      limit: 10,
      page: 1,
      search: query,
      status: 'active',
    })
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

  function buildPayload(): CreateTransactionPayload | null {
    const serviceFee = Number(serviceFeeInput.value)
    const payload: CreateTransactionPayload = {
      currency: form.currency,
      listingAgentId: form.listingAgentId,
      propertyTitle: form.propertyTitle.trim(),
      sellingAgentId: form.sellingAgentId,
      totalServiceFee: serviceFee,
    }

    if (!payload.propertyTitle) {
      localError.value = 'Property title is required.'
      return null
    }

    if (!payload.listingAgentId || !payload.sellingAgentId) {
      localError.value = 'Listing agent and selling agent are required.'
      return null
    }

    if (
      !Number.isFinite(payload.totalServiceFee) ||
      payload.totalServiceFee <= 0
    ) {
      localError.value = 'Service fee must be greater than zero.'
      return null
    }

    if (!isSupportedCurrency(payload.currency)) {
      localError.value = 'Please select a supported currency.'
      return null
    }

    return payload
  }

  onMounted(() => {
    void loadAgents()
  })

  return {
    agents,
    agentsLoading,
    currencyOptions,
    form,
    formError,
    hasAgents,
    isPageLoading,
    isSubmitting,
    resetForm,
    searchActiveAgents,
    serviceFeeInput,
    submitTransaction,
  }
}
