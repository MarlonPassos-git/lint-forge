import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ReviewHeader } from '../ReviewHeader'

describe('ReviewHeader', () => {
  it('shows progress and asks to reset through a named control', async () => {
    const onResetRequest = vi.fn()
    render(
      <ReviewHeader
        canUndo={true}
        completedRules={2}
        hasSelectedFilter={true}
        progress={25}
        totalRules={8}
        onResetRequest={onResetRequest}
        onUndo={vi.fn()}
      />,
    )

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

    expect(onResetRequest).toHaveBeenCalledTimes(1)
  })

  it('reports when no review filter is selected', () => {
    render(
      <ReviewHeader
        canUndo={false}
        completedRules={0}
        hasSelectedFilter={false}
        progress={0}
        totalRules={0}
        onResetRequest={vi.fn()}
        onUndo={vi.fn()}
      />,
    )

    expect(screen.getByText('No filters')).toBeInTheDocument()
  })

  it('exposes Back globally and disables it when undo is unavailable', async () => {
    const onUndo = vi.fn()
    const { rerender } = render(
      <ReviewHeader
        canUndo={false}
        completedRules={0}
        hasSelectedFilter={false}
        progress={0}
        totalRules={0}
        onResetRequest={vi.fn()}
        onUndo={onUndo}
      />,
    )

    const backButton = screen.getByRole('button', { name: 'Back, undo last decision' })
    expect(backButton).toBeDisabled()
    expect(backButton).toHaveAttribute('aria-keyshortcuts', 'Shift+B')
    expect(backButton.querySelector('kbd')).toHaveTextContent('⇧B')

    rerender(
      <ReviewHeader
        canUndo={true}
        completedRules={1}
        hasSelectedFilter={true}
        progress={100}
        totalRules={1}
        onResetRequest={vi.fn()}
        onUndo={onUndo}
      />,
    )
    await userEvent.click(backButton)

    expect(onUndo).toHaveBeenCalledTimes(1)
  })
})
