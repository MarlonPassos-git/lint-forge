import { describe, expect, it } from 'vitest'
import { filterRulesBySelection } from '../../ruleFilters'
import { biomeTool } from '../biome'
import { eslintTool } from '../eslint'
import {
  initialToolSnapshot,
  selectToolDomains,
  selectToolFilterGroup,
  toggleToolFilter,
  toolStorageKey,
  undoToolChoice,
} from '../reviewSnapshot'
import { ruffTool } from '../ruff'

describe('tool-specific review state', () => {
  it('preserves the legacy Biome key and isolates other tools', () => {
    expect(toolStorageKey(biomeTool)).toBe('biome-rule-swipe:v1')
    expect(new Set([biomeTool, eslintTool, ruffTool].map(toolStorageKey)).size).toBe(3)
  })

  it.each([
    biomeTool,
    eslintTool,
    ruffTool,
  ])('initializes all $name filters and applies all/none to only one group', (tool) => {
    const initial = initialToolSnapshot(tool)
    const languagesOff = selectToolFilterGroup(initial, 'categories', false, tool)
    expect(languagesOff.filters?.selectedDomains).toEqual(Object.keys(tool.domainLabels))
    const none = selectToolFilterGroup(languagesOff, 'domains', false, tool)
    expect(
      filterRulesBySelection(
        tool.rules,
        none.filters?.selectedCategories ?? [],
        none.filters?.selectedDomains ?? [],
      ),
    ).toEqual([])
    const languagesRestored = selectToolFilterGroup(none, 'categories', true, tool)
    const languageOnlyRules = tool.rules.filter((rule) => rule.domains.length === 0)
    expect(
      filterRulesBySelection(
        tool.rules,
        languagesRestored.filters?.selectedCategories ?? [],
        languagesRestored.filters?.selectedDomains ?? [],
      ),
    ).toHaveLength(languageOnlyRules.length)
    const fullyRestored = selectToolFilterGroup(languagesRestored, 'domains', true, tool)
    expect(
      filterRulesBySelection(
        tool.rules,
        fullyRestored.filters?.selectedCategories ?? [],
        fullyRestored.filters?.selectedDomains ?? [],
      ),
    ).toHaveLength(tool.rules.length)
  })

  it('selects and clears a domain subset and resets the index', () => {
    const initial = { ...initialToolSnapshot(ruffTool), currentIndex: 5 }
    const cleared = selectToolDomains(initial, ['Airflow', 'FastAPI'], false, ruffTool)
    expect(cleared.currentIndex).toBe(0)
    expect(cleared.filters?.selectedDomains).not.toContain('Airflow')
    expect(cleared.filters?.selectedDomains).not.toContain('FastAPI')
    expect(cleared.filters?.selectedDomains).toContain('Pyflakes')

    const restored = selectToolDomains(cleared, ['Airflow', 'FastAPI'], true, ruffTool)
    expect(new Set(restored.filters?.selectedDomains)).toEqual(
      new Set(Object.keys(ruffTool.domainLabels)),
    )
  })

  it('selects Ruff family filters independently of the Python language', () => {
    let snapshot = initialToolSnapshot(ruffTool)
    snapshot = selectToolFilterGroup(snapshot, 'categories', false, ruffTool)
    snapshot = selectToolFilterGroup(snapshot, 'domains', false, ruffTool)
    snapshot = toggleToolFilter(snapshot, 'Pyflakes', ruffTool)
    const filtered = filterRulesBySelection(
      ruffTool.rules,
      [],
      snapshot.filters?.selectedDomains ?? [],
    )
    expect(filtered.length).toBeGreaterThan(0)
    expect(filtered.every((rule) => rule.domains.includes('Pyflakes'))).toBe(true)
    expect(toggleToolFilter(snapshot, 'Pyflakes', ruffTool).filters?.selectedDomains).toEqual([])
  })

  it('undo restores the last rule and its filters', () => {
    const empty = initialToolSnapshot(eslintTool)
    expect(undoToolChoice(empty, eslintTool)).toBe(empty)
    const snapshot = {
      ...empty,
      choices: [{ ruleKey: '@typescript-eslint/no-explicit-any', decision: 'warn' as const }],
      currentIndex: 1,
      filters: { selectedCategories: [], selectedDomains: [] },
    }
    const restored = undoToolChoice(snapshot, eslintTool)
    expect(restored.choices).toEqual([])
    expect(restored.currentIndex).toBe(0)
    expect(restored.filters?.selectedCategories).toContain('TypeScript')
    expect(restored.filters?.selectedDomains).toContain('@typescript-eslint')
  })
})
