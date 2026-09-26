import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import App from '../App'
import { eslintRules } from '../domain/eslintRules'
import { ruffRules } from '../domain/ruffRules'

beforeEach(() => {
  window.localStorage.clear()
  window.history.replaceState(null, '', '/')
})

describe('multi-tool navigation and review', () => {
  it('lists all tools without mounting documentation on the home', () => {
    const { container } = render(<App />)
    for (const tool of ['Biome', 'ESLint', 'Ruff'])
      expect(screen.getByRole('link', { name: `Configure ${tool}` })).toBeInTheDocument()
    expect(container.querySelectorAll('iframe')).toHaveLength(0)
  })

  it('keeps each review isolated while navigating between tools', async () => {
    render(<App />)
    await userEvent.click(screen.getByRole('link', { name: 'Configure ESLint' }))
    await screen.findByRole('heading', { name: 'Generated eslint.config.mjs' })
    expect(window.location.pathname).toBe('/eslint')
    expect(screen.queryByRole('button', { name: 'Info' })).not.toBeInTheDocument()
    fireEvent.keyDown(window, { key: 'J', shiftKey: true })
    expect(screen.getByText('0 decisions saved locally.')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Warn' }))
    await screen.findByText('1 decisions saved locally.')
    await userEvent.click(screen.getByRole('link', { name: 'All tools' }))
    await userEvent.click(screen.getByRole('link', { name: 'Configure Ruff' }))
    await screen.findByRole('heading', { name: 'Generated ruff.toml' })
    expect(screen.getByText('0 decisions saved locally.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Warn' })).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Enable' }))
    await screen.findByText('1 decisions saved locally.')
    await userEvent.click(screen.getByRole('link', { name: 'All tools' }))
    await userEvent.click(screen.getByRole('link', { name: 'Configure ESLint' }))
    await screen.findByText('1 decisions saved locally.')
    expect(
      screen.getByRole<HTMLTextAreaElement>('textbox', { name: 'Generated eslint.config.mjs code' })
        .value,
    ).toContain('"warn"')
    expect(window.localStorage.getItem('lint-forge:ruff:v1')).toContain('ruff/')
    expect(window.localStorage.getItem('biome-rule-swipe:v1')).toBeNull()
  })

  it('imports ESLint rules, preserves options, and uses its own filters', async () => {
    window.history.replaceState(null, '', '/eslint')
    render(<App />)
    await screen.findByRole('heading', { name: 'Generated eslint.config.mjs' })
    const firstRule = eslintRules[0]
    fireEvent.change(screen.getByRole('textbox', { name: 'Base file' }), {
      target: { value: JSON.stringify({ rules: { [firstRule.name]: 'off' } }) },
    })
    await userEvent.click(screen.getByRole('button', { name: 'Start from this config' }))
    expect(screen.getByText(`1/${eslintRules.length}`)).toBeInTheDocument()
    expect(screen.queryByTitle(`${firstRule.name} documentation`)).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Review setup' }))
    expect(screen.getByRole('checkbox', { name: 'React Hooks' })).toBeInTheDocument()
    expect(screen.queryByRole('checkbox', { name: 'Python' })).not.toBeInTheDocument()
  })

  it('imports Ruff pyproject, persists filters, and only resets Ruff after confirmation', async () => {
    window.localStorage.setItem('lint-forge:eslint:v1', 'preserve another tool')
    window.history.replaceState(null, '', '/ruff')
    const view = render(<App />)
    await screen.findByRole('heading', { name: 'Generated ruff.toml' })
    fireEvent.change(screen.getByRole('textbox', { name: 'Base file' }), {
      target: {
        value: `[project]\nname = "sample"\n[tool.ruff.lint]\nignore = ["${ruffRules[0].name}"]`,
      },
    })
    await userEvent.click(screen.getByRole('button', { name: 'Start from this config' }))
    expect(
      screen.getByRole<HTMLTextAreaElement>('textbox', { name: 'Generated pyproject.toml code' })
        .value,
    ).toContain('sample')
    expect(screen.getByText(`1/${ruffRules.length}`)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Review setup' }))
    await userEvent.click(screen.getByRole('button', { name: 'Clear all Languages' }))
    await userEvent.click(screen.getByRole('button', { name: 'Clear all Tools' }))
    expect(screen.getByText('No filters selected.')).toBeInTheDocument()
    view.unmount()
    render(<App />)
    await screen.findByText('No filters selected.')
    await userEvent.click(screen.getByRole('button', { name: 'Reset review' }))
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.getByText('No filters selected.')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Reset review' }))
    await userEvent.click(screen.getByRole('button', { name: 'Reset everything' }))
    expect(screen.getByText(`0/${ruffRules.length}`)).toBeInTheDocument()
    expect(window.localStorage.getItem('lint-forge:eslint:v1')).toBe('preserve another tool')
  })

  it('handles browser history and unknown routes', async () => {
    render(<App />)
    await userEvent.click(screen.getByRole('link', { name: 'Configure Biome' }))
    await screen.findByRole('heading', { name: 'Generated biome.json' })
    act(() => {
      window.history.replaceState(null, '', '/missing')
      window.dispatchEvent(new PopStateEvent('popstate'))
    })
    expect(screen.getByRole('heading', { name: 'Tool not found' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('link', { name: 'All tools' }))
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'Choose your linter' })).toBeInTheDocument(),
    )
  })
})
