import { toRuleKey } from './configuration'
import type { BiomeRule, RuleChoice } from './types'

export function getVisibleRuleWindow(rules: BiomeRule[], currentIndex: number) {
  return rules.slice(currentIndex, currentIndex + 3)
}

export function getProgressPercent(totalRules: number, currentIndex: number) {
  if (totalRules === 0) return 0
  return Math.round((Math.min(currentIndex, totalRules) / totalRules) * 100)
}

export function getCompletedRuleCount(
  totalRules: number,
  pendingRules: number,
  currentIndex: number,
) {
  const configuredRules = Math.max(totalRules - pendingRules, 0)
  return Math.min(configuredRules + currentIndex, totalRules)
}

export function appendRuleChoice(
  choices: RuleChoice[],
  rule: BiomeRule,
  decision: RuleChoice['decision'],
) {
  return [...choices, { ruleKey: toRuleKey(rule), decision }]
}

export function removeLastRuleChoice(choices: RuleChoice[]) {
  const restoredChoice = choices.at(-1)
  if (!restoredChoice) return { choices, restoredChoice }
  return { choices: choices.slice(0, -1), restoredChoice }
}
