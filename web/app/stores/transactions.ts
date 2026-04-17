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
  TransactionStage,
  UpdateTransactionStagePayload,
} from '~/types/transaction'
import { getStoreErrorMessage } from '~/utils/store-error'

interface TransactionsState {
  items: Transaction[]
  selectedTransaction: Transaction | null
  breakdown: FinancialBreakdown | null
  isLoading: boolean
  error: string | null
}

export const useTransactionsStore = defineStore('transactions', {
  state: (): TransactionsState => ({
    items: [],
    selectedTransaction: null,
    breakdown: null,
    isLoading: false,
    error: null,
  }),

  actions: {
    async fetchTransactions(): Promise<void> {
      this.isLoading = true
      this.error = null

      try {
        this.items = await getTransactions()
      } catch (error) {
        this.error = getStoreErrorMessage(error)
        throw error
      } finally {
        this.isLoading = false
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
        const transaction = await updateTransactionStageRequest(id, payload)

        this.selectedTransaction = transaction
        this.breakdown = transaction.breakdown
        this.items = this.items.map((item) =>
          item._id === transaction._id ? transaction : item,
        )

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
