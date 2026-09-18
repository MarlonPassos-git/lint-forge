import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ruleCategories } from '../../../domain/ruleCategories'
import { availableRuleDomains } from '../../../domain/ruleFilters'
import { ReviewSidebar } from '../ReviewSidebar'

function renderSidebar(overrides: Partial<Parameters<typeof ReviewSidebar>[0]> = {}) {
  const props: Parameters<typeof ReviewSidebar>[0] = {
    audioEnabled: true,
    audioPack: 'mechanical',
    selectedCategories: [...ruleCategories],
    selectedDomains: [...availableRuleDomains],
    onAudioPackChange: vi.fn(),
    onAudioToggle: vi.fn(),
    onFilterGroupSelection: vi.fn(),
    onFilterToggle: vi.fn(),
    onSoundPreview: vi.fn(),
    ...overrides,
  }
  render(<ReviewSidebar {...props} />)
  return props
}

describe('ReviewSidebar filters', () => {
  it('lists every language and available tool domain', () => {
    renderSidebar()

    expect(screen.getByRole('checkbox', { name: 'JavaScript' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'React' })).toBeChecked()
    expect(screen.queryByRole('checkbox', { name: 'Tailwind CSS' })).not.toBeInTheDocument()
  })

  it('reports a filter toggle for languages and tools', async () => {
    const props = renderSidebar()

    await userEvent.click(screen.getByRole('checkbox', { name: 'CSS' }))
    await userEvent.click(screen.getByRole('checkbox', { name: 'Vue' }))

    expect(props.onFilterToggle).toHaveBeenNthCalledWith(1, 'CSS')
    expect(props.onFilterToggle).toHaveBeenNthCalledWith(2, 'vue')
  })

  it('selects and clears whole filter groups', async () => {
    const props = renderSidebar()

    await userEvent.click(screen.getByRole('button', { name: 'Clear all Languages' }))
    await userEvent.click(screen.getByRole('button', { name: 'Select all Tools' }))

    expect(props.onFilterGroupSelection).toHaveBeenNthCalledWith(1, 'categories', false)
    expect(props.onFilterGroupSelection).toHaveBeenNthCalledWith(2, 'domains', true)
  })
})

describe('ReviewSidebar sound settings', () => {
  it('reports the sound toggle and the selected pack', async () => {
    const props = renderSidebar()

    await userEvent.click(screen.getByRole('checkbox', { name: 'Decision sounds' }))
    await userEvent.selectOptions(screen.getByLabelText('Pack'), 'zen')

    expect(props.onAudioToggle).toHaveBeenCalledTimes(1)
    expect(props.onAudioPackChange).toHaveBeenCalledWith('zen')
  })

  it('previews each decision sound with a named control', async () => {
    const props = renderSidebar()

    await userEvent.click(screen.getByRole('button', { name: 'Preview warn sound' }))

    expect(props.onSoundPreview).toHaveBeenCalledWith('warn')
  })

  it('disables previews while keeping the pack selector available when sounds are off', () => {
    renderSidebar({ audioEnabled: false })

    for (const decision of ['off', 'info', 'warn', 'error']) {
      expect(screen.getByRole('button', { name: `Preview ${decision} sound` })).toBeDisabled()
    }
    expect(screen.getByLabelText('Pack')).toBeEnabled()
    expect(screen.getByRole('checkbox', { name: 'Decision sounds' })).not.toBeChecked()
  })
})
