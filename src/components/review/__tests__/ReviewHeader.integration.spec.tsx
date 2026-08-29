import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ReviewHeader } from '../ReviewHeader'

describe('ReviewHeader', () => {
  it('shows progress and asks to reset through a named control', async () => {
    const onResetRequest = vi.fn()
    render(
      <ReviewHeader
        completedRules={2}
        hasSelectedCategory={true}
        progress={25}
        selectedCategories={['CSS']}
        totalRules={8}
        onCategoryToggle={vi.fn()}
        onResetRequest={onResetRequest}
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

  it('names category controls and reports category changes', async () => {
    const onCategoryToggle = vi.fn()
    render(
      <ReviewHeader
        completedRules={0}
        hasSelectedCategory={true}
        progress={0}
        selectedCategories={['JavaScript']}
        totalRules={10}
        onCategoryToggle={onCategoryToggle}
        onResetRequest={vi.fn()}
      />,
    )

    await userEvent.click(screen.getByRole('checkbox', { name: 'JavaScript' }))

    expect(screen.getByRole('checkbox', { name: 'HTML/ARIA' })).toHaveAttribute(
      'id',
      'category-html-aria',
    )
    expect(screen.getAllByRole('checkbox')).toHaveLength(6)
    expect(onCategoryToggle).toHaveBeenCalledWith('JavaScript')
  })
})
