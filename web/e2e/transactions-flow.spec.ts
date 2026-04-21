import { expect, test, type Page } from '@playwright/test'
import { createAgentViaApi } from './helpers/api'

test.describe('transactions management flow', () => {
  test.skip(
    process.env.E2E_MODE === 'deployed',
    'Mutating transaction flows are intended for local E2E runs.',
  )

  test('creates a transaction and completes its lifecycle through the UI', async ({
    page,
    request,
  }) => {
    const suffix = `${Date.now()}-${Math.round(Math.random() * 100000)}`
    const listingAgent = await createAgentViaApi(request, {
      fullName: `E2E Listing ${suffix}`,
    })
    const sellingAgent = await createAgentViaApi(request, {
      fullName: `E2E Selling ${suffix}`,
    })
    const propertyTitle = `E2E Property ${suffix}`

    await page.goto('/transactions/create')

    await expect(page.getByTestId('create-transaction-page')).toBeVisible()
    await page.getByTestId('transaction-property-title-input').fill(propertyTitle)

    await selectAgentFromCombobox(
      page,
      'listingAgentId',
      listingAgent.fullName,
    )
    await selectAgentFromCombobox(
      page,
      'sellingAgentId',
      sellingAgent.fullName,
    )

    await page.getByTestId('transaction-service-fee-input').fill('45000')
    await page.getByTestId('transaction-currency-select').selectOption('USD')

    await Promise.all([
      page.waitForURL('**/transactions'),
      page.getByTestId('create-transaction-submit').click(),
    ])

    await expect(
      page.getByRole('heading', { level: 1, name: 'Transactions' }),
    ).toBeVisible()
    await page.getByLabel('Search transactions').fill(propertyTitle)

    const transactionRow = page
      .locator('tbody tr')
      .filter({ hasText: propertyTitle })
      .first()

    await expect(transactionRow).toContainText('Agreement')
    await transactionRow.getByRole('link', { name: 'View Details' }).click()

    await expect(page.getByTestId('transaction-detail-page')).toBeVisible()
    await expect(page.getByTestId('transaction-current-stage')).toContainText(
      'Agreement',
    )

    await advanceTransactionStage(page, 'earnest_money', 'Earnest Money')
    await advanceTransactionStage(page, 'title_deed', 'Title Deed')
    await advanceTransactionStage(page, 'completed', 'Completed')

    await expect(page.getByTestId('transaction-breakdown-section')).toContainText(
      'Agency Amount',
    )
    await expect(page.getByTestId('transaction-breakdown-section')).toContainText(
      listingAgent.fullName,
    )
    await expect(page.getByTestId('transaction-breakdown-section')).toContainText(
      sellingAgent.fullName,
    )
  })
})

async function selectAgentFromCombobox(
  page: Page,
  fieldName: string,
  agentName: string,
): Promise<void> {
  await page.getByTestId(`${fieldName}-combobox-control`).click()
  await page.getByTestId(`${fieldName}-combobox-search`).fill(agentName)
  await page
    .locator(`[data-testid="${fieldName}-combobox-option"]`)
    .filter({ hasText: agentName })
    .first()
    .click()
}

async function advanceTransactionStage(
  page: Page,
  nextStageValue: string,
  expectedStageLabel: string,
): Promise<void> {
  await page.getByTestId('transaction-stage-select').selectOption(nextStageValue)
  await page.getByTestId('transaction-stage-submit').click()

  await expect(page.getByTestId('transaction-current-stage')).toContainText(
    expectedStageLabel,
  )
}
