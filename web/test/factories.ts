import type { Agent } from '~/types/agent'
import type { Transaction, TransactionStage } from '~/types/transaction'

export function createAgent(overrides: Partial<Agent> = {}): Agent {
  return {
    _id: 'agent-1',
    createdAt: '2026-04-18T10:00:00.000Z',
    email: 'sarah.johnson@example.com',
    fullName: 'Sarah Johnson',
    isActive: true,
    updatedAt: '2026-04-18T10:00:00.000Z',
    ...overrides,
  }
}

export function createTransaction(
  overrides: Partial<Transaction> = {},
): Transaction {
  const stage: TransactionStage = overrides.stage ?? 'agreement'

  return {
    _id: 'transaction-1',
    breakdown: null,
    createdAt: '2026-04-18T10:00:00.000Z',
    currency: 'USD',
    listingAgentId: createAgent({ _id: 'agent-1' }),
    propertyTitle: 'Luxury Penthouse Downtown',
    sellingAgentId: createAgent({
      _id: 'agent-2',
      email: 'michael.chen@example.com',
      fullName: 'Michael Chen',
    }),
    stage,
    stageHistory: [
      {
        changedAt: '2026-04-18T10:00:00.000Z',
        fromStage: null,
        toStage: 'agreement',
      },
    ],
    totalServiceFee: 45000,
    updatedAt: '2026-04-18T10:00:00.000Z',
    ...overrides,
  }
}
