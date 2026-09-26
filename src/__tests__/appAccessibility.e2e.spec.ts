import { expect, type Page, test } from '@playwright/test'

test('keeps only the active docs iframe in the keyboard tab order', async ({ page }) => {
  await page.goto('/biome')

  const focusedNames = await collectKeyboardControlNames(page, 14)

  expect(focusedNames).toContain('Reset review')
  expect(focusedNames).toContain('Base file')
  expect(focusedNames).toContain('Warn')
  expect(focusedNames).toContain('noAccessKey documentation')
})

test('opens the review setup menu from the keyboard and closes it with Escape', async ({
  page,
}) => {
  await page.goto('/biome')

  const trigger = page.getByRole('button', { name: 'Review setup' })
  const javascriptFilter = page.getByRole('checkbox', { name: 'JavaScript' })
  await trigger.focus()
  await expect(trigger).toHaveAttribute('aria-expanded', 'false')

  await page.keyboard.press('Enter')
  await expect(trigger).toHaveAttribute('aria-expanded', 'true')
  await expect(javascriptFilter).toBeVisible()

  await page.keyboard.press('Tab')
  await expect(page.getByRole('button', { name: 'Select all Languages' })).toBeFocused()
  await page.keyboard.press('Tab')
  await page.keyboard.press('Tab')
  await expect(javascriptFilter).toBeFocused()
  await page.keyboard.press('Space')
  await expect(javascriptFilter).not.toBeChecked()

  await page.keyboard.press('Escape')
  await expect(trigger).toHaveAttribute('aria-expanded', 'false')
  await expect(javascriptFilter).toBeHidden()
  await expect(trigger).toBeFocused()

  await page.keyboard.press('Enter')
  await expect(javascriptFilter).toBeVisible()
  await page.getByRole('heading', { name: 'Lint Forge' }).click()
  await expect(javascriptFilter).toBeHidden()
})

test('offers a focused skip link before active documentation', async ({ page }) => {
  await page.goto('/biome')

  const startButton = page.getByRole('button', { name: 'Start from this config' })
  const skipLink = page.getByRole('link', { name: 'Skip documentation' })
  await expect(skipLink).toHaveCSS('clip-path', 'inset(50%)')
  await startButton.focus()
  await page.keyboard.press('Tab')
  await expect(skipLink).toBeFocused()
  await expect(skipLink).toHaveCSS('clip-path', 'none')
  await page.keyboard.press('Tab')
  await expect(page.locator('iframe.docs-frame').first()).toBeFocused()

  await skipLink.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('group', { name: 'Rule decisions' })).toBeFocused()
})

test('exposes only the active rule card and documentation frame', async ({ page }) => {
  await page.goto('/biome')

  const frames = page.locator('iframe.docs-frame')
  const cards = page.getByRole('article', { includeHidden: true })
  await expect(frames).toHaveCount(3)
  await expect(cards).toHaveCount(3)
  await expect(frames.nth(0)).toHaveAttribute('tabindex', '0')
  await expect(frames.nth(0)).not.toHaveAttribute('aria-hidden')

  for (const frameIndex of [1, 2]) {
    await expect(frames.nth(frameIndex)).toHaveAttribute('tabindex', '-1')
    await expect(frames.nth(frameIndex)).toHaveAttribute('aria-hidden', 'true')
    await expect(cards.nth(frameIndex)).toHaveAttribute('inert', '')
    await expect(cards.nth(frameIndex)).toHaveAttribute('aria-hidden', 'true')
  }

  await expect(page.getByRole('article').first()).toHaveAccessibleName('noAccessKey')
})

test('uses a named semantic progress indicator', async ({ page }) => {
  await page.goto('/biome')

  const progress = page.getByRole('progressbar', { name: 'Review progress' })
  await expect(progress).toHaveAttribute('max', '100')
  await expect(progress).toHaveAttribute('value', '0')
})

