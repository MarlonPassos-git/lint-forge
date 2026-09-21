import type { BiomeRule, RuleCategory } from './types'

export const ruleCategories = [
  'JavaScript',
  'CSS',
  'JSON',
  'GraphQL',
  'HTML/ARIA',
  'General',
] satisfies RuleCategory[]

export function getRuleCategories(rule: BiomeRule): RuleCategory[] {
  if (rule.group === 'a11y') return ['HTML/ARIA']
  if (hasToken(rule, ['graphql'])) return ['GraphQL']
  if (hasToken(rule, ['json'])) return ['JSON']
  if (isCssRule(rule)) return ['CSS']
  if (isGeneralRule(rule)) return ['General']
  return ['JavaScript']
}

function isCssRule(rule: BiomeRule) {
  return hasToken(rule, [
    'css',
    'style',
    'styles',
    'class',
    'classes',
    'font',
    'gradient',
    'keyframe',
    'media',
    'selector',
  ])
}

function isGeneralRule(rule: BiomeRule) {
  return hasToken(rule, ['filename', 'file', 'folder', 'dependency', 'dependencies'])
}

function hasToken(rule: BiomeRule, tokens: string[]) {
  const haystack = `${rule.name} ${rule.summary}`.toLowerCase()
  return tokens.some((token) => haystack.includes(token))
}
