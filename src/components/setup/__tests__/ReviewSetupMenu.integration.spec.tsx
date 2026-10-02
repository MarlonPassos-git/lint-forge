import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ruleCategories } from '../../../domain/ruleCategories'
import { availableRuleDomains } from '../../../domain/ruleFilters'
import { biomeTool } from '../../../domain/tools/biome'
import { ruffTool } from '../../../domain/tools/ruff'
import { ReviewToolContext } from '../../review/ReviewToolContext'
import { ReviewSetupMenu } from '../ReviewSetupMenu'

function createSetupMenuProps(
  overrides: Partial<Parameters<typeof ReviewSetupMenu>[0]> = {},
): Parameters<typeof ReviewSetupMenu>[0] {
  return {
    selectedCategories: [...ruleCategories],
    selectedDomains: [...availableRuleDomains],
    onDomainSelection: vi.fn(),
    onFilterGroupSelection: vi.fn(),
    onFilterToggle: vi.fn(),
    ...overrides,
  }
}

function renderSetupMenu(overrides: Partial<Parameters<typeof ReviewSetupMenu>[0]> = {}) {
  const props = createSetupMenuProps(overrides)
  render(<ReviewSetupMenu {...props} />)
  return props
}

async function openSetupMenu() {
  await userEvent.click(screen.getByRole('button', { name: 'Review setup' }))
}

describe('ReviewSetupMenu', () => {
  it('keeps filters hidden until the menu opens', async () => {
    renderSetupMenu()

    expect(screen.queryByRole('checkbox', { name: 'JavaScript' })).not.toBeInTheDocument()

    await openSetupMenu()

    expect(screen.getByRole('checkbox', { name: 'JavaScript' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'React' })).toBeChecked()
    expect(screen.queryByRole('checkbox', { name: 'Tailwind CSS' })).not.toBeInTheDocument()
  })

  it('reports a filter toggle for languages and tools', async () => {
    const props = renderSetupMenu()
    await openSetupMenu()

    await userEvent.click(screen.getByRole('checkbox', { name: 'CSS' }))
    await userEvent.click(screen.getByRole('checkbox', { name: 'Vue' }))

    expect(props.onFilterToggle).toHaveBeenNthCalledWith(1, 'CSS')
    expect(props.onFilterToggle).toHaveBeenNthCalledWith(2, 'vue')
  })

  it('selects and clears whole filter groups with their tri-state toggles', async () => {
    const props = renderSetupMenu({ selectedDomains: [] })
    await openSetupMenu()

    const languagesToggle = screen.getByRole('checkbox', {
      name: 'Toggle all Languages',
    }) as HTMLInputElement
    const sourcesToggle = screen.getByRole('checkbox', {
      name: 'Toggle all Frameworks & ecosystems',
    }) as HTMLInputElement
    expect(languagesToggle).toBeChecked()
    expect(sourcesToggle.indeterminate).toBe(false)
    expect(sourcesToggle).not.toBeChecked()

    await userEvent.click(languagesToggle)
    await userEvent.click(sourcesToggle)

    expect(props.onFilterGroupSelection).toHaveBeenNthCalledWith(1, 'categories', false)
    expect(props.onFilterGroupSelection).toHaveBeenNthCalledWith(2, 'domains', true)
  })

  it('groups Biome ecosystems by kind', async () => {
    renderSetupMenu()
    await openSetupMenu()

    expect(screen.getByRole('heading', { name: 'Frameworks & ecosystems' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Frameworks' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Testing' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Tooling' })).toBeInTheDocument()
  })

  it('selects every domain of a partial group from its tri-state toggle', async () => {
    const frameworkDomains = biomeTool.domainGroups.find(
      (group) => group.label === 'Frameworks',
    )?.domains
    const props = renderSetupMenu({
      selectedDomains: availableRuleDomains.filter((domain) => domain !== 'react'),
    })
    await openSetupMenu()

    const groupToggle = screen.getByRole('checkbox', {
      name: 'Toggle all Frameworks',
    }) as HTMLInputElement
    expect(groupToggle.indeterminate).toBe(true)
    expect(groupToggle).not.toBeChecked()

    await userEvent.click(groupToggle)

    expect(props.onDomainSelection).toHaveBeenCalledWith(frameworkDomains, true)
  })

  it('clears every domain of a fully selected group from its toggle', async () => {
    const testingDomains = biomeTool.domainGroups.find(
      (group) => group.label === 'Testing',
    )?.domains
    const props = renderSetupMenu()
    await openSetupMenu()

    const groupToggle = screen.getByRole('checkbox', {
      name: 'Toggle all Testing',
    }) as HTMLInputElement
    expect(groupToggle).toBeChecked()
    expect(groupToggle.indeterminate).toBe(false)

    await userEvent.click(groupToggle)

    expect(props.onDomainSelection).toHaveBeenCalledWith(testingDomains, false)
  })

  it('separates Ruff built-in linters from plugins', async () => {
    const props = createSetupMenuProps({
      selectedDomains: Object.keys(ruffTool.domainLabels),
    })
    render(
      <ReviewToolContext.Provider value={ruffTool}>
        <ReviewSetupMenu {...props} />
      </ReviewToolContext.Provider>,
    )
    await openSetupMenu()

    expect(screen.getByRole('heading', { name: 'Rule sources' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Default' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Plugins' })).toBeInTheDocument()
    expect(screen.getByText(/third-party flake8 plugins/)).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: 'Pyflakes' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Airflow' })).toBeChecked()
  })

  it('opens from the keyboard and tabs into the filter controls', async () => {
    renderSetupMenu()
    const trigger = screen.getByRole('button', { name: 'Review setup' })

    trigger.focus()
    await userEvent.keyboard('{Enter}')

    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(document.activeElement).toBe(document.getElementById('review-setup-popover'))

    await userEvent.tab()
    expect(screen.getByRole('checkbox', { name: 'Toggle all Languages' })).toHaveFocus()

    await userEvent.tab()
    expect(screen.getByRole('checkbox', { name: 'JavaScript' })).toHaveFocus()
  })

  it('closes with Escape and restores focus to the trigger', async () => {
    renderSetupMenu()
    const trigger = screen.getByRole('button', { name: 'Review setup' })

    trigger.focus()
    await userEvent.keyboard('{Enter}')
    expect(screen.getByRole('checkbox', { name: 'JavaScript' })).toBeVisible()

    await userEvent.keyboard('{Escape}')

    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('checkbox', { name: 'JavaScript' })).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })
})
