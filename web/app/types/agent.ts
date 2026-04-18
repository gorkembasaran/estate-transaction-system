export interface Agent {
  _id: string
  fullName: string
  email: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateAgentPayload {
  fullName: string
  email: string
  isActive?: boolean
}

export interface UpdateAgentPayload {
  fullName?: string
  email?: string
  isActive?: boolean
}

export type AgentStatusFilter = 'all' | 'active' | 'inactive'

export interface GetAgentsParams {
  limit?: number
  page?: number
  search?: string
  status?: AgentStatusFilter
}

export interface AgentPaginationMeta {
  hasNextPage: boolean
  hasPreviousPage: boolean
  limit: number
  page: number
  totalItems: number
  totalPages: number
}

export interface PaginatedAgentsResponse {
  items: Agent[]
  meta: AgentPaginationMeta
}
