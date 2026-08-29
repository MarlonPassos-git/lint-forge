import { describe, expect, it } from 'vitest'
import {
  buildBiomeConfig,
  extractConfiguredRuleKeys,
  formatBiomeConfig,
  getMissingRules,
  getReviewableRules,
  parseBiomeConfig,
  splitRuleKey,
  toRuleKey,
} from '../configuration'
import type { BiomeRule } from '../types'

const sampleRules: BiomeRule[] = [
  {
    group: 'correctness',
    name: 'noUnusedVariables',
    title: 'No Unused Variables',
    summary: 'Disallow unused variables.',
    url: 'https://biomejs.dev/linter/rules/no-unused-variables',
  },
  {
    group: 'style',
    name: 'useConst',
    title: 'Use Const',
    summary: 'Require const declarations.',
    url: 'https://biomejs.dev/linter/rules/use-const',
  },
]

describe('parseBiomeConfig', () => {
  it('returns an empty config for blank input', () => {
    expect(parseBiomeConfig('   ')).toEqual({})
  })

  it('throws with offending value for invalid JSON', () => {
    expect(() => parseBiomeConfig('{bad')).toThrow('Invalid biome config: "{bad"')
  })

  it.each([
    'null',
    '[]',
    '"text"',
    'true',
    '42',
  ])('throws for JSON value %s instead of an object', (inputText) => {
    expect(() => parseBiomeConfig(inputText)).toThrow(
      `Invalid biome config: "${inputText}"; expected JSON object`,
    )
  })
})

describe('extractConfiguredRuleKeys', () => {
  it('returns configured group rule keys without recommended flags', () => {
    const keys = extractConfiguredRuleKeys({
      linter: { rules: { correctness: { noUnusedVariables: 'warn', recommended: true } } },
    })

    expect([...keys]).toEqual(['correctness/noUnusedVariables'])
  })
})

describe('buildBiomeConfig', () => {
  it('adds selected Biome decision levels', () => {
    const config = buildBiomeConfig({}, [
      { ruleKey: 'correctness/noUnusedVariables', decision: 'info' },
      { ruleKey: 'style/useConst', decision: 'off' },
    ])

    expect(config.linter?.rules?.correctness).toEqual({ noUnusedVariables: 'info' })
    expect(config.linter?.rules?.style).toEqual({ useConst: 'off' })
  })
})

describe('formatBiomeConfig', () => {
  it('prints stable JSON with a trailing newline', () => {
    expect(formatBiomeConfig({ linter: { rules: {} } })).toBe(
      '{\n  "linter": {\n    "rules": {}\n  }\n}\n',
    )
  })
})

describe('getMissingRules', () => {
  it('filters rules already present in the imported config', () => {
    const missingRules = getMissingRules(sampleRules, {
      linter: { rules: { correctness: { noUnusedVariables: 'error' } } },
    })

    expect(missingRules.map(toRuleKey)).toEqual(['style/useConst'])
  })
})

describe('getReviewableRules', () => {
  it('filters imported and already decided rules', () => {
    const reviewableRules = getReviewableRules(
      sampleRules,
      { linter: { rules: { correctness: { noUnusedVariables: 'error' } } } },
      [{ ruleKey: 'style/useConst', decision: 'warn' }],
    )

    expect(reviewableRules).toEqual([])
  })
})

describe('splitRuleKey', () => {
  it('splits a valid rule key', () => {
    expect(splitRuleKey('style/useConst')).toEqual(['style', 'useConst'])
  })

  it('throws with expected shape for invalid keys', () => {
    expect(() => splitRuleKey('useConst')).toThrow('expected "group/ruleName"')
  })
})

describe('toRuleKey', () => {
  it('joins a group and rule name', () => {
    expect(toRuleKey(sampleRules[0])).toBe('correctness/noUnusedVariables')
  })
})
