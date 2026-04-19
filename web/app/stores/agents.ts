import { defineStore } from 'pinia'
import {
  createAgent as createAgentRequest,
  getAgentById,
  getAgents,
  updateAgent as updateAgentRequest,
} from '~/services/agent.service'
import type {
  Agent,
  AgentPaginationMeta,
  CreateAgentPayload,
  GetAgentsParams,
  UpdateAgentPayload,
} from '~/types/agent'
import { getStoreErrorMessage } from '~/utils/store-error'

const CACHE_TTL_MS = 60_000
const DEFAULT_PAGE = 1
const DEFAULT_LIMIT = 100

let fetchAgentsPromise: Promise<void> | null = null
let fetchAgentsKey: string | null = null

interface AgentsState {
  items: Agent[]
  selectedAgent: Agent | null
  isLoading: boolean
  error: string | null
  lastFetchedAt: number | null
  lastFetchKey: string | null
  lastFetchParams: GetAgentsParams | null
  pagination: AgentPaginationMeta
}

type FetchAgentsOptions = (GetAgentsParams & { forceRefresh?: boolean }) | boolean

export const useAgentsStore = defineStore('agents', {
  state: (): AgentsState => ({
    items: [],
    selectedAgent: null,
    isLoading: false,
    error: null,
    lastFetchedAt: null,
    lastFetchKey: null,
    lastFetchParams: null,
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
    async fetchAgents(options: FetchAgentsOptions = {}): Promise<void> {
      const { forceRefresh, params } = normalizeFetchOptions(options)
      const requestKey = createRequestKey(params)

      if (
        !forceRefresh &&
        this.lastFetchKey === requestKey &&
        isCacheFresh(this.lastFetchedAt)
      ) {
        return
      }

      if (fetchAgentsPromise && fetchAgentsKey === requestKey) {
        return fetchAgentsPromise
      }

      this.isLoading = true
      this.error = null
      fetchAgentsKey = requestKey

      fetchAgentsPromise = (async () => {
        try {
          const response = await getAgents(params)

          this.items = response.items
          this.pagination = response.meta
          this.lastFetchedAt = Date.now()
          this.lastFetchKey = requestKey
          this.lastFetchParams = cloneFetchParams(params)
        } catch (error) {
          this.error = getStoreErrorMessage(error)
          throw error
        } finally {
          this.isLoading = false
          fetchAgentsPromise = null
          fetchAgentsKey = null
        }
      })()

      return fetchAgentsPromise
    },

    async fetchAgentById(id: string): Promise<void> {
      this.isLoading = true
      this.error = null

      try {
        this.selectedAgent = await getAgentById(id)
      } catch (error) {
        this.error = getStoreErrorMessage(error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async searchAgents(params: GetAgentsParams = {}): Promise<Agent[]> {
      const response = await getAgents({
        limit: params.limit ?? 10,
        page: params.page ?? DEFAULT_PAGE,
        search: params.search || undefined,
        status: params.status ?? 'active',
      })

      return response.items
    },

    async createAgent(payload: CreateAgentPayload): Promise<Agent> {
      this.isLoading = true
      this.error = null

      try {
        const agent = await createAgentRequest(payload)

        this.selectedAgent = agent
        await this.refreshLastFetchedList()

        return agent
      } catch (error) {
        this.error = getStoreErrorMessage(error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async updateAgent(id: string, payload: UpdateAgentPayload): Promise<Agent> {
      this.isLoading = true
      this.error = null

      try {
        const agent = await updateAgentRequest(id, payload)

        this.selectedAgent = agent
        await this.refreshLastFetchedList()

        return agent
      } catch (error) {
        this.error = getStoreErrorMessage(error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async refreshLastFetchedList(): Promise<void> {
      const params = this.lastFetchParams
        ? cloneFetchParams(this.lastFetchParams)
        : null

      this.lastFetchedAt = null

      if (!params) {
        return
      }

      await this.fetchAgents({
        ...params,
        forceRefresh: true,
      }).catch(() => undefined)
    },
  },
})

function isCacheFresh(lastFetchedAt: number | null): boolean {
  return lastFetchedAt !== null && Date.now() - lastFetchedAt < CACHE_TTL_MS
}

function normalizeFetchOptions(options: FetchAgentsOptions): {
  forceRefresh: boolean
  params: GetAgentsParams
} {
  if (typeof options === 'boolean') {
    return {
      forceRefresh: options,
      params: {
        limit: DEFAULT_LIMIT,
        page: DEFAULT_PAGE,
        status: 'all',
      },
    }
  }

  const { forceRefresh = false, ...params } = options

  return {
    forceRefresh,
    params: {
      limit: params.limit ?? DEFAULT_LIMIT,
      page: params.page ?? DEFAULT_PAGE,
      search: params.search || undefined,
      status: params.status ?? 'all',
    },
  }
}

function createRequestKey(params: GetAgentsParams): string {
  return JSON.stringify({
    limit: params.limit ?? DEFAULT_LIMIT,
    page: params.page ?? DEFAULT_PAGE,
    search: params.search ?? '',
    status: params.status ?? 'all',
  })
}

function cloneFetchParams(params: GetAgentsParams): GetAgentsParams {
  return {
    limit: params.limit,
    page: params.page,
    search: params.search,
    status: params.status,
  }
}
