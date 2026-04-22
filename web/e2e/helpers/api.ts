import type { APIRequestContext } from '@playwright/test'

const apiBaseUrl = process.env.PLAYWRIGHT_API_BASE_URL?.trim()
  || (process.env.E2E_MODE === 'deployed'
    ? 'https://estate-transaction-api.onrender.com'
    : 'http://127.0.0.1:3001')

export interface AgentSeed {
  _id: string
  email: string
  fullName: string
  isActive: boolean
}

export async function createAgentViaApi(
  request: APIRequestContext,
  overrides: Partial<Pick<AgentSeed, 'email' | 'fullName' | 'isActive'>> = {},
): Promise<AgentSeed> {
  const suffix = `${Date.now()}-${Math.round(Math.random() * 100000)}`
  const payload = {
    email: overrides.email ?? `e2e-agent-${suffix}@example.com`,
    fullName: overrides.fullName ?? `E2E Agent ${suffix}`,
    isActive: overrides.isActive ?? true,
  }

  const response = await request.post(`${apiBaseUrl}/agents`, {
    data: payload,
  })

  if (!response.ok()) {
    throw new Error(`Could not create agent seed: ${response.status()} ${await response.text()}`)
  }

  return await response.json()
}
