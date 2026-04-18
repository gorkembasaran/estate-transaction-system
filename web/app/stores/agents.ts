import { defineStore } from 'pinia'
import {
  createAgent as createAgentRequest,
  getAgentById,
  getAgents,
} from '~/services/agent.service'
import type { Agent, CreateAgentPayload } from '~/types/agent'
import { getStoreErrorMessage } from '~/utils/store-error'

const CACHE_TTL_MS = 60_000

let fetchAgentsPromise: Promise<void> | null = null

interface AgentsState {
  items: Agent[]
  selectedAgent: Agent | null
  isLoading: boolean
  error: string | null
  lastFetchedAt: number | null
}

export const useAgentsStore = defineStore('agents', {
  state: (): AgentsState => ({
    items: [],
    selectedAgent: null,
    isLoading: false,
    error: null,
    lastFetchedAt: null,
  }),

  actions: {
    async fetchAgents(forceRefresh = false): Promise<void> {
      if (!forceRefresh && isCacheFresh(this.lastFetchedAt)) {
        return
      }

      if (fetchAgentsPromise) {
        return fetchAgentsPromise
      }

      this.isLoading = true
      this.error = null

      fetchAgentsPromise = (async () => {
        try {
          this.items = await getAgents()
          this.lastFetchedAt = Date.now()
        } catch (error) {
          this.error = getStoreErrorMessage(error)
          throw error
        } finally {
          this.isLoading = false
          fetchAgentsPromise = null
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

    async createAgent(payload: CreateAgentPayload): Promise<Agent> {
      this.isLoading = true
      this.error = null

      try {
        const agent = await createAgentRequest(payload)

        this.items = [agent, ...this.items]
        this.selectedAgent = agent

        if (this.lastFetchedAt) {
          this.lastFetchedAt = Date.now()
        }

        return agent
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
