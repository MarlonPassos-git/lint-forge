import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
import { decisionSoundPlayer } from '../audio/decisionSoundPlayer'

async function openReviewSetup() {
  await userEvent.click(screen.getByRole('button', { name: 'Review setup' }))
}

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

  it('persists the sound switch and restores it after a reload', async () => {
    const view = render(<App />)
    await openReviewSetup()

    await userEvent.click(screen.getByRole('switch', { name: 'Decision sounds' }))

    expect(JSON.parse(window.localStorage.getItem('biome-rule-swipe:v1') ?? '{}')).toMatchObject({
      audio: { enabled: false },
    })

    view.unmount()
    render(<App />)
    await openReviewSetup()

    expect(screen.getByRole('switch', { name: 'Decision sounds' })).not.toBeChecked()
  })

  it('defaults to sounds enabled for snapshots without audio settings', async () => {
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
    await openReviewSetup()

    expect(screen.getByRole('switch', { name: 'Decision sounds' })).toBeChecked()
  })
})
