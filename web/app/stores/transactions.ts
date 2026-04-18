import { defineStore } from 'pinia'
import {
  createTransaction as createTransactionRequest,
  getTransactionBreakdown,
  getTransactionById,
  getTransactions,
  updateTransactionStage as updateTransactionStageRequest,
} from '~/services/transaction.service'
import type {
  CreateTransactionPayload,
  FinancialBreakdown,
  Transaction,
  TransactionAgentReference,
  TransactionStage,
  UpdateTransactionStagePayload,
} from '~/types/transaction'
import { getStoreErrorMessage } from '~/utils/store-error'

const CACHE_TTL_MS = 60_000

let fetchTransactionsPromise: Promise<void> | null = null

interface TransactionsState {
  items: Transaction[]
  selectedTransaction: Transaction | null
  breakdown: FinancialBreakdown | null
  isLoading: boolean
  error: string | null
  lastFetchedAt: number | null
}

export const useTransactionsStore = defineStore('transactions', {
  state: (): TransactionsState => ({
    items: [],
    selectedTransaction: null,
    breakdown: null,
    isLoading: false,
    error: null,
    lastFetchedAt: null,
  }),

  actions: {
    async fetchTransactions(forceRefresh = false): Promise<void> {
      if (!forceRefresh && isCacheFresh(this.lastFetchedAt)) {
        return
      }

      if (fetchTransactionsPromise) {
        return fetchTransactionsPromise
      }

      this.isLoading = true
      this.error = null

      fetchTransactionsPromise = (async () => {
        try {
          this.items = await getTransactions()
          this.lastFetchedAt = Date.now()
        } catch (error) {
          this.error = getStoreErrorMessage(error)
          throw error
        } finally {
          this.isLoading = false
          fetchTransactionsPromise = null
        }
      })()

      return fetchTransactionsPromise
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
