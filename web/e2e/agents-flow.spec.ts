import { expect, test } from '@playwright/test'

test.describe('agents management flow', () => {
  test.skip(
    process.env.E2E_MODE === 'deployed',
    'Mutating agent flows are intended for local E2E runs.',
  )

  test('creates an agent and edits it through the UI', async ({ page }) => {
    const suffix = `${Date.now()}-${Math.round(Math.random() * 100000)}`
    const initialName = `E2E Agent ${suffix}`
    const updatedName = `${initialName} Updated`
    const email = `e2e-agent-${suffix}@example.com`

    await page.goto('/agents/create')

    await expect(page.getByTestId('create-agent-page')).toBeVisible()
    await expect(page.getByTestId('agent-full-name-input')).toHaveValue('')
    await expect(page.getByTestId('agent-email-input')).toHaveValue('')
    await page.getByTestId('agent-full-name-input').fill(initialName)
    await page.getByTestId('agent-email-input').fill(email)
    await expect(page.getByTestId('agent-full-name-input')).toHaveValue(initialName)
    await expect(page.getByTestId('agent-email-input')).toHaveValue(email)

    await Promise.all([
      page.waitForURL('**/agents'),
      page.getByTestId('create-agent-submit').click(),
    ])

    await expect(
      page.getByRole('heading', { level: 1, name: 'Agents' }),
    ).toBeVisible()
    await page.getByLabel('Search agents').fill(email)

    const createdRow = page.locator('tbody tr').filter({ hasText: email }).first()

    await expect(createdRow).toContainText(initialName)
    await createdRow.getByRole('link', { name: 'Edit Agent' }).click()

    await expect(page.getByTestId('edit-agent-page')).toBeVisible()
    await expect(page.getByTestId('agent-email-input')).toHaveValue(email)
    await expect(page.getByTestId('agent-full-name-input')).toHaveValue(initialName)
    await page.getByTestId('agent-full-name-input').fill(updatedName)
    await page.getByTestId('agent-is-active-input').uncheck()
    await expect(page.getByTestId('agent-full-name-input')).toHaveValue(updatedName)
    await expect(page.getByTestId('agent-is-active-input')).not.toBeChecked()

    await Promise.all([
      page.waitForURL('**/agents'),
      page.getByTestId('edit-agent-submit').click(),
    ])

    await page.getByLabel('Search agents').fill(email)

    const updatedRow = page.locator('tbody tr').filter({ hasText: email }).first()

    await expect(updatedRow).toContainText(updatedName)
    await expect(updatedRow).toContainText('Inactive')
  })
})
