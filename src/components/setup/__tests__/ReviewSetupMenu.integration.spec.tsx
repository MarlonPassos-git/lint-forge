import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ruleCategories } from '../../../domain/ruleCategories'
import { availableRuleDomains } from '../../../domain/ruleFilters'
import { ReviewSetupMenu } from '../ReviewSetupMenu'

function createSetupMenuProps(
  overrides: Partial<Parameters<typeof ReviewSetupMenu>[0]> = {},
): Parameters<typeof ReviewSetupMenu>[0] {
  return {
    audioEnabled: true,
    selectedCategories: [...ruleCategories],
    selectedDomains: [...availableRuleDomains],
    onAudioToggle: vi.fn(),
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

  it('selects and clears whole filter groups', async () => {
    const props = renderSetupMenu()
    await openSetupMenu()

    await userEvent.click(screen.getByRole('button', { name: 'Clear all Languages' }))
    await userEvent.click(screen.getByRole('button', { name: 'Select all Tools' }))

    expect(props.onFilterGroupSelection).toHaveBeenNthCalledWith(1, 'categories', false)
    expect(props.onFilterGroupSelection).toHaveBeenNthCalledWith(2, 'domains', true)
  })

  it('reports the sound switch and shows its state', async () => {
    const props = renderSetupMenu()
    await openSetupMenu()

    const soundSwitch = screen.getByRole('switch', { name: 'Decision sounds' })
    expect(soundSwitch).toBeChecked()
    expect(screen.getByText('On')).toBeInTheDocument()

    await userEvent.click(soundSwitch)

    expect(props.onAudioToggle).toHaveBeenCalledTimes(1)
  })

  it('shows sounds off without decision preview buttons', async () => {
    renderSetupMenu({ audioEnabled: false })
    await openSetupMenu()

    expect(screen.getByRole('switch', { name: 'Decision sounds' })).not.toBeChecked()
    expect(screen.getByText('Off')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Preview .* sound/ })).not.toBeInTheDocument()
  })

  it('opens from the keyboard and tabs into the filter controls', async () => {
    renderSetupMenu()
    const trigger = screen.getByRole('button', { name: 'Review setup' })

    trigger.focus()
    await userEvent.keyboard('{Enter}')

    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(document.activeElement).toBe(document.getElementById('review-setup-popover'))

    await userEvent.tab()
    expect(screen.getByRole('button', { name: 'Select all Languages' })).toHaveFocus()

    await userEvent.tab()
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
