import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
import { biomeRules } from '../domain/biomeRules'
import { QuietAudioContext } from '../test/audioFakes'

describe('App review flow', () => {
  beforeEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
    window.localStorage.clear()
  })

  it('renders the review deck with generated output', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: 'Lint Forge' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Generated biome.json' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Generated biome.json code' })).toHaveAttribute(
      'readonly',
    )
    expect(screen.getByText(`0/${biomeRules.length}`)).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Rule categories' })).toBeInTheDocument()
    expect(screen.getByTitle(`${biomeRules[0].name} documentation`)).toBeInTheDocument()
  })

  it('saves warn, info, and off decisions into generated config', async () => {
    vi.stubGlobal('AudioContext', QuietAudioContext)
    render(<App />)

    await userEvent.click(screen.getByRole('button', { name: 'Warn' }))
    await waitFor(() => expect(getGeneratedConfig().value).toContain('"warn"'))
    await userEvent.click(screen.getByRole('button', { name: 'Info' }))
    await waitFor(() => expect(getGeneratedConfig().value).toContain('"info"'))
    await userEvent.click(screen.getByRole('button', { name: 'Off' }))

    await waitFor(() => expect(getGeneratedConfig().value).toContain('"off"'))
    expect(screen.getByText('3 decisions saved locally.')).toBeInTheDocument()
  })

  it('marks a pending error decision before persisting it', async () => {
    vi.stubGlobal('AudioContext', QuietAudioContext)
    render(<App />)

    await userEvent.click(screen.getByRole('button', { name: 'Error' }))

    expect(screen.getByRole('button', { name: 'Error' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Error' })).toHaveClass('is-selected-decision')
    await waitFor(() => expect(getGeneratedConfig().value).toContain('"error"'))
  })

  it.each([
    ['H', 'Off', 'off'],
    ['J', 'Info', 'info'],
    ['K', 'Warn', 'warn'],
    ['L', 'Error', 'error'],
  ])('maps Shift+%s to the %s decision', async (key, label, decision) => {
    vi.stubGlobal('AudioContext', QuietAudioContext)
    render(<App />)

    fireEvent.keyDown(window, { key, shiftKey: true })

    expect(screen.getByRole('button', { name: label })).toBeDisabled()
    await waitFor(() => expect(getGeneratedConfig().value).toContain(`"${decision}"`))
  })

  it('ignores shortcuts during editing, composition, repeat, or extra modifiers', () => {
    vi.stubGlobal('AudioContext', QuietAudioContext)
    render(<App />)

    fireEvent.keyDown(screen.getByLabelText('Base file'), { key: 'H', shiftKey: true })
    fireEvent.keyDown(window, { key: 'J', repeat: true, shiftKey: true })
    fireEvent.keyDown(window, { isComposing: true, key: 'K', shiftKey: true })
    fireEvent.keyDown(window, { ctrlKey: true, key: 'L', shiftKey: true })

    for (const label of ['Off', 'Info', 'Warn', 'Error']) {
      expect(screen.getByRole('button', { name: label })).toBeEnabled()
    }
    expect(screen.getByText('0 decisions saved locally.')).toBeInTheDocument()
  })

  it('moves active documentation after a decision is saved', async () => {
    vi.stubGlobal('AudioContext', QuietAudioContext)
    render(<App />)

    await userEvent.click(screen.getByRole('button', { name: 'Warn' }))

    await waitFor(() =>
      expect(screen.getByTitle(`${biomeRules[1].name} documentation`)).toBeVisible(),
    )
  })

  it('preserves a filter change while a decision animation finishes', () => {
    vi.useFakeTimers()
    vi.stubGlobal('AudioContext', QuietAudioContext)
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'Warn' }))
    fireEvent.click(screen.getByRole('checkbox', { name: 'JavaScript' }))
    act(() => vi.advanceTimersByTime(280))

    expect(screen.getByRole('checkbox', { name: 'JavaScript' })).not.toBeChecked()
    expect(screen.getByText('1 decisions saved locally.')).toBeInTheDocument()
  })
})

function getGeneratedConfig() {
  return screen.getByRole<HTMLTextAreaElement>('textbox', { name: 'Generated biome.json code' })
}
