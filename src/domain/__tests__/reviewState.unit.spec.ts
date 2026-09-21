import { describe, expect, it } from 'vitest'
import {
  appendRuleChoice,
  getCompletedRuleCount,
  getProgressPercent,
  getVisibleRuleWindow,
  removeLastRuleChoice,
} from '../reviewState'
import type { BiomeRule } from '../types'

const rules: BiomeRule[] = Array.from({ length: 5 }, (_, index) => ({
  group: 'style',
  name: `rule${index}`,
  title: `Rule ${index}`,
  summary: 'Example.',
  domains: [],
  url: `https://biomejs.dev/linter/rules/rule-${index}`,
}))

describe('getVisibleRuleWindow', () => {
  it('keeps three rules hot from the active index', () => {
    expect(getVisibleRuleWindow(rules, 1).map((rule) => rule.name)).toEqual([
      'rule1',
      'rule2',
      'rule3',
    ])
  })
})

describe('getProgressPercent', () => {
  it('does not report completion for an empty filtered deck', () => {
    expect(getProgressPercent(0, 0)).toBe(0)
  })

  it('caps progress at the total rule count', () => {
    expect(getProgressPercent(4, 8)).toBe(100)
  })
})

describe('getCompletedRuleCount', () => {
  it('counts imported configured rules before review decisions', () => {
    expect(getCompletedRuleCount(10, 4, 0)).toBe(6)
  })

  it('adds reviewed pending rules without exceeding the catalog size', () => {
    expect(getCompletedRuleCount(10, 4, 8)).toBe(10)
  })
})

describe('appendRuleChoice', () => {
  it('adds a choice for the selected rule key', () => {
    expect(appendRuleChoice([], rules[0], 'error')).toEqual([
      { ruleKey: 'style/rule0', decision: 'error' },
    ])
  })
})

describe('removeLastRuleChoice', () => {
  it('removes and returns the most recent choice', () => {
    const choices = [
      { ruleKey: 'style/rule0', decision: 'warn' as const },
      { ruleKey: 'style/rule1', decision: 'error' as const },
    ]

    expect(removeLastRuleChoice(choices)).toEqual({
      choices: [{ ruleKey: 'style/rule0', decision: 'warn' }],
      restoredChoice: { ruleKey: 'style/rule1', decision: 'error' },
    })
  })

  it('leaves an empty history unchanged', () => {
    expect(removeLastRuleChoice([])).toEqual({ choices: [], restoredChoice: undefined })
  })
})
