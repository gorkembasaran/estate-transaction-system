import type {
  Transaction,
  TransactionAgentReference,
  TransactionAgentSummary,
  TransactionStage,
} from '~/types/transaction'

const stageLabels: Record<TransactionStage, string> = {
  agreement: 'Agreement',
  earnest_money: 'Earnest Money',
  title_deed: 'Title Deed',
  completed: 'Completed',
}

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  day: '2-digit',
  hour: 'numeric',
  minute: '2-digit',
  month: 'short',
  year: 'numeric',
})

const numberFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
})
const currencySymbolOverrides: Record<string, string> = {
  TRY: '₺',
}
export interface RevenueSummary {
  currencyTotals: Array<{
    amount: number
    currency: string
    formattedAmount: string
  }>
  hasMultipleCurrencies: boolean
  supportingLabel: string
  value: string
}

export function getTransactionStageLabel(stage: TransactionStage): string {
  return stageLabels[stage]
}

export function isPopulatedAgent(
  value: TransactionAgentReference,
): value is TransactionAgentSummary {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value.fullName === 'string'
  )
}

export function getAgentDisplayName(value: TransactionAgentReference): string {
  if (isPopulatedAgent(value)) {
    return value.fullName
  }

  return 'Unknown agent'
}

export function getAgentDisplayEmail(value: TransactionAgentReference): string {
  if (isPopulatedAgent(value)) {
    return value.email
  }

  return 'Email unavailable'
}

export function getAgentEditPath(
  value: TransactionAgentReference,
): string | null {
  const agentId = isPopulatedAgent(value) ? value._id : value

  return agentId ? `/agents/${agentId}/edit` : null
}

export function formatDate(value: string): string {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Unknown date'
  }

  return dateFormatter.format(date)
}

export function formatDateTime(value: string): string {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Unknown date'
  }

  return dateTimeFormatter.format(date)
}

export function formatAmountWithCurrency(
  amount: number,
  currency: string,
): string {
  const normalizedCurrency = currency.toUpperCase()
  const currencySymbol = currencySymbolOverrides[normalizedCurrency]

  if (currencySymbol) {
    return `${currencySymbol}${numberFormatter.format(amount)}`
  }

  try {
    return new Intl.NumberFormat('en-US', {
      currency: normalizedCurrency,
      maximumFractionDigits: 2,
      minimumFractionDigits: 0,
      style: 'currency',
    }).format(amount)
  } catch {
    return `${numberFormatter.format(amount)} ${normalizedCurrency}`
  }
}

export function getCompletedRevenueSummary(
  transactions: Transaction[],
): RevenueSummary {
  const completedTransactions = transactions.filter(
    (transaction) => transaction.stage === 'completed',
  )

  if (completedTransactions.length === 0) {
    return {
      currencyTotals: [],
      hasMultipleCurrencies: false,
      supportingLabel: 'From 0 completed transactions',
      value: '0',
    }
  }

  const totalsByCurrency = completedTransactions.reduce<Record<string, number>>(
    (totals, transaction) => {
      const currency = transaction.currency.toUpperCase()

      totals[currency] = (totals[currency] ?? 0) + transaction.totalServiceFee

      return totals
    },
    {},
  )
  const currencyTotals = Object.entries(totalsByCurrency)
    .map(([currency, amount]) => ({
      amount,
      currency,
      formattedAmount: formatAmountWithCurrency(amount, currency),
    }))
    .sort((a, b) => b.amount - a.amount)

  const hasMultipleCurrencies = currencyTotals.length > 1

  return {
    currencyTotals,
    hasMultipleCurrencies,
    supportingLabel: `From ${completedTransactions.length} completed transaction${
      completedTransactions.length === 1 ? '' : 's'
    }`,
    value: currencyTotals[0]?.formattedAmount ?? '0',
  }
}
