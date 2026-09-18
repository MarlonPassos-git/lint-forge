import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
import { biomeRules } from '../domain/biomeRules'
import { getRuleCategories } from '../domain/ruleCategories'

describe('App review filters', () => {
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

  it('filters the review deck by selected tool domains', async () => {
    render(<App />)

    await userEvent.click(screen.getByRole('button', { name: 'Clear all Languages' }))
    await userEvent.click(screen.getByRole('button', { name: 'Clear all Tools' }))
    expect(screen.getByText('No filters')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('checkbox', { name: 'React' }))

    const reactRuleCount = biomeRules.filter((rule) => rule.domains.includes('react')).length
    expect(screen.getByText(`0/${reactRuleCount}`)).toBeInTheDocument()
  })

  it('shows a distinct state when every filter is disabled', async () => {
    render(<App />)

    await userEvent.click(screen.getByRole('button', { name: 'Clear all Languages' }))
    await userEvent.click(screen.getByRole('button', { name: 'Clear all Tools' }))

    expect(screen.getByText('No filters')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'No filters selected.' })).toBeInTheDocument()
    expect(screen.queryByText('All rules reviewed.')).not.toBeInTheDocument()
  })

  it('restores selected languages and tools from local storage', () => {
    window.localStorage.setItem(
      'biome-rule-swipe:v1',
      JSON.stringify({
        baseConfigText: '{}',
        choices: [],
        currentIndex: 0,
        filters: { selectedCategories: ['CSS'], selectedDomains: ['react'] },
        panels: { inputVisible: true, outputVisible: true },
      }),
    )

    render(<App />)

    expect(screen.getByRole('checkbox', { name: 'CSS' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'React' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'JavaScript' })).not.toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Vue' })).not.toBeChecked()
  })

  it('reactivates the category of a rule restored by Back', async () => {
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
