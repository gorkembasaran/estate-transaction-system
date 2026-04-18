import type { AxiosInstance } from 'axios'
import type {
  Agent,
  CreateAgentPayload,
  GetAgentsParams,
  PaginatedAgentsResponse,
  UpdateAgentPayload,
} from '~/types/agent'

type AgentsListResponse = Agent[] | PaginatedAgentsResponse

function getApiClient(): AxiosInstance {
  return useNuxtApp().$api
}

export async function getAgents(
  params?: GetAgentsParams,
): Promise<PaginatedAgentsResponse> {
  const { data } = await getApiClient().get<AgentsListResponse>('/agents', {
    params,
  })

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

export async function getAgentById(id: string): Promise<Agent> {
  const { data } = await getApiClient().get<Agent>(`/agents/${id}`)

  return data
}

export async function createAgent(
  payload: CreateAgentPayload,
): Promise<Agent> {
  const { data } = await getApiClient().post<Agent>('/agents', payload)

  return data
}

export async function updateAgent(
  id: string,
  payload: UpdateAgentPayload,
): Promise<Agent> {
  const { data } = await getApiClient().patch<Agent>(`/agents/${id}`, payload)

  return data
}
