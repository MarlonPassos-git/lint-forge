import { expect, type Page, test } from '@playwright/test'

test('keeps only the active docs iframe in the keyboard tab order', async ({ page }) => {
  await page.goto('/')

  const focusedNames = await collectKeyboardControlNames(page, 15)

  expect(focusedNames).toContain('Reset review')
  expect(focusedNames).toContain('Base file')
  expect(focusedNames).toContain('Warn')
  expect(focusedNames).toContain('noAccessKey documentation')
})

test('exposes only the active rule card and documentation frame', async ({ page }) => {
  await page.goto('/')

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
  await page.goto('/')

  const progress = page.getByRole('progressbar', { name: 'Review progress' })
  await expect(progress).toHaveAttribute('max', '100')
  await expect(progress).toHaveAttribute('value', '0')
})

test('keeps eyebrow text above WCAG AA contrast', async ({ page }) => {
  await page.goto('/')

  const colors = await page.locator('.eyebrow').evaluate((eyebrow) => {
    const style = getComputedStyle(eyebrow)
    return {
      background: getComputedStyle(document.documentElement).backgroundColor,
      text: style.color,
    }
  })

  expect(getContrastRatio(colors.text, colors.background)).toBeGreaterThanOrEqual(4.5)
})

test('opens reset confirmation as a named modal dialog', async ({ page }) => {
  await page.goto('/')

  const resetButton = page.getByRole('button', { name: 'Reset review' })
  await resetButton.focus()
  await resetButton.click()

  await expect(page.getByRole('dialog', { name: 'Reset review?' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Reset everything' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Cancel' })).toBeFocused()
})

test('cancels reset with Escape and restores focus to its trigger', async ({ page }) => {
  await page.goto('/')

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
  await page.goto('/')

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
