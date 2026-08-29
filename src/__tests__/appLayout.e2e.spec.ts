import { expect, type Locator, type Page, test } from '@playwright/test'

type ReviewLayoutMetrics = {
  documentPrefetchCount: number
  iframeCount: number
  overflowX: number
  preconnectCount: number
  queuedFrameVisibility: string[]
}

async function getReviewLayoutMetrics(page: Page): Promise<ReviewLayoutMetrics> {
  return page.evaluate(() => ({
    documentPrefetchCount: document.querySelectorAll(
      'link[data-biome-rule-prefetch="true"][rel="prefetch"][as="document"]',
    ).length,
    iframeCount: document.querySelectorAll('iframe.docs-frame').length,
    overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    preconnectCount: document.querySelectorAll(
      'link[data-biome-rule-prefetch="true"][rel="preconnect"]',
    ).length,
    queuedFrameVisibility: Array.from(
      document.querySelectorAll(
        '.rule-frame.is-queued-next .docs-frame, .rule-frame.is-queued-after .docs-frame',
      ),
      (frame) => getComputedStyle(frame).visibility,
    ),
  }))
}

test('keeps active review layout within documented resource bounds', async ({ page }) => {
  await page.goto('/')

  const metrics = await getReviewLayoutMetrics(page)
  expect(metrics.iframeCount).toBe(3)
  expect(metrics.preconnectCount).toBe(1)
  expect(metrics.documentPrefetchCount).toBeGreaterThan(0)
  expect(metrics.documentPrefetchCount).toBeLessThanOrEqual(6)
  expect(metrics.queuedFrameVisibility).toEqual(['hidden', 'hidden'])
  expect(metrics.overflowX).toBe(0)
})

test('keeps panel toggles usable without horizontal overflow', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Hide base file' }).click()
  await page.getByRole('button', { name: 'Hide output' }).click()

  await expect(page.getByRole('button', { name: 'Show base file' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Show biome.json' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Lint Forge' })).toBeVisible()
  expect(await getHorizontalOverflow(page)).toBe(0)
})

test('keeps mobile review layout free of horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ height: 900, width: 320 })
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Lint Forge' })).toBeVisible()
  const errorButton = page.getByRole('button', { name: 'Error' })
  await errorButton.scrollIntoViewIfNeeded()
  await expectControlInsideViewport(errorButton, 320, 900)
  expect(await getHorizontalOverflow(page)).toBe(0)
})

test('keeps every desktop decision control inside the viewport', async ({ page }) => {
  await page.setViewportSize({ height: 900, width: 1440 })
  await page.goto('/')

  for (const decision of ['Off', 'Info', 'Warn', 'Error']) {
    await expectControlInsideViewport(page.getByRole('button', { name: decision }), 1440, 900)
  }
})

async function getHorizontalOverflow(page: Page) {
  return page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
}

async function expectControlInsideViewport(
  control: Locator,
  viewportWidth: number,
  viewportHeight: number,
) {
  const bounds = await control.boundingBox()
  expect(bounds).not.toBeNull()
  expect(bounds?.x).toBeGreaterThanOrEqual(0)
  expect((bounds?.x ?? 0) + (bounds?.width ?? 0)).toBeLessThanOrEqual(viewportWidth)
  expect(bounds?.y).toBeGreaterThanOrEqual(0)
  expect((bounds?.y ?? 0) + (bounds?.height ?? 0)).toBeLessThanOrEqual(viewportHeight)
}
