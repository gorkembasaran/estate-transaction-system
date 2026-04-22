import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createAgent as createAgentRequest,
  getAgents,
  updateAgent as updateAgentRequest,
} from '~/services/agent.service'
import { useAgentsStore } from '~/stores/agents'
import { createAgent } from '../factories'
import type { Agent, PaginatedAgentsResponse } from '~/types/agent'

vi.mock('~/services/agent.service', () => ({
  createAgent: vi.fn(),
  getAgentById: vi.fn(),
  getAgents: vi.fn(),
  updateAgent: vi.fn(),
}))

const getAgentsMock = vi.mocked(getAgents)
const createAgentMock = vi.mocked(createAgentRequest)
const updateAgentMock = vi.mocked(updateAgentRequest)

function createAgentsResponse(
  items: Agent[],
  overrides: Partial<PaginatedAgentsResponse['meta']> = {},
): PaginatedAgentsResponse {
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

describe('agents store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('fetches paginated agents and stores the normalized query state', async () => {
    const agents = [
      createAgent({ _id: 'agent-1', fullName: 'Sarah Johnson' }),
    ]

    getAgentsMock.mockResolvedValueOnce(
      createAgentsResponse(agents, {
        hasNextPage: true,
        limit: 10,
        page: 2,
        totalItems: 12,
        totalPages: 2,
      }),
    )

    const store = useAgentsStore()
    await store.fetchAgents({
      limit: 10,
      page: 2,
      search: 'sarah',
      status: 'active',
    })

    expect(getAgentsMock).toHaveBeenCalledWith({
      limit: 10,
      page: 2,
      search: 'sarah',
      status: 'active',
    })
    expect(store.items).toEqual(agents)
    expect(store.pagination.totalItems).toBe(12)
    expect(store.lastFetchParams).toEqual({
      limit: 10,
      page: 2,
      search: 'sarah',
      status: 'active',
    })
  })

  it('reuses a fresh matching list query without making another request', async () => {
    getAgentsMock.mockResolvedValueOnce(createAgentsResponse([]))

    const store = useAgentsStore()
    await store.fetchAgents({ limit: 10, page: 1, status: 'all' })
    await store.fetchAgents({ limit: 10, page: 1, status: 'all' })

    expect(getAgentsMock).toHaveBeenCalledTimes(1)
  })

  it('ignores stale list responses when a newer query finishes first', async () => {
    const olderQueryAgent = createAgent({
      _id: 'agent-old-query',
      fullName: 'Older Query Agent',
    })
    const newerQueryAgent = createAgent({
      _id: 'agent-new-query',
      fullName: 'Newer Query Agent',
    })
    const olderRequest = createDeferred<PaginatedAgentsResponse>()
    const newerRequest = createDeferred<PaginatedAgentsResponse>()

    getAgentsMock
      .mockReturnValueOnce(olderRequest.promise)
      .mockReturnValueOnce(newerRequest.promise)

    const store = useAgentsStore()
    const olderFetch = store.fetchAgents({
      limit: 10,
      page: 1,
      search: 'older',
      status: 'all',
    })
    const newerFetch = store.fetchAgents({
      limit: 10,
      page: 1,
      search: 'newer',
      status: 'all',
    })

    newerRequest.resolve(createAgentsResponse([newerQueryAgent]))
    await newerFetch

    olderRequest.resolve(createAgentsResponse([olderQueryAgent]))
    await olderFetch

    expect(store.items).toEqual([newerQueryAgent])
    expect(store.lastFetchParams).toEqual({
      limit: 10,
      page: 1,
      search: 'newer',
      status: 'all',
    })
    expect(store.isLoading).toBe(false)
  })

  it('does not locally prepend created agents into a filtered/paginated list', async () => {
    const existingAgent = createAgent({
      _id: 'agent-existing',
      email: 'existing@example.com',
      fullName: 'Existing Agent',
      isActive: false,
    })
    const createdAgent = createAgent({
      _id: 'agent-created',
      email: 'created@example.com',
      fullName: 'Created Agent',
      isActive: true,
    })

    getAgentsMock
      .mockResolvedValueOnce(
        createAgentsResponse([existingAgent], {
          page: 2,
          totalItems: 11,
          totalPages: 2,
        }),
      )
      .mockResolvedValueOnce(
        createAgentsResponse([existingAgent], {
          page: 2,
          totalItems: 11,
          totalPages: 2,
        }),
      )
    createAgentMock.mockResolvedValueOnce(createdAgent)

    const store = useAgentsStore()
    await store.fetchAgents({
      limit: 10,
      page: 2,
      search: 'existing',
      status: 'inactive',
    })
    await store.createAgent({
      email: 'created@example.com',
      fullName: 'Created Agent',
      isActive: true,
    })

    expect(store.selectedAgent).toEqual(createdAgent)
    expect(store.items).toEqual([existingAgent])
    expect(store.pagination.totalItems).toBe(11)
    expect(getAgentsMock).toHaveBeenCalledTimes(2)
    expect(getAgentsMock).toHaveBeenLastCalledWith({
      limit: 10,
      page: 2,
      search: 'existing',
      status: 'inactive',
    })
  })

  it('refreshes the last list query after updating an agent', async () => {
    const inactiveAgent = createAgent({
      _id: 'agent-1',
      fullName: 'Inactive Agent',
      isActive: false,
    })
    const updatedAgent = createAgent({
      _id: 'agent-1',
      fullName: 'Active Agent',
      isActive: true,
    })

    getAgentsMock
      .mockResolvedValueOnce(createAgentsResponse([inactiveAgent]))
      .mockResolvedValueOnce(createAgentsResponse([]))
    updateAgentMock.mockResolvedValueOnce(updatedAgent)

    const store = useAgentsStore()
    await store.fetchAgents({
      limit: 10,
      page: 1,
      search: 'inactive',
      status: 'inactive',
    })
    await store.updateAgent('agent-1', { isActive: true })

    expect(store.selectedAgent).toEqual(updatedAgent)
    expect(store.items).toEqual([])
    expect(getAgentsMock).toHaveBeenCalledTimes(2)
    expect(getAgentsMock).toHaveBeenLastCalledWith({
      limit: 10,
      page: 1,
      search: 'inactive',
      status: 'inactive',
    })
  })

  it('searches active agents for combobox usage without mutating list state', async () => {
    const activeAgent = createAgent({
      _id: 'agent-active',
      fullName: 'Active Agent',
    })

    getAgentsMock.mockResolvedValueOnce(createAgentsResponse([activeAgent]))

    const store = useAgentsStore()
    const results = await store.searchAgents({ search: 'active' })

    expect(results).toEqual([activeAgent])
    expect(store.items).toEqual([])
    expect(getAgentsMock).toHaveBeenCalledWith({
      limit: 10,
      page: 1,
      search: 'active',
      status: 'active',
    })
  })
})
