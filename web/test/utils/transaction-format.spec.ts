import { describe, expect, it } from 'vitest'
import { createAgent, createTransaction } from '../factories'
import {
  formatAmountWithCurrency,
  formatDate,
  getAgentDisplayEmail,
  getAgentDisplayName,
  getCompletedRevenueSummary,
  getTransactionStageLabel,
  isPopulatedAgent,
} from '~/utils/transaction-format'

describe('transaction-format utilities', () => {
  it('formats transaction stage labels for user-facing UI', () => {
    expect(getTransactionStageLabel('agreement')).toBe('Agreement')
    expect(getTransactionStageLabel('earnest_money')).toBe('Earnest Money')
    expect(getTransactionStageLabel('title_deed')).toBe('Title Deed')
    expect(getTransactionStageLabel('completed')).toBe('Completed')
  })

  it('safely formats populated and raw agent references', () => {
    const populatedAgent = createAgent({
      email: 'listing@example.com',
      fullName: 'Listing Agent',
    })

    expect(isPopulatedAgent(populatedAgent)).toBe(true)
    expect(getAgentDisplayName(populatedAgent)).toBe('Listing Agent')
    expect(getAgentDisplayEmail(populatedAgent)).toBe('listing@example.com')
    expect(isPopulatedAgent('agent-id')).toBe(false)
    expect(getAgentDisplayName('agent-id')).toBe('Unknown agent')
    expect(getAgentDisplayEmail('agent-id')).toBe('Email unavailable')
  })

  it('formats known and custom currency values without losing currency context', () => {
    expect(formatAmountWithCurrency(12500, 'TRY')).toBe('₺12,500')
    expect(formatAmountWithCurrency(45000, 'USD')).toBe('$45,000')
    expect(formatAmountWithCurrency(987.65, 'INVALID')).toBe('987.65 INVALID')
  })

  it('returns a safe fallback for invalid dates', () => {
    expect(formatDate('not-a-date')).toBe('Unknown date')
  })

  it('summarizes completed revenue by currency and uses the largest currency total as primary value', () => {
    const summary = getCompletedRevenueSummary([
      createTransaction({
        _id: 'completed-usd',
        currency: 'USD',
        stage: 'completed',
        totalServiceFee: 1000,
      }),
      createTransaction({
        _id: 'completed-eur',
        currency: 'EUR',
        stage: 'completed',
        totalServiceFee: 500,
      }),
      createTransaction({
        _id: 'active-try',
        currency: 'TRY',
        stage: 'agreement',
        totalServiceFee: 999999,
      }),
    ])

    expect(summary.hasMultipleCurrencies).toBe(true)
    expect(summary.value).toBe('$1,000')
    expect(summary.supportingLabel).toBe('From 2 completed transactions')
    expect(summary.currencyTotals.map((item) => item.currency)).toEqual([
      'USD',
      'EUR',
    ])
  })

})