test('keeps the app title above WCAG AA contrast', async ({ page }) => {
  await page.goto('/biome')

  const colors = await page
    .getByRole('heading', { name: 'Lint Forge', exact: true })
    .evaluate((heading) => {
      const style = getComputedStyle(heading)
      return {
        background: getComputedStyle(document.documentElement).backgroundColor,
        text: style.color,
      }
    })

  expect(getContrastRatio(colors.text, colors.background)).toBeGreaterThanOrEqual(4.5)
})

test('opens reset confirmation as a named modal dialog', async ({ page }) => {
  await page.goto('/biome')

  const resetButton = page.getByRole('button', { name: 'Reset review' })
  await resetButton.focus()
  await resetButton.click()

  await expect(page.getByRole('dialog', { name: 'Reset review?' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Reset everything' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Cancel' })).toBeFocused()
})

test('cancels reset with Escape and restores focus to its trigger', async ({ page }) => {
  await page.goto('/biome')

  const resetButton = page.getByRole('button', { name: 'Reset review' })
  await resetButton.click()
  await expect(page.getByRole('dialog', { name: 'Reset review?' })).toBeVisible()

  await page.keyboard.press('Escape')

  await expect(page.getByRole('dialog', { name: 'Reset review?' })).toBeHidden()
  await expect(resetButton).toBeFocused()
})

test('cancels reset from the form and restores focus to its trigger', async ({ page }) => {
  const browserConsoleProblems: string[] = []
  page.on('console', (message) => {
    if (['error', 'warning'].includes(message.type())) {
      browserConsoleProblems.push(message.text())
    }
  })
  await page.goto('/biome')

  const resetButton = page.getByRole('button', { name: 'Reset review' })
  await resetButton.click()
  await page.getByRole('button', { name: 'Cancel' }).click()

  await expect(page.getByRole('dialog', { name: 'Reset review?' })).toBeHidden()
  await expect(resetButton).toBeFocused()
  expect(browserConsoleProblems).toEqual([])
})

async function collectKeyboardControlNames(page: Page, expectedNameCount: number) {
  const focusedNames: string[] = []

  while (focusedNames.length < expectedNameCount) {
    await page.keyboard.press('Tab')
    const focusedName = await getFocusedControlName(page)
    if (focusedName !== '') focusedNames.push(focusedName)
  }

  return focusedNames
}

async function getFocusedControlName(page: Page) {
  return page.evaluate(() => {
    const focusedElement = document.activeElement

    if (!focusedElement) return ''
    if (focusedElement === document.body) return ''
    if (
      focusedElement instanceof HTMLInputElement ||
      focusedElement instanceof HTMLTextAreaElement
    ) {
      return focusedElement.labels?.[0]?.textContent?.trim() ?? ''
    }
    const labelledBy = focusedElement.getAttribute('aria-labelledby')
    if (labelledBy) {
      return labelledBy
        .split(/\s+/)
        .map((id) => document.getElementById(id)?.textContent?.trim() ?? '')
        .join(' ')
    }
    return (
      focusedElement.getAttribute('aria-label') ??
      focusedElement.getAttribute('title') ??
      focusedElement.textContent?.trim() ??
      ''
    )
  })
}

function getContrastRatio(textColor: string, backgroundColor: string) {
  const textLuminance = getRelativeLuminance(textColor)
  const backgroundLuminance = getRelativeLuminance(backgroundColor)
  const lighter = Math.max(textLuminance, backgroundLuminance)
  const darker = Math.min(textLuminance, backgroundLuminance)
  return (lighter + 0.05) / (darker + 0.05)
}

function getRelativeLuminance(rgbColor: string) {
  const channels = rgbColor.match(/\d+/g)?.slice(0, 3).map(Number)
  if (channels?.length !== 3) {
    throw new Error(`Invalid color: ${rgbColor}; expected CSS rgb() value`)
  }
  const [red, green, blue] = channels.map(linearizeColorChannel)
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue
}

function linearizeColorChannel(channel: number) {
  const normalizedChannel = channel / 255
  if (normalizedChannel <= 0.04045) return normalizedChannel / 12.92
  return ((normalizedChannel + 0.055) / 1.055) ** 2.4
}
