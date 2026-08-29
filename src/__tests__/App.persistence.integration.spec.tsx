import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App'

describe('App persisted layout state', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
    window.localStorage.clear()
  })

  it('hides and restores the generated output panel without losing content', async () => {
    render(<App />)

    await userEvent.click(screen.getByRole('button', { name: 'Hide output' }))

    expect(screen.getByText('Generated biome.json')).not.toBeVisible()
    expect(screen.getByRole('button', { name: 'Show biome.json' })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Show biome.json' }))

    expect(screen.getByRole('heading', { name: 'Generated biome.json' })).toBeVisible()
  })

  it('hides and restores the base file panel without losing input', async () => {
    render(<App />)

    fireEvent.change(screen.getByLabelText('Base file'), {
      target: { value: '{"linter":{"rules":{}}}' },
    })
    await userEvent.click(screen.getByRole('button', { name: 'Hide base file' }))

    expect(screen.getByText('Base file')).not.toBeVisible()
    expect(screen.getByRole('button', { name: 'Show base file' })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Show base file' }))

    expect(screen.getByLabelText('Base file')).toHaveValue('{"linter":{"rules":{}}}')
  })

  it('restores hidden side panels from local storage', () => {
    window.localStorage.setItem(
      'biome-rule-swipe:v1',
      JSON.stringify({
        baseConfigText: '{}',
        choices: [],
        currentIndex: 0,
        panels: { inputVisible: false, outputVisible: false },
      }),
    )

    render(<App />)

    expect(screen.getByRole('button', { name: 'Show base file' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Show biome.json' })).toBeInTheDocument()
  })
})
