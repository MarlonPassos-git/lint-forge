import { expect, test } from '@playwright/experimental-ct-react'
import { ToolHome } from '../components/home/ToolHome'
import { ReviewWorkspace } from '../components/layout/ReviewWorkspace'
import { ResetDialog } from '../components/reset/ResetDialog'
import { FinishedStage, NoFiltersStage } from '../components/rules/EmptyStages'
import type { BiomeRule } from '../domain/types'
import App from '../ReviewApp'

const stableRule: BiomeRule = {
  group: 'style',
  name: 'useConst',
  summary: 'Require const declarations.',
  domains: [],
  title: 'Use Const',
  url: 'about:blank',
}

test('matches the tool directory visual baseline', async ({ mount }) => {
  const component = await mount(<ToolHome />)
  await expect(component).toHaveScreenshot('tool-home.png', { animations: 'disabled' })
})

test('matches app workbench visual baseline', async ({ mount }) => {
  const component = await mount(<App />)

  await expect(component).toHaveScreenshot('app-workbench.png', {
    animations: 'disabled',
    mask: [component.locator('iframe')],
  })
})

test('matches review workspace visual baseline', async ({ mount }) => {
  const component = await mount(
    <ReviewWorkspace
      controller={{
        activeRule: stableRule,
        choices: [{ decision: 'warn', ruleKey: 'style/useConst' }],
        chooseRule: () => undefined,
        errorText: '',
        hasSelectedFilter: true,
        importText: '{\n  "linter": {\n    "rules": {}\n  }\n}',
        isInputVisible: true,
        isOutputVisible: true,
        outputText:
          '{\n  "linter": {\n    "rules": {\n      "style": {\n        "useConst": "warn"\n      }\n    }\n  }\n}\n',
        outgoingDecision: null,
        setImportText: () => undefined,
        startReview: () => undefined,
        updatePanelVisibility: () => undefined,
        visibleRules: [stableRule],
      }}
    />,
  )

  await expect(component).toHaveScreenshot('review-workspace.png', {
    animations: 'disabled',
    mask: [component.locator('iframe')],
  })
})

test('matches reset confirmation visual baseline', async ({ mount }) => {
  const component = await mount(
    <ResetDialog onCancel={() => undefined} onConfirm={() => undefined} />,
  )

  await expect(component).toHaveScreenshot('reset-dialog.png', {
    animations: 'disabled',
  })
})

test('matches empty review states visual baseline', async ({ mount }) => {
  const component = await mount(
    <div className="visual-empty-states">
      <NoFiltersStage />
      <FinishedStage />
    </div>,
  )

  await expect(component).toHaveScreenshot('empty-review-states.png', {
    animations: 'disabled',
  })
})
