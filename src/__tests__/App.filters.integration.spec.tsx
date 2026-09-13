import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
import { biomeRules } from '../domain/biomeRules'
import { getRuleCategories } from '../domain/ruleCategories'
import { QuietAudioContext } from '../test/audioFakes'

describe('App category filters', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
    window.localStorage.clear()
  })

  it('filters the review deck by selected categories', async () => {
    render(<App />)

    await userEvent.click(screen.getByRole('checkbox', { name: 'JavaScript' }))

    expect(screen.getByRole('checkbox', { name: 'JavaScript' })).not.toBeChecked()
    expect(screen.getByLabelText('Rule review workspace')).toBeInTheDocument()
  })

  it('shows a distinct state when every category filter is disabled', async () => {
    render(<App />)

    for (const checkbox of screen.getAllByRole('checkbox')) {
      await userEvent.click(checkbox)
    }

    expect(screen.getByText('No categories')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'No categories selected.' })).toBeInTheDocument()
    expect(screen.queryByText('All rules reviewed.')).not.toBeInTheDocument()
  })

  it('restores selected category filters from local storage', () => {
    window.localStorage.setItem(
      'biome-rule-swipe:v1',
      JSON.stringify({
        baseConfigText: '{}',
        choices: [],
        currentIndex: 0,
        filters: { selectedCategories: ['CSS'] },
        panels: { inputVisible: true, outputVisible: true },
      }),
    )

    render(<App />)

    expect(screen.getByRole('checkbox', { name: 'CSS' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'JavaScript' })).not.toBeChecked()
  })

  it('reactivates the category of a rule restored by Back', async () => {
    vi.stubGlobal('AudioContext', QuietAudioContext)
    const restoredRule = biomeRules[0]
    const [restoredCategory] = getRuleCategories(restoredRule)
    const view = render(<App />)

    await userEvent.click(screen.getByRole('button', { name: 'Warn' }))
    await screen.findByText('1 decisions saved locally.')
    await userEvent.click(screen.getByRole('checkbox', { name: restoredCategory }))
    expect(screen.getByRole('checkbox', { name: restoredCategory })).not.toBeChecked()

    await userEvent.click(screen.getByRole('button', { name: 'Back, undo last decision' }))

    expect(screen.getByRole('checkbox', { name: restoredCategory })).toBeChecked()
    expect(screen.getByTitle(`${restoredRule.name} documentation`)).toBeVisible()
    expect(JSON.parse(window.localStorage.getItem('biome-rule-swipe:v1') ?? '{}')).toMatchObject({
      choices: [],
      currentIndex: 0,
    })

    view.unmount()
    render(<App />)
    expect(screen.getByRole('checkbox', { name: restoredCategory })).toBeChecked()
    expect(screen.getByTitle(`${restoredRule.name} documentation`)).toBeVisible()
  })
})
