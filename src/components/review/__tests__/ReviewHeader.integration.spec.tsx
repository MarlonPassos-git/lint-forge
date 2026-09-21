import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ruleCategories } from '../../../domain/ruleCategories'
import { availableRuleDomains } from '../../../domain/ruleFilters'
import { ReviewHeader } from '../ReviewHeader'

type ReviewHeaderProps = Parameters<typeof ReviewHeader>[0]

function createHeaderProps(overrides: Partial<ReviewHeaderProps> = {}): ReviewHeaderProps {
  return {
    canUndo: false,
    completedRules: 0,
    hasSelectedFilter: false,
    progress: 0,
    selectedCategories: [...ruleCategories],
    selectedDomains: [...availableRuleDomains],
    totalRules: 0,
    onFilterGroupSelection: vi.fn(),
    onFilterToggle: vi.fn(),
    onResetRequest: vi.fn(),
    onUndo: vi.fn(),
    ...overrides,
  }
}

describe('ReviewHeader', () => {
  it('shows progress and asks to reset through a named control', async () => {
    const props = createHeaderProps({
      canUndo: true,
      completedRules: 2,
      hasSelectedFilter: true,
      progress: 25,
      totalRules: 8,
    })
    render(<ReviewHeader {...props} />)

    expect(screen.getByRole('heading', { name: 'Lint Forge' })).toBeInTheDocument()
    expect(screen.getByText(/not an official Biome tool/i)).toBeInTheDocument()
    expect(screen.getByText('25%')).toBeInTheDocument()
    expect(screen.getByText('2/8')).toBeInTheDocument()
    expect(screen.getByRole('progressbar', { name: 'Review progress' })).toHaveAttribute(
      'value',
      '25',
    )
    expect(screen.getByRole('progressbar', { name: 'Review progress' })).toHaveAttribute(
      'max',
      '100',
    )

    await userEvent.click(screen.getByRole('button', { name: 'Reset review' }))

    expect(props.onResetRequest).toHaveBeenCalledTimes(1)
  })

  it('reports when no review filter is selected', () => {
    render(<ReviewHeader {...createHeaderProps()} />)

    expect(screen.getByText('No filters')).toBeInTheDocument()
  })

  it('exposes Back globally and disables it when undo is unavailable', async () => {
    const onUndo = vi.fn()
    const { rerender } = render(<ReviewHeader {...createHeaderProps({ onUndo })} />)

    const backButton = screen.getByRole('button', { name: 'Back, undo last decision' })
    expect(backButton).toBeDisabled()
    expect(backButton).toHaveAttribute('aria-keyshortcuts', 'Shift+B')
    expect(backButton.querySelector('kbd')).toHaveTextContent('⇧B')

    rerender(
      <ReviewHeader
        {...createHeaderProps({
          canUndo: true,
          completedRules: 1,
          hasSelectedFilter: true,
          onUndo,
          progress: 100,
          totalRules: 1,
        })}
      />,
    )
    await userEvent.click(backButton)

    expect(onUndo).toHaveBeenCalledTimes(1)
  })

  it('exposes the review setup menu trigger beside reset', () => {
    render(<ReviewHeader {...createHeaderProps()} />)

    const trigger = screen.getByRole('button', { name: 'Review setup' })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(trigger).toHaveAttribute('aria-controls', 'review-setup-popover')
  })
})
