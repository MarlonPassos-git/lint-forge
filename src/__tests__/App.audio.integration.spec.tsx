import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
import { decisionSoundPlayer } from '../audio/decisionSoundPlayer'

describe('App decision sounds', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('plays the matching cue when a decision is chosen', async () => {
    const playSpy = vi.spyOn(decisionSoundPlayer, 'play').mockImplementation(() => undefined)
    render(<App />)

    await userEvent.click(screen.getByRole('button', { name: 'Warn' }))

    expect(playSpy).toHaveBeenCalledWith('warn')
    await waitFor(() => expect(screen.getByText('1 decisions saved locally.')).toBeInTheDocument())
  })

  it('previews a decision sound from the side panel', async () => {
    const playSpy = vi.spyOn(decisionSoundPlayer, 'play').mockImplementation(() => undefined)
    render(<App />)

    await userEvent.click(screen.getByRole('button', { name: 'Preview error sound' }))

    expect(playSpy).toHaveBeenCalledWith('error')
  })

  it('persists sound settings and restores them after a reload', async () => {
    const view = render(<App />)

    await userEvent.click(screen.getByRole('checkbox', { name: 'Decision sounds' }))
    await userEvent.selectOptions(screen.getByLabelText('Pack'), 'zen')

    expect(JSON.parse(window.localStorage.getItem('biome-rule-swipe:v1') ?? '{}')).toMatchObject({
      audio: { enabled: false, pack: 'zen' },
    })

    view.unmount()
    render(<App />)

    expect(screen.getByRole('checkbox', { name: 'Decision sounds' })).not.toBeChecked()
    expect(screen.getByLabelText('Pack')).toHaveValue('zen')
    expect(screen.getByRole('button', { name: 'Preview warn sound' })).toBeDisabled()
  })

  it('defaults to mechanical sounds for snapshots without audio settings', () => {
    window.localStorage.setItem(
      'biome-rule-swipe:v1',
      JSON.stringify({
        baseConfigText: '{}',
        choices: [],
        currentIndex: 0,
        panels: { inputVisible: true, outputVisible: true },
      }),
    )

    render(<App />)

    expect(screen.getByRole('checkbox', { name: 'Decision sounds' })).toBeChecked()
    expect(screen.getByLabelText('Pack')).toHaveValue('mechanical')
  })
})
