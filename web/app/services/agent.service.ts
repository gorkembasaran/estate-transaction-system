import type { AxiosInstance } from 'axios'
import type { Agent, CreateAgentPayload } from '~/types/agent'

function getApiClient(): AxiosInstance {
  return useNuxtApp().$api
}

export async function getAgents(): Promise<Agent[]> {
  const { data } = await getApiClient().get<Agent[]>('/agents')

  return data
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
