import { defineStore } from 'pinia'
import {
  createAgent as createAgentRequest,
  getAgentById,
  getAgents,
} from '~/services/agent.service'
import type { Agent, CreateAgentPayload } from '~/types/agent'
import { getStoreErrorMessage } from '~/utils/store-error'

interface AgentsState {
  items: Agent[]
  selectedAgent: Agent | null
  isLoading: boolean
  error: string | null
}

export const useAgentsStore = defineStore('agents', {
  state: (): AgentsState => ({
    items: [],
    selectedAgent: null,
    isLoading: false,
    error: null,
  }),

  actions: {
    async fetchAgents(): Promise<void> {
      this.isLoading = true
      this.error = null

      try {
        this.items = await getAgents()
      } catch (error) {
        this.error = getStoreErrorMessage(error)
        throw error
      } finally {
        this.isLoading = false
      }
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
