import { expect, test } from '@playwright/test'

test('reviews a rule and shows generated config output', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Lint Forge' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Warn' })).toBeVisible()

  await page.getByRole('button', { name: 'Warn' }).click()

  await expect(page.getByRole('textbox', { name: 'Generated biome.json code' })).toHaveValue(
    /"warn"/,
  )
  await expect(page.getByText('1 decisions saved locally.')).toBeVisible()
})

test('reveals a shortcut hint and reviews a rule from the keyboard', async ({ page }) => {
  await page.goto('/')

  const warnButton = page.getByRole('button', { name: 'Warn' })
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
})

test('keeps category filters after reload', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('checkbox', { name: 'JavaScript' }).click()
  await page.reload()

  await expect(page.getByRole('checkbox', { name: 'JavaScript' })).not.toBeChecked()
  await expect(page.getByRole('checkbox', { name: 'CSS' })).toBeChecked()
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
