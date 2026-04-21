import { expect, test } from '@playwright/test'

test.describe('application smoke @smoke', () => {
  test('loads the dashboard shell and recent transactions preview', async ({
    page,
  }) => {
    await page.goto('/')

    await expect(
      page.getByRole('heading', { level: 1, name: 'Dashboard' }),
    ).toBeVisible()
    await expect(page.getByText('Total Transactions')).toBeVisible()
    await expect(page.getByText('Recent Transactions')).toBeVisible()
    await expect(page.getByRole('link', { name: 'View all' })).toBeVisible()
  })

  test('loads the transactions management page', async ({ page }) => {
    await page.goto('/transactions')

    await expect(
      page.getByRole('heading', { level: 1, name: 'Transactions' }),
    ).toBeVisible()
    await expect(
      page.getByRole('link', { name: 'Create Transaction' }),
    ).toBeVisible()
    await expect(page.getByLabel('Search transactions')).toBeVisible()
  })

  test('loads the agents management page', async ({ page }) => {
    await page.goto('/agents')

    await expect(
      page.getByRole('heading', { level: 1, name: 'Agents' }),
    ).toBeVisible()
    await expect(page.getByRole('link', { name: 'Create Agent' })).toBeVisible()
    await expect(page.getByLabel('Search agents')).toBeVisible()
  })
})
