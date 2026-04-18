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
const comparisonPeriodInMs = 30 * 24 * 60 * 60 * 1000

export type MetricTone = 'positive' | 'negative' | 'neutral'

export interface CompletedTransactionsTrendSummary {
  label: string
  tone: MetricTone
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

export function getAgentDisplayName(
  value: TransactionAgentReference,
): string {
  if (isPopulatedAgent(value)) {
    return value.fullName
  }

  return 'Unknown agent'
}

export function getAgentDisplayEmail(
  value: TransactionAgentReference,
): string {
  if (isPopulatedAgent(value)) {
    return value.email
  }

  return 'Email unavailable'
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

  const totalsByCurrency = completedTransactions.reduce<
    Record<string, number>
  >((totals, transaction) => {
    const currency = transaction.currency.toUpperCase()

    totals[currency] = (totals[currency] ?? 0) + transaction.totalServiceFee

    return totals
  }, {})
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

export function getCompletedTransactionsTrendSummary(
  transactions: Transaction[],
): CompletedTransactionsTrendSummary | null {
  const now = Date.now()
  const currentPeriodStart = now - comparisonPeriodInMs
  const previousPeriodStart = currentPeriodStart - comparisonPeriodInMs

  let currentPeriodCount = 0
  let previousPeriodCount = 0

  for (const transaction of transactions) {
    if (transaction.stage !== 'completed') {
      continue
    }

    const completedAt = getTransactionCompletedAt(transaction)

    if (!completedAt) {
      continue
    }

    if (completedAt >= currentPeriodStart && completedAt <= now) {
      currentPeriodCount += 1
      continue
    }

    if (
      completedAt >= previousPeriodStart &&
      completedAt < currentPeriodStart
    ) {
      previousPeriodCount += 1
    }
  }

  if (currentPeriodCount === 0 && previousPeriodCount === 0) {
    return null
  }

  if (previousPeriodCount === 0) {
    return {
      label: 'New activity',
      tone: 'neutral',
    }
  }

  const delta = currentPeriodCount - previousPeriodCount

  if (delta > 0) {
    return {
      label: `+${delta} vs prev. 30d`,
      tone: 'positive',
    }
  }

  if (delta < 0) {
    return {
      label: `${delta} vs prev. 30d`,
      tone: 'negative',
    }
  }

  return {
    label: 'Stable',
    tone: 'neutral',
  }
}

function getTransactionCompletedAt(transaction: Transaction): number | null {
  const completedHistoryItem = [...transaction.stageHistory]
    .reverse()
    .find((historyItem) => historyItem.toStage === 'completed')

  return (
    getTimestamp(completedHistoryItem?.changedAt) ??
    getTimestamp(transaction.updatedAt) ??
    getTimestamp(transaction.createdAt)
  )
}

function getTimestamp(value: string | undefined): number | null {
  if (!value) {
    return null
  }

  const timestamp = new Date(value).getTime()

  return Number.isNaN(timestamp) ? null : timestamp
}
