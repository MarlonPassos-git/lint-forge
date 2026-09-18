import { expect, test } from '@playwright/test'

test('reviews a rule and shows generated config output', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Lint Forge' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Warn', exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'Warn', exact: true }).click()

  await expect(page.getByRole('textbox', { name: 'Generated biome.json code' })).toHaveValue(
    /"warn"/,
  )
  await expect(page.getByText('1 decisions saved locally.')).toBeVisible()
})

test('reveals a shortcut hint and reviews a rule from the keyboard', async ({ page }) => {
  await page.goto('/')

  const warnButton = page.getByRole('button', { name: 'Warn', exact: true })
  const shortcutHint = warnButton.locator('kbd')
  await expect(warnButton).toHaveAttribute('aria-keyshortcuts', 'Shift+K')
  await expect(shortcutHint).toHaveCSS('opacity', '0')

  await warnButton.hover()
  await expect(shortcutHint).toHaveCSS('opacity', '1')
  await page.mouse.move(0, 0)
  await warnButton.focus()
  await expect(shortcutHint).toHaveCSS('opacity', '1')

  await page.keyboard.press('Shift+K')

  await expect(page.getByRole('textbox', { name: 'Generated biome.json code' })).toHaveValue(
    /"warn"/,
  )

  const backButton = page.getByRole('button', { name: 'Back, undo last decision' })
  await expect(backButton).toHaveAttribute('aria-keyshortcuts', 'Shift+B')
  await expect(backButton).toBeEnabled()
  await page.keyboard.press('Shift+B')
  await expect(page.getByRole('textbox', { name: 'Generated biome.json code' })).not.toHaveValue(
    /"warn"/,
  )
})

test('keeps category filters after reload', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('checkbox', { name: 'JavaScript' }).click()
  await page.reload()

  await expect(page.getByRole('checkbox', { name: 'JavaScript' })).not.toBeChecked()
  await expect(page.getByRole('checkbox', { name: 'CSS' })).toBeChecked()
})

test('keeps tool filters and sound settings after reload', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('checkbox', { name: 'React', exact: true }).click()
  await page.getByRole('checkbox', { name: 'Decision sounds', exact: true }).click()
  await page.reload()

  await expect(page.getByRole('checkbox', { name: 'React', exact: true })).not.toBeChecked()
  await expect(
    page.getByRole('checkbox', { name: 'Decision sounds', exact: true }),
  ).not.toBeChecked()
  await expect(page.getByRole('button', { name: 'Preview warn sound' })).toBeDisabled()
})

test('switches the decision sound pack and previews a decision', async ({ page }) => {
  await page.goto('/')

  await page.getByLabel('Pack').selectOption('zen')
  await page.getByRole('button', { name: 'Preview warn sound' }).click()
  await page.reload()

  await expect(page.getByLabel('Pack')).toHaveValue('zen')
})

test('requires confirmation before clearing review state', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('checkbox', { name: 'JavaScript' }).click()
  await page.getByRole('button', { name: 'Reset review' }).click()

  await expect(page.getByRole('dialog', { name: 'Reset review?' })).toBeVisible()

  await page.getByRole('button', { name: 'Cancel' }).click()

  await expect(page.getByRole('checkbox', { name: 'JavaScript' })).not.toBeChecked()
  await expect(page.getByRole('dialog', { name: 'Reset review?' })).toBeHidden()
})
