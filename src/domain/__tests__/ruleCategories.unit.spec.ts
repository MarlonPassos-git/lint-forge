import { describe, expect, it } from 'vitest'
import { getRuleCategories } from '../ruleCategories'
import type { BiomeRule } from '../types'

const cssRule: BiomeRule = {
  group: 'correctness',
  name: 'noInvalidDirectionInLinearGradient',
  title: 'No Invalid Direction In Linear Gradient',
  summary: 'Disallow non-standard direction values for linear gradient functions.',
  domains: [],
  url: 'https://biomejs.dev/linter/rules/no-invalid-direction-in-linear-gradient',
}

const ariaRule: BiomeRule = {
  group: 'a11y',
  name: 'noAccessKey',
  title: 'No Access Key',
  summary: 'Enforce that the accesskey attribute is not used on any HTML element.',
  domains: [],
  url: 'https://biomejs.dev/linter/rules/no-access-key',
}

const jsRule: BiomeRule = {
  group: 'suspicious',
  name: 'noDebugger',
  title: 'No Debugger',
  summary: 'Disallow the debugger statement.',
  domains: [],
  url: 'https://biomejs.dev/linter/rules/no-debugger',
}

describe('getRuleCategories', () => {
  it('classifies accessibility rules as HTML/ARIA', () => {
    expect(getRuleCategories(ariaRule)).toEqual(['HTML/ARIA'])
  })

  it('classifies CSS-shaped rules as CSS', () => {
    expect(getRuleCategories(cssRule)).toEqual(['CSS'])
  })

  it('falls back to JavaScript for common lint rules', () => {
    expect(getRuleCategories(jsRule)).toEqual(['JavaScript'])
  })
})
