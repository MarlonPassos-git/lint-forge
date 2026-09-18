import type { CueName, PlayingSFX, UISFXPlayer } from 'uisfx'
import { describe, expect, it, vi } from 'vitest'
import {
  createDecisionSoundPlayer,
  decisionSoundCueByDecision,
  defaultDecisionSoundSettings,
} from '../decisionSoundPlayer'

class FakeUISFXPlayer implements UISFXPlayer {
  readonly enabledValues: boolean[] = []
  readonly playedCues: CueName[] = []
  private enabled = true

  async unlock(): Promise<boolean> {
    return true
  }

  play(cue: CueName): PlayingSFX | null {
    this.playedCues.push(cue)
    return null
  }

  async preload(): Promise<void> {}

  setPack(): void {}

  getPack(): 'minimal' {
    return 'minimal'
  }

  setVolume(): void {}

  getVolume(): number {
    return 1
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled
    this.enabledValues.push(enabled)
  }

  isEnabled(): boolean {
    return this.enabled
  }

  stopAll(): void {}

  async destroy(): Promise<void> {}
}

function createFakePlayerFactory(fakePlayer: FakeUISFXPlayer) {
  return vi.fn(() => fakePlayer)
}

describe('createDecisionSoundPlayer', () => {
  it('maps every review decision to its semantic uisfx cue', () => {
    expect(decisionSoundCueByDecision).toEqual({
      error: 'blocked',
      info: 'info',
      off: 'toggle-off',
      warn: 'warning',
    })
  })

  it.each([
    ['off', 'toggle-off'],
    ['info', 'info'],
    ['warn', 'warning'],
    ['error', 'blocked'],
  ] as const)('plays the %s decision as the %s cue', async (decision, cue) => {
    const fakePlayer = new FakeUISFXPlayer()
    const player = createDecisionSoundPlayer(createFakePlayerFactory(fakePlayer))

    player.play(decision)

    await vi.waitFor(() => expect(fakePlayer.playedCues).toEqual([cue]))
  })

  it('does not build an AudioContext before the first sound', () => {
    const fakePlayer = new FakeUISFXPlayer()
    const createPlayer = createFakePlayerFactory(fakePlayer)
    const player = createDecisionSoundPlayer(createPlayer)

    player.setEnabled(false)

    expect(createPlayer).not.toHaveBeenCalled()
  })

  it('stays silent while sounds are disabled', async () => {
    const fakePlayer = new FakeUISFXPlayer()
    const createPlayer = createFakePlayerFactory(fakePlayer)
    const player = createDecisionSoundPlayer(createPlayer, { enabled: false })

    player.play('error')

    await Promise.resolve()
    expect(createPlayer).not.toHaveBeenCalled()
    expect(fakePlayer.playedCues).toEqual([])
  })

  it('creates the player with the current settings and forwards later changes', async () => {
    const fakePlayer = new FakeUISFXPlayer()
    const createPlayer = vi.fn(() => fakePlayer)
    const player = createDecisionSoundPlayer(createPlayer, defaultDecisionSoundSettings)

    player.setEnabled(false)
    player.setEnabled(true)
    player.play('warn')
    await vi.waitFor(() => expect(fakePlayer.playedCues).toEqual(['warning']))

    expect(createPlayer).toHaveBeenCalledWith({ enabled: true })

    player.setEnabled(false)

    expect(fakePlayer.enabledValues).toContain(false)
  })

  it('ignores audio failures so a decision is never blocked', () => {
    const player = createDecisionSoundPlayer(() => {
      throw new Error('AudioContext is unavailable')
    })

    expect(() => player.play('warn')).not.toThrow()
  })

  it('ignores rejected unlocks', async () => {
    const fakePlayer = new FakeUISFXPlayer()
    fakePlayer.unlock = vi.fn(async () => Promise.reject(new Error('blocked')))
    const player = createDecisionSoundPlayer(createFakePlayerFactory(fakePlayer))

    player.play('info')
    await vi.waitFor(() => expect(fakePlayer.unlock).toHaveBeenCalled())
  })
})
