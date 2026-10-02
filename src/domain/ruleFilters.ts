import { biomeRules } from './biomeRules'
import { getRuleCategories, ruleCategories } from './ruleCategories'
import type { BiomeRule, RuleCategory, RuleDomain, RuleFilter } from './types'

export type RuleFilterGroup = 'categories' | 'domains'

const ruleDomainOrder = [
  'react',
  'next',
  'vue',
  'solid',
  'qwik',
  'reactNative',
  'test',
  'playwright',
  'types',
  'project',
  'drizzle',
  'turborepo',
  'tailwind',
] satisfies RuleDomain[]

export const ruleDomainLabels: Record<RuleDomain, string> = {
  drizzle: 'Drizzle ORM',
  next: 'Next.js',
  playwright: 'Playwright',
  project: 'Project',
  qwik: 'Qwik',
  react: 'React',
  reactNative: 'React Native',
  solid: 'Solid',
  tailwind: 'Tailwind CSS',
  test: 'Test',
  turborepo: 'Turborepo',
  types: 'Type-aware',
  vue: 'Vue',
}

/** Domains actually present in the generated catalog, in sidebar display order. */
export const availableRuleDomains = ruleDomainOrder.filter((domain) =>
  biomeRules.some((rule) => rule.domains.includes(domain)),
)

/**
 * A rule enters the deck only when every filter group it belongs to is satisfied:
 * rules tagged with tool domains require a selected domain, and every rule must
 * match a selected language when languages are selected. Domainless rules are
 * language-only rules, so an unchecked tool removes its tagged rules even when
 * the rule language stays selected.
 */
export function filterRulesBySelection(
  rules: BiomeRule[],
  selectedCategories: RuleCategory[],
  selectedDomains: RuleDomain[],
) {
  if (!hasSelectedFilters(selectedCategories, selectedDomains)) return []
  const selectedCategorySet = new Set(selectedCategories)
  const selectedDomainSet = new Set(selectedDomains)
  return rules.filter((rule) => isRuleSelected(rule, selectedCategorySet, selectedDomainSet))
}

function isRuleSelected(
  rule: BiomeRule,
  selectedCategorySet: Set<RuleCategory>,
  selectedDomainSet: Set<RuleDomain>,
) {
  const matchesCategory = getRuleCategories(rule).some((category) =>
    selectedCategorySet.has(category),
  )
  if (rule.domains.length === 0) return matchesCategory
  const matchesDomain = rule.domains.some((domain) => selectedDomainSet.has(domain))
  return matchesDomain && (selectedCategorySet.size === 0 || matchesCategory)
}

export function hasSelectedFilters(
  selectedCategories: RuleCategory[],
  selectedDomains: RuleDomain[],
) {
  return selectedCategories.length > 0 || selectedDomains.length > 0
}

export function toggleSelectedFilter<Filter extends RuleFilter>(
  selectedFilters: Filter[],
  filter: Filter,
): Filter[] {
  if (selectedFilters.includes(filter)) {
    return selectedFilters.filter((selectedFilter) => selectedFilter !== filter)
  }
  return [...selectedFilters, filter]
}

/** Applies an all/none action to one sidebar filter group without touching the other. */
export function setRuleFilterGroupSelection(
  group: RuleFilterGroup,
  isSelected: boolean,
  selectedCategories: RuleCategory[],
  selectedDomains: RuleDomain[],
) {
  if (group === 'categories') {
    return {
      selectedCategories: isSelected ? [...ruleCategories] : [],
      selectedDomains,
    }
  }
  return {
    selectedCategories,
    selectedDomains: isSelected ? [...availableRuleDomains] : [],
  }
}

export function isRuleDomain(value: unknown): value is RuleDomain {
  return typeof value === 'string' && Object.hasOwn(ruleDomainLabels, value)
}
