export type TransactionStage =
  | 'agreement'
  | 'earnest_money'
  | 'title_deed'
  | 'completed'

export interface StageHistoryItem {
  fromStage: TransactionStage | null
  toStage: TransactionStage
  changedAt: string
}

export interface FinancialBreakdown {
  agencyAmount: number
  listingAgentAmount: number
  sellingAgentAmount: number
  listingAgentReason: string
  sellingAgentReason: string
  calculatedAt: string
}

export interface TransactionAgentSummary {
  _id: string
  fullName: string
  email: string
}

export type TransactionAgentReference = string | TransactionAgentSummary

export interface Transaction {
  _id: string
  propertyTitle: string
  totalServiceFee: number
  currency: string
  listingAgentId: TransactionAgentReference
  sellingAgentId: TransactionAgentReference
  stage: TransactionStage
  breakdown: FinancialBreakdown | null
  stageHistory: StageHistoryItem[]
  createdAt: string
  updatedAt: string
}

export interface CreateTransactionPayload {
  propertyTitle: string
  totalServiceFee: number
  currency: string
  listingAgentId: string
  sellingAgentId: string
}

export interface UpdateTransactionStagePayload {
  stage: TransactionStage
}
