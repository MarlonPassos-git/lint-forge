import { describe, expect, it } from 'vitest'
import { biomeTool } from '../biome'
import { eslintTool } from '../eslint'
import { ruffTool } from '../ruff'

const tools = [biomeTool, eslintTool, ruffTool]

describe('review domain groups', () => {
  it.each(tools)('partitions every $name domain into exactly one group', (tool) => {
    const labels = Object.keys(tool.domainLabels)
    const grouped = tool.domainGroups.flatMap((group) => group.domains)

    expect(new Set(grouped)).toEqual(new Set(labels))
    expect(grouped).toHaveLength(labels.length)
  })

  it.each(tools)('labels, summarizes, and fills every $name group', (tool) => {
    expect(tool.domainSectionLabel.length).toBeGreaterThan(0)
    for (const group of tool.domainGroups) {
      expect(group.label.length).toBeGreaterThan(0)
      expect(group.summary.length).toBeGreaterThan(0)
      expect(group.domains.length).toBeGreaterThan(0)
    }
  })

  it('separates built-in, integrated, and plugin sources', () => {
    const ruffGroup = (label: string) =>
      ruffTool.domainGroups.find((group) => group.label === label)
    expect(ruffGroup('Default')?.domains).toContain('Pyflakes')
    expect(ruffGroup('Integrated linters')?.domains).toContain('isort')
    expect(ruffGroup('Plugins')?.domains).toContain('Airflow')
    expect(ruffGroup('Plugins')?.domains).toContain('flake8-bandit')

    const eslintGroup = (label: string) =>
      eslintTool.domainGroups.find((group) => group.label === label)
    expect(eslintGroup('Built in')?.domains).toEqual(['eslint'])
    expect(eslintGroup('Plugins')?.domains).toEqual(['@typescript-eslint', 'react-hooks'])
  })
})
