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
