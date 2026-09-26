import { toRuleKey } from '../configuration'
import { getRuleCategories } from '../ruleCategories'
import { type RuleFilterGroup, toggleSelectedFilter } from '../ruleFilters'
import type { ReviewSnapshot, RuleFilter } from '../types'
import type { ReviewTool } from './types'

export function toolStorageKey(tool: ReviewTool) {
  return tool.id === 'biome' ? 'biome-rule-swipe:v1' : `lint-forge:${tool.id}:v1`
}

export function initialToolSnapshot(tool: ReviewTool): ReviewSnapshot {
  return {
    baseConfigText: tool.defaultInput,
    choices: [],
    currentIndex: 0,
    filters: {
      selectedCategories: [...tool.categories],
      selectedDomains: Object.keys(tool.domainLabels),
    },
    panels: { inputVisible: true, outputVisible: true },
  }
}

export function toggleToolFilter(
  snapshot: ReviewSnapshot,
  filter: RuleFilter,
  tool: ReviewTool,
): ReviewSnapshot {
  const filters = snapshot.filters ?? initialToolSnapshot(tool).filters
  const selectedCategories = filters?.selectedCategories ?? tool.categories
  const selectedDomains = filters?.selectedDomains ?? Object.keys(tool.domainLabels)
  const isDomain = Object.hasOwn(tool.domainLabels, filter)
  return {
    ...snapshot,
    currentIndex: 0,
    filters: {
      selectedCategories: isDomain
        ? selectedCategories
        : toggleSelectedFilter(selectedCategories, filter as (typeof selectedCategories)[number]),
      selectedDomains: isDomain ? toggleSelectedFilter(selectedDomains, filter) : selectedDomains,
    },
  }
}

export function selectToolFilterGroup(
  snapshot: ReviewSnapshot,
  group: RuleFilterGroup,
  selected: boolean,
  tool: ReviewTool,
): ReviewSnapshot {
  const filters = snapshot.filters ?? initialToolSnapshot(tool).filters
  return {
    ...snapshot,
    currentIndex: 0,
    filters: {
      selectedCategories:
        group === 'categories'
          ? selected
            ? [...tool.categories]
            : []
          : (filters?.selectedCategories ?? tool.categories),
      selectedDomains:
        group === 'domains'
          ? selected
            ? Object.keys(tool.domainLabels)
            : []
          : (filters?.selectedDomains ?? Object.keys(tool.domainLabels)),
    },
  }
}

export function undoToolChoice(snapshot: ReviewSnapshot, tool: ReviewTool): ReviewSnapshot {
  const lastChoice = snapshot.choices.at(-1)
  if (!lastChoice) return snapshot
  const rule = tool.rules.find((candidate) => toRuleKey(candidate) === lastChoice.ruleKey)
  const filters = snapshot.filters ?? initialToolSnapshot(tool).filters
  return {
    ...snapshot,
    choices: snapshot.choices.slice(0, -1),
    currentIndex: Math.max(0, snapshot.currentIndex - 1),
    filters: {
      selectedCategories: [
        ...new Set([
          ...(filters?.selectedCategories ?? tool.categories),
          ...(rule ? getRuleCategories(rule) : []),
        ]),
      ],
      selectedDomains: [
        ...new Set([
          ...(filters?.selectedDomains ?? Object.keys(tool.domainLabels)),
          ...(rule?.domains ?? []),
        ]),
      ],
    },
  }
}
