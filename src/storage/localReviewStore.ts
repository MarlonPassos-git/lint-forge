import { ruleCategories } from '../domain/ruleCategories'
import type { ReviewSnapshot, RuleCategory } from '../domain/types'

const STORE_KEY = 'biome-rule-swipe:v1'

type StoredReviewSnapshot = Omit<ReviewSnapshot, 'choices'> & {
  choices: StoredRuleChoice[]
}

type StoredRuleChoice = Omit<ReviewSnapshot['choices'][number], 'decision'> & {
  decision: ReviewSnapshot['choices'][number]['decision'] | 'ignored'
}

const storedDecisionValues = ['error', 'info', 'warn', 'off', 'ignored'] as const

export function loadReviewSnapshot(storage: Storage): ReviewSnapshot | null {
  const storedValue = storage.getItem(STORE_KEY)
  if (!storedValue) return null

  try {
    const parsedSnapshot: unknown = JSON.parse(storedValue)
    assertStoredReviewSnapshot(parsedSnapshot)
    return migrateReviewSnapshot(parsedSnapshot)
  } catch {
    storage.removeItem(STORE_KEY)
    return null
  }
}

export function saveReviewSnapshot(storage: Storage, snapshot: ReviewSnapshot) {
  storage.setItem(STORE_KEY, JSON.stringify(snapshot))
}

export function clearReviewSnapshot(storage: Storage) {
  storage.removeItem(STORE_KEY)
}

function migrateReviewSnapshot(snapshot: StoredReviewSnapshot): ReviewSnapshot {
  return {
    ...snapshot,
    choices: snapshot.choices.map((choice) => ({
      ...choice,
      decision: choice.decision === 'ignored' ? 'off' : choice.decision,
    })),
  }
}

function assertStoredReviewSnapshot(value: unknown): asserts value is StoredReviewSnapshot {
  if (!isRecord(value)) throw invalidSnapshot('root', value, 'JSON object')
  if (typeof value.baseConfigText !== 'string') {
    throw invalidSnapshot('baseConfigText', value.baseConfigText, 'string')
  }
  if (!isNonNegativeSafeInteger(value.currentIndex)) {
    throw invalidSnapshot('currentIndex', value.currentIndex, 'non-negative safe integer')
  }
  if (!Array.isArray(value.choices)) {
    throw invalidSnapshot('choices', value.choices, 'array of rule choices')
  }
  assertStoredChoices(value.choices)
  assertOptionalPanels(value.panels)
  assertOptionalFilters(value.filters)
}

function assertStoredChoices(values: unknown[]): asserts values is StoredRuleChoice[] {
  for (const value of values) {
    assertStoredChoice(value)
  }
}

function assertStoredChoice(value: unknown): asserts value is StoredRuleChoice {
  if (!isRecord(value)) throw invalidSnapshot('choice', value, 'object')
  if (!isRuleKey(value.ruleKey))
    throw invalidSnapshot('choice.ruleKey', value.ruleKey, 'string "group/ruleName"')
  if (!isStoredDecision(value.decision)) {
    throw invalidSnapshot('choice.decision', value.decision, 'error, info, warn, off, or ignored')
  }
}

function assertOptionalPanels(value: unknown): void {
  if (value === undefined) return
  if (!isRecord(value)) throw invalidSnapshot('panels', value, 'object')
  if (typeof value.inputVisible !== 'boolean') {
    throw invalidSnapshot('panels.inputVisible', value.inputVisible, 'boolean')
  }
  if (typeof value.outputVisible !== 'boolean') {
    throw invalidSnapshot('panels.outputVisible', value.outputVisible, 'boolean')
  }
}

function assertOptionalFilters(value: unknown): void {
  if (value === undefined) return
  if (!isRecord(value)) throw invalidSnapshot('filters', value, 'object')
  if (!Array.isArray(value.selectedCategories)) {
    throw invalidSnapshot(
      'filters.selectedCategories',
      value.selectedCategories,
      'array of rule categories',
    )
  }
  for (const category of value.selectedCategories) {
    if (!isRuleCategory(category)) {
      throw invalidSnapshot('filters.selectedCategories', category, 'known rule category')
    }
  }
}

function isRuleKey(value: unknown): value is string {
  if (typeof value !== 'string' || value !== value.trim()) return false
  const segments = value.split('/')
  return segments.length === 2 && segments.every((segment) => segment.length > 0)
}

function isNonNegativeSafeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
}

function isStoredDecision(value: unknown): value is StoredRuleChoice['decision'] {
  return (
    typeof value === 'string' &&
    storedDecisionValues.includes(value as (typeof storedDecisionValues)[number])
  )
}

function isRuleCategory(value: unknown): value is RuleCategory {
  const category = value as RuleCategory
  return typeof value === 'string' && ruleCategories.includes(category)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  const isObject = typeof value === 'object' && value !== null
  return isObject && !Array.isArray(value)
}

function invalidSnapshot(field: string, value: unknown, expected: string): Error {
  return new Error(
    `Invalid review snapshot ${field}: ${describeSnapshotValue(value)}; expected ${expected}`,
  )
}

function describeSnapshotValue(value: unknown): string {
  if (typeof value === 'string') return JSON.stringify(value.slice(0, 80))
  return JSON.stringify(value)?.slice(0, 80) ?? String(value)
}
