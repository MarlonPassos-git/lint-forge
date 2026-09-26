import { expect, type Route, test } from '@playwright/test'

class FakeRuleDocumentation {
  async respond(route: Route) {
    await route.fulfill({
      contentType: 'text/html',
      body: '<!doctype html><html lang="en"><title>Rule documentation</title><body><h1>Official rule documentation fixture</h1></body></html>',
    })
  }
}

test.beforeEach(async ({ page }) => {
  const docs = new FakeRuleDocumentation()
  await page.route(
    /^https:\/\/(biomejs\.dev|eslint\.org|docs\.astral\.sh|typescript-eslint\.io|react\.dev)\//,
    (route) => docs.respond(route),
  )
})

test('navigates the home and restores reviews using browser back, forward and reload', async ({
  page,
}) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Choose your linter' })).toBeVisible()
  await expect(page.locator('iframe')).toHaveCount(0)
  await page.getByRole('link', { name: 'Configure ESLint' }).click()
  await expect(page).toHaveURL(/\/eslint$/)
  await page.getByRole('button', { name: 'Warn', exact: true }).click()
  await expect(page.getByText('1 decisions saved locally.')).toBeVisible()
  await page.getByRole('link', { name: 'All tools' }).click()
  await page.getByRole('link', { name: 'Configure Ruff' }).click()
  await page.getByRole('button', { name: 'Enable', exact: true }).click()
  await expect(page.getByRole('textbox', { name: 'Generated ruff.toml code' })).toHaveValue(
    /extend-select/,
  )
  await page.reload()
  await expect(page.getByText('1 decisions saved locally.')).toBeVisible()
  await page.goBack()
  await expect(page.getByRole('heading', { name: 'Choose your linter' })).toBeVisible()
  await page.goBack()
  await expect(page.getByRole('textbox', { name: 'Generated eslint.config.mjs code' })).toHaveValue(
    /"warn"/,
  )
  await page.goForward()
  await expect(page.getByRole('heading', { name: 'Choose your linter' })).toBeVisible()
})

for (const tool of [
  {
    path: 'eslint',
    name: 'ESLint',
    choice: 'Error',
    filename: 'eslint.config.mjs',
    language: 'TypeScript',
  },
  { path: 'ruff', name: 'Ruff', choice: 'Enable', filename: 'ruff.toml', language: 'Python' },
]) {
  test(`${tool.name} deep link supports review, undo, filters, panels and reset`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto(`/${tool.path}/`)
    await expect(page.getByRole('heading', { name: `Generated ${tool.filename}` })).toBeVisible()
    await expect(page.locator('iframe.docs-frame')).toHaveCount(3)
    await page.getByRole('button', { name: tool.choice, exact: true }).click()
    await expect(page.getByText('1 decisions saved locally.')).toBeVisible()
    await page.getByRole('button', { name: 'Back, undo last decision' }).click()
    await expect(page.getByText('0 decisions saved locally.')).toBeVisible()
    await page.getByRole('button', { name: 'Hide output' }).click()
    await page.reload()
    await page.getByRole('button', { name: `Show ${tool.filename}` }).click()
    await page.getByRole('button', { name: 'Review setup' }).click()
    await expect(
      page.getByRole('checkbox', { name: tool.language, exact: true }).first(),
    ).toBeVisible()
    await page.getByRole('button', { name: 'Clear all Languages' }).click()
    await page.getByRole('button', { name: 'Clear all Tools' }).click()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('button', { name: 'Review setup' })).toBeFocused()
    await expect(page.getByRole('heading', { name: 'No filters selected.' })).toBeVisible()
    await page.reload()
    await expect(page.getByRole('heading', { name: 'No filters selected.' })).toBeVisible()
    await page.getByRole('button', { name: 'Reset review' }).click()
    await expect(page.getByRole('dialog', { name: 'Reset review?' })).toBeVisible()
    await page.getByRole('button', { name: 'Reset everything' }).click()
    await expect(page.getByRole('button', { name: tool.choice, exact: true })).toBeVisible()
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      ),
    ).toBe(0)
    expect(errors).toEqual([])
  })
}
