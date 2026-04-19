import type { AxiosInstance } from 'axios'
import type {
  CreateTransactionPayload,
  FinancialBreakdown,
  GetTransactionsParams,
  PaginatedTransactionsResponse,
  Transaction,
  UpdateTransactionStagePayload,
} from '~/types/transaction'

type TransactionsListResponse = Transaction[] | PaginatedTransactionsResponse

function getApiClient(): AxiosInstance {
  return useNuxtApp().$api
}

export async function getTransactions(
  params?: GetTransactionsParams,
): Promise<PaginatedTransactionsResponse> {
  const { data } = await getApiClient().get<TransactionsListResponse>(
    '/transactions',
    { params },
  )

  if (!Array.isArray(data)) {
    return data
  }

  return {
    items: data,
    meta: {
      hasNextPage: false,
      hasPreviousPage: false,
      limit: data.length,
      page: 1,
      totalItems: data.length,
      totalPages: data.length > 0 ? 1 : 0,
    },
  }
}

export async function getTransactionCount(
  params?: GetTransactionsParams,
): Promise<number> {
  const response = await getTransactions({
    ...params,
    limit: 1,
    page: 1,
  })

  return response.meta.totalItems
}

export async function getTransactionById(id: string): Promise<Transaction> {
  const { data } = await getApiClient().get<Transaction>(`/transactions/${id}`)

  return data
}

export async function createTransaction(
  payload: CreateTransactionPayload,
): Promise<Transaction> {
  const { data } = await getApiClient().post<Transaction>(
    '/transactions',
    payload,
  )

  return data
}

export async function updateTransactionStage(
  id: string,
  payload: UpdateTransactionStagePayload,
): Promise<Transaction> {
  const { data } = await getApiClient().patch<Transaction>(
    `/transactions/${id}/stage`,
    payload,
  )

  return data
}

export async function getTransactionBreakdown(
  id: string,
): Promise<FinancialBreakdown | null> {
  const { data } = await getApiClient().get<FinancialBreakdown | null>(
    `/transactions/${id}/breakdown`,
  )

  return data
}
