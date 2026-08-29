import { expect, test } from '@playwright/test'

test('reveals Biome documents after the largest app paint', async ({ page }) => {
  await page.addInitScript(observeLargestPaint)
  await page.goto('/')
  await expect(page.locator('iframe.docs-frame').first()).toHaveAttribute('src', /biomejs\.dev/)
  await page.waitForFunction(() => {
    const browserWindow = window as typeof window & { largestPaintTime?: number }
    return (
      (browserWindow.largestPaintTime ?? 0) > 0 &&
      performance.getEntriesByName('lint-forge-rule-document-reveal').length === 3
    )
  })

  const loadOrder = await page.evaluate(() => ({
    largestPaint: (window as typeof window & { largestPaintTime?: number }).largestPaintTime,
    ruleDocuments: performance
      .getEntriesByName('lint-forge-rule-document-reveal')
      .map((entry) => entry.startTime),
  }))

  expect(Math.min(...loadOrder.ruleDocuments)).toBeGreaterThanOrEqual(loadOrder.largestPaint ?? 0)
})

function observeLargestPaint() {
  const browserWindow = window as typeof window & { largestPaintTime?: number }
  const observer = new PerformanceObserver((entries) => {
    const largestPaint = entries.getEntries().at(-1)
    if (largestPaint) browserWindow.largestPaintTime = largestPaint.startTime
  })
  observer.observe({ buffered: true, type: 'largest-contentful-paint' })
}
