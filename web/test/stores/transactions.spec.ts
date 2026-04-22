import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createTransaction as createTransactionRequest,
  getTransactionCount,
  getTransactions,
  updateTransactionStage as updateTransactionStageRequest,
} from '~/services/transaction.service'
import { useTransactionsStore } from '~/stores/transactions'
import { createAgent, createTransaction } from '../factories'
import type {
  PaginatedTransactionsResponse,
  Transaction,
} from '~/types/transaction'

vi.mock('~/services/transaction.service', () => ({
  createTransaction: vi.fn(),
  getTransactionBreakdown: vi.fn(),
  getTransactionById: vi.fn(),
  getTransactionCount: vi.fn(),
  getTransactions: vi.fn(),
  updateTransactionStage: vi.fn(),
}))

const getTransactionsMock = vi.mocked(getTransactions)
const getTransactionCountMock = vi.mocked(getTransactionCount)
const createTransactionMock = vi.mocked(createTransactionRequest)
const updateTransactionStageMock = vi.mocked(updateTransactionStageRequest)

function createTransactionsResponse(
  items: Transaction[],
  overrides: Partial<PaginatedTransactionsResponse['meta']> = {},
): PaginatedTransactionsResponse {
  return {
    items,
    meta: {
      hasNextPage: false,
      hasPreviousPage: false,
      limit: 10,
      page: 1,
      totalItems: items.length,
      totalPages: items.length > 0 ? 1 : 0,
      ...overrides,
    },
  }
}

function createDeferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void

  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve
    reject = promiseReject
  })

  return {
    promise,
    reject,
    resolve,
  }
}

