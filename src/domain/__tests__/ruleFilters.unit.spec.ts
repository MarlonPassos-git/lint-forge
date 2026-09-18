import { describe, expect, it } from 'vitest'
import { biomeRules } from '../biomeRules'
import { ruleCategories } from '../ruleCategories'
import {
  availableRuleDomains,
  filterRulesBySelection,
  hasSelectedFilters,
  isRuleDomain,
  setRuleFilterGroupSelection,
  toggleSelectedFilter,
} from '../ruleFilters'
import type { BiomeRule } from '../types'

const reactRule: BiomeRule = {
  group: 'correctness',
  name: 'noReactPropAssignments',
  title: 'No React Prop Assignments',
  summary: 'Disallow assigning to React component props.',
  domains: ['react'],
  url: 'https://biomejs.dev/linter/rules/no-react-prop-assignments',
}

const vueRule: BiomeRule = {
  group: 'nursery',
  name: 'noVueVIfWithVFor',
  title: 'No Vue V If With V For',
  summary: 'Disallow v-if with v-for on the same element.',
  domains: ['vue'],
  url: 'https://biomejs.dev/linter/rules/no-vue-v-if-with-v-for',
}

const jsRule: BiomeRule = {
  group: 'suspicious',
  name: 'noDebugger',
  title: 'No Debugger',
  summary: 'Disallow the debugger statement.',
  domains: [],
  url: 'https://biomejs.dev/linter/rules/no-debugger',
}

const cssRule: BiomeRule = {
  group: 'correctness',
  name: 'noInvalidDirectionInLinearGradient',
  title: 'No Invalid Direction In Linear Gradient',
  summary: 'Disallow non-standard direction values for linear gradient functions.',
  domains: [],
  url: 'https://biomejs.dev/linter/rules/no-invalid-direction-in-linear-gradient',
}

describe('filterRulesBySelection', () => {
  it('returns an empty deck when nothing is selected', () => {
    expect(filterRulesBySelection([reactRule, jsRule], [], [])).toEqual([])
  })

  it('matches rules by selected language', () => {
    expect(filterRulesBySelection([reactRule, jsRule, cssRule], ['CSS'], [])).toEqual([cssRule])
  })

  it('matches rules by selected tool domain', () => {
    expect(filterRulesBySelection([reactRule, vueRule, jsRule], [], ['react'])).toEqual([reactRule])
  })

  it('includes a rule when its language or its tool domain is selected', () => {
    expect(filterRulesBySelection([reactRule, vueRule, cssRule], ['CSS'], ['vue'])).toEqual([
      vueRule,
      cssRule,
    ])
  })
})

describe('hasSelectedFilters', () => {
  it('reports false when both filter groups are empty', () => {
    expect(hasSelectedFilters([], [])).toBe(false)
  })

  it('reports true when only a tool domain is selected', () => {
    expect(hasSelectedFilters([], ['react'])).toBe(true)
  })
})

describe('toggleSelectedFilter', () => {
  it('adds an unselected filter', () => {
    expect(toggleSelectedFilter(['CSS'], 'GraphQL')).toEqual(['CSS', 'GraphQL'])
  })

  it('removes a selected filter', () => {
    expect(toggleSelectedFilter(['CSS', 'JSON'], 'CSS')).toEqual(['JSON'])
  })
})

describe('setRuleFilterGroupSelection', () => {
  it('selects every language without touching tools', () => {
    expect(setRuleFilterGroupSelection('categories', true, [], ['react'])).toEqual({
      selectedCategories: [...ruleCategories],
      selectedDomains: ['react'],
    })
  })

  it('clears every tool domain without touching languages', () => {
    expect(setRuleFilterGroupSelection('domains', false, ['CSS'], ['react'])).toEqual({
      selectedCategories: ['CSS'],
      selectedDomains: [],
    })
  })
})

describe('availableRuleDomains', () => {
  it('lists only domains that classify at least one catalog rule', () => {
    expect(availableRuleDomains).toContain('react')
    expect(
      availableRuleDomains.every((domain) =>
        biomeRules.some((rule) => rule.domains.includes(domain)),
      ),
    ).toBe(true)
  })
})

describe('isRuleDomain', () => {
  it('accepts known Biome domains', () => {
    expect(isRuleDomain('react')).toBe(true)
  })

  it('rejects language categories and unknown values', () => {
    expect(isRuleDomain('JavaScript')).toBe(false)
    expect(isRuleDomain('reactjs')).toBe(false)
  })
})
