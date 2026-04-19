import { defineStore } from 'pinia'
import {
  createTransaction as createTransactionRequest,
  getTransactionBreakdown,
  getTransactionById,
  getTransactionCount,
  getTransactions,
  updateTransactionStage as updateTransactionStageRequest,
} from '~/services/transaction.service'
import type {
  CreateTransactionPayload,
  FinancialBreakdown,
  GetTransactionsParams,
  PaginationMeta,
  Transaction,
  TransactionAgentReference,
  TransactionStage,
  UpdateTransactionStagePayload,
} from '~/types/transaction'
import { getStoreErrorMessage } from '~/utils/store-error'

const CACHE_TTL_MS = 60_000
const DEFAULT_PAGE = 1
const DEFAULT_LIMIT = 100

let fetchTransactionsPromise: Promise<void> | null = null
let fetchTransactionsKey: string | null = null

interface TransactionsState {
  items: Transaction[]
  selectedTransaction: Transaction | null
  breakdown: FinancialBreakdown | null
  isLoading: boolean
  error: string | null
  lastFetchedAt: number | null
  lastFetchKey: string | null
  pagination: PaginationMeta
}

type FetchTransactionsOptions =
  | (GetTransactionsParams & { forceRefresh?: boolean })
  | boolean

export const useTransactionsStore = defineStore('transactions', {
  state: (): TransactionsState => ({
    items: [],
    selectedTransaction: null,
    breakdown: null,
    isLoading: false,
    error: null,
    lastFetchedAt: null,
    lastFetchKey: null,
    pagination: {
      hasNextPage: false,
      hasPreviousPage: false,
      limit: DEFAULT_LIMIT,
      page: DEFAULT_PAGE,
      totalItems: 0,
      totalPages: 0,
    },
  }),

  actions: {
    async fetchTransactions(
      options: FetchTransactionsOptions = {},
    ): Promise<void> {
      const { forceRefresh, params } = normalizeFetchOptions(options)
      const requestKey = createRequestKey(params)

      if (
        !forceRefresh &&
        this.lastFetchKey === requestKey &&
        isCacheFresh(this.lastFetchedAt)
      ) {
        return
      }

      if (fetchTransactionsPromise && fetchTransactionsKey === requestKey) {
        return fetchTransactionsPromise
      }

      this.isLoading = true
      this.error = null
      fetchTransactionsKey = requestKey

      fetchTransactionsPromise = (async () => {
        try {
          const response = await getTransactions(params)

          this.items = response.items
          this.pagination = response.meta
          this.lastFetchedAt = Date.now()
          this.lastFetchKey = requestKey
        } catch (error) {
          this.error = getStoreErrorMessage(error)
          throw error
        } finally {
          this.isLoading = false
          fetchTransactionsPromise = null
          fetchTransactionsKey = null
        }
      })()

      return fetchTransactionsPromise
    },

    async fetchTransactionCount(
      params: GetTransactionsParams = {},
    ): Promise<number> {
      try {
        return await getTransactionCount(params)
      } catch (error) {
        this.error = getStoreErrorMessage(error)
        throw error
      }
    },

    async fetchTransactionById(id: string): Promise<void> {
      this.isLoading = true
      this.error = null

      try {
        this.selectedTransaction = await getTransactionById(id)
        this.breakdown = this.selectedTransaction.breakdown
      } catch (error) {
        this.error = getStoreErrorMessage(error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async createTransaction(
      payload: CreateTransactionPayload,
    ): Promise<Transaction> {
      this.isLoading = true
      this.error = null

      try {
        const transaction = await createTransactionRequest(payload)

        this.items = [transaction, ...this.items]
        this.selectedTransaction = transaction
        this.breakdown = transaction.breakdown
        this.pagination = {
          ...this.pagination,
          totalItems: this.pagination.totalItems + 1,
          totalPages: Math.ceil(
            (this.pagination.totalItems + 1) / this.pagination.limit,
          ),
        }

        if (this.lastFetchedAt) {
          this.lastFetchedAt = Date.now()
        }

        return transaction
      } catch (error) {
        this.error = getStoreErrorMessage(error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async updateTransactionStage(
      id: string,
      stage: TransactionStage,
    ): Promise<Transaction> {
      this.isLoading = true
      this.error = null

      try {
        const payload: UpdateTransactionStagePayload = { stage }
        const previousTransaction =
          this.selectedTransaction?._id === id
            ? this.selectedTransaction
            : this.items.find((item) => item._id === id)
        const transaction = preservePopulatedAgentReferences(
          await updateTransactionStageRequest(id, payload),
          previousTransaction,
        )

        this.selectedTransaction = transaction
        this.breakdown = transaction.breakdown
        this.items = this.items.map((item) =>
          item._id === transaction._id ? transaction : item,
        )

        if (this.lastFetchedAt) {
          this.lastFetchedAt = Date.now()
        }

        return transaction
      } catch (error) {
        this.error = getStoreErrorMessage(error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async fetchTransactionBreakdown(
      id: string,
    ): Promise<FinancialBreakdown | null> {
      this.isLoading = true
      this.error = null

      try {
        const breakdown = await getTransactionBreakdown(id)

        this.breakdown = breakdown

        if (this.selectedTransaction?._id === id) {
          this.selectedTransaction = {
            ...this.selectedTransaction,
            breakdown,
          }
        }

        return this.breakdown
      } catch (error) {
        this.error = getStoreErrorMessage(error)
        throw error
      } finally {
        this.isLoading = false
      }
    },
  },
})

function isCacheFresh(lastFetchedAt: number | null): boolean {
  return lastFetchedAt !== null && Date.now() - lastFetchedAt < CACHE_TTL_MS
}

function normalizeFetchOptions(options: FetchTransactionsOptions): {
  forceRefresh: boolean
  params: GetTransactionsParams
} {
  if (typeof options === 'boolean') {
    return {
      forceRefresh: options,
      params: {
        limit: DEFAULT_LIMIT,
        page: DEFAULT_PAGE,
      },
    }
  }

  const { forceRefresh = false, ...params } = options

  return {
    forceRefresh,
    params: {
      limit: params.limit ?? DEFAULT_LIMIT,
      page: params.page ?? DEFAULT_PAGE,
      dateFrom: params.dateFrom || undefined,
      dateTo: params.dateTo || undefined,
      search: params.search || undefined,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
      stage: params.stage,
    },
  }
}

function createRequestKey(params: GetTransactionsParams): string {
  return JSON.stringify({
    limit: params.limit ?? DEFAULT_LIMIT,
    page: params.page ?? DEFAULT_PAGE,
    dateFrom: params.dateFrom ?? '',
    dateTo: params.dateTo ?? '',
    search: params.search ?? '',
    sortBy: params.sortBy ?? '',
    sortOrder: params.sortOrder ?? '',
    stage: params.stage ?? '',
  })
}

function preservePopulatedAgentReferences(
  transaction: Transaction,
  previousTransaction: Transaction | undefined,
): Transaction {
  if (!previousTransaction) {
    return transaction
  }

  return {
    ...transaction,
    listingAgentId: preserveAgentReference(
      transaction.listingAgentId,
      previousTransaction.listingAgentId,
    ),
    sellingAgentId: preserveAgentReference(
      transaction.sellingAgentId,
      previousTransaction.sellingAgentId,
    ),
  }
}

function preserveAgentReference(
  nextReference: TransactionAgentReference,
  previousReference: TransactionAgentReference,
): TransactionAgentReference {
  if (typeof nextReference !== 'string') {
    return nextReference
  }

  if (
    typeof previousReference !== 'string' &&
    previousReference._id === nextReference
  ) {
    return previousReference
  }

  return nextReference
}