describe('transactions store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('fetches paginated transactions and stores the normalized query state', async () => {
    const transactions = [
      createTransaction({
        _id: 'transaction-1',
        propertyTitle: 'Lake House',
      }),
    ]

    getTransactionsMock.mockResolvedValueOnce(
      createTransactionsResponse(transactions, {
        hasNextPage: true,
        limit: 10,
        page: 2,
        totalItems: 21,
        totalPages: 3,
      }),
    )

    const store = useTransactionsStore()
    await store.fetchTransactions({
      dateFrom: '2026-04-01',
      dateTo: '2026-04-30',
      limit: 10,
      page: 2,
      search: 'lake',
      sortBy: 'updatedAt',
      sortOrder: 'desc',
      stage: 'agreement',
    })

    expect(getTransactionsMock).toHaveBeenCalledWith({
      dateFrom: '2026-04-01',
      dateTo: '2026-04-30',
      limit: 10,
      page: 2,
      search: 'lake',
      sortBy: 'updatedAt',
      sortOrder: 'desc',
      stage: 'agreement',
    })
    expect(store.items).toEqual(transactions)
    expect(store.pagination.totalItems).toBe(21)
    expect(store.lastFetchParams).toEqual({
      dateFrom: '2026-04-01',
      dateTo: '2026-04-30',
      limit: 10,
      page: 2,
      search: 'lake',
      sortBy: 'updatedAt',
      sortOrder: 'desc',
      stage: 'agreement',
    })
  })

  it('uses backend pagination metadata for count queries', async () => {
    getTransactionCountMock.mockResolvedValueOnce(11)

    const store = useTransactionsStore()
    const count = await store.fetchTransactionCount({ stage: 'completed' })

    expect(count).toBe(11)
    expect(getTransactionCountMock).toHaveBeenCalledWith({
      stage: 'completed',
    })
  })

  it('ignores stale list responses when a newer query finishes first', async () => {
    const olderQueryTransaction = createTransaction({
      _id: 'transaction-old-query',
      propertyTitle: 'Older Query Transaction',
    })
    const newerQueryTransaction = createTransaction({
      _id: 'transaction-new-query',
      propertyTitle: 'Newer Query Transaction',
    })
    const olderRequest = createDeferred<PaginatedTransactionsResponse>()
    const newerRequest = createDeferred<PaginatedTransactionsResponse>()

    getTransactionsMock
      .mockReturnValueOnce(olderRequest.promise)
      .mockReturnValueOnce(newerRequest.promise)

    const store = useTransactionsStore()
    const olderFetch = store.fetchTransactions({
      limit: 10,
      page: 1,
      search: 'older',
      sortBy: 'updatedAt',
      sortOrder: 'desc',
    })
    const newerFetch = store.fetchTransactions({
      limit: 10,
      page: 1,
      search: 'newer',
      sortBy: 'updatedAt',
      sortOrder: 'desc',
    })

    newerRequest.resolve(createTransactionsResponse([newerQueryTransaction]))
    await newerFetch

    olderRequest.resolve(createTransactionsResponse([olderQueryTransaction]))
    await olderFetch

    expect(store.items).toEqual([newerQueryTransaction])
    expect(store.lastFetchParams).toEqual({
      dateFrom: undefined,
      dateTo: undefined,
      limit: 10,
      page: 1,
      search: 'newer',
      sortBy: 'updatedAt',
      sortOrder: 'desc',
      stage: undefined,
    })
    expect(store.isLoading).toBe(false)
  })

  it('does not locally prepend created transactions into a filtered/paginated list', async () => {
    const existingTransaction = createTransaction({
      _id: 'transaction-existing',
      propertyTitle: 'Existing Agreement',
      stage: 'agreement',
    })
    const createdTransaction = createTransaction({
      _id: 'transaction-created',
      propertyTitle: 'Created Transaction',
      stage: 'agreement',
    })

    getTransactionsMock
      .mockResolvedValueOnce(
        createTransactionsResponse([existingTransaction], {
          page: 2,
          totalItems: 21,
          totalPages: 3,
        }),
      )
      .mockResolvedValueOnce(
        createTransactionsResponse([existingTransaction], {
          page: 2,
          totalItems: 21,
          totalPages: 3,
        }),
      )
    createTransactionMock.mockResolvedValueOnce(createdTransaction)

    const store = useTransactionsStore()
    await store.fetchTransactions({
      limit: 10,
      page: 2,
      search: 'existing',
      sortBy: 'updatedAt',
      sortOrder: 'desc',
      stage: 'agreement',
    })
    await store.createTransaction({
      currency: 'USD',
      listingAgentId: 'agent-1',
      propertyTitle: 'Created Transaction',
      sellingAgentId: 'agent-2',
      totalServiceFee: 1000,
    })

    expect(store.selectedTransaction).toEqual(createdTransaction)
    expect(store.items).toEqual([existingTransaction])
    expect(store.pagination.totalItems).toBe(21)
    expect(getTransactionsMock).toHaveBeenCalledTimes(2)
    expect(getTransactionsMock).toHaveBeenLastCalledWith({
      dateFrom: undefined,
      dateTo: undefined,
      limit: 10,
      page: 2,
      search: 'existing',
      sortBy: 'updatedAt',
      sortOrder: 'desc',
      stage: 'agreement',
    })
  })

  it('refreshes the last query and preserves populated references after stage updates', async () => {
    const listingAgent = createAgent({
      _id: 'agent-listing',
      email: 'listing@example.com',
      fullName: 'Listing Agent',
    })
    const sellingAgent = createAgent({
      _id: 'agent-selling',
      email: 'selling@example.com',
      fullName: 'Selling Agent',
    })
    const existingTransaction = createTransaction({
      _id: 'transaction-1',
      listingAgentId: listingAgent,
      sellingAgentId: sellingAgent,
      stage: 'title_deed',
    })
    const updatedTransaction = createTransaction({
      _id: 'transaction-1',
      listingAgentId: 'agent-listing',
      sellingAgentId: 'agent-selling',
      stage: 'completed',
    })

    getTransactionsMock
      .mockResolvedValueOnce(createTransactionsResponse([existingTransaction]))
      .mockResolvedValueOnce(createTransactionsResponse([]))
    updateTransactionStageMock.mockResolvedValueOnce(updatedTransaction)

    const store = useTransactionsStore()
    await store.fetchTransactions({
      limit: 10,
      page: 1,
      stage: 'title_deed',
    })
    await store.updateTransactionStage('transaction-1', 'completed')

    expect(store.selectedTransaction?.stage).toBe('completed')
    expect(store.selectedTransaction?.listingAgentId).toEqual(listingAgent)
    expect(store.selectedTransaction?.sellingAgentId).toEqual(sellingAgent)
    expect(store.items).toEqual([])
    expect(getTransactionsMock).toHaveBeenCalledTimes(2)
    expect(getTransactionsMock).toHaveBeenLastCalledWith({
      dateFrom: undefined,
      dateTo: undefined,
      limit: 10,
      page: 1,
      search: undefined,
      sortBy: undefined,
      sortOrder: undefined,
      stage: 'title_deed',
    })
  })
})
