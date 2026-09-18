import { type CueName, createUISFX, type PackName, type UISFXPlayer } from 'uisfx'
import type { DecisionSoundPack, ReviewAudioSettings, RuleDecision } from '../domain/types'

export const defaultDecisionSoundSettings: ReviewAudioSettings = {
  enabled: true,
  pack: 'mechanical',
}

/** Semantic uisfx cues that match each review decision. */
export const decisionSoundCueByDecision: Record<RuleDecision, CueName> = {
  error: 'error',
  info: 'info',
  off: 'toggle-off',
  warn: 'warning',
}

export const decisionSoundPackOptions: ReadonlyArray<{
  label: string
  name: DecisionSoundPack
}> = [
  { label: 'Mechanical', name: 'mechanical' },
  { label: 'Minimal', name: 'minimal' },
  { label: 'Sci-fi', name: 'scifi' },
  { label: 'Studio', name: 'studio' },
  { label: 'Soft', name: 'soft' },
  { label: 'Zen', name: 'zen' },
  { label: 'Glass', name: 'glass' },
  { label: 'Organic', name: 'organic' },
  { label: 'Dreamy', name: 'dreamy' },
  { label: 'Cinematic', name: 'cinematic' },
  { label: 'Arcade', name: 'arcade' },
  { label: 'Rubber', name: 'rubber' },
]

export type DecisionSoundPlayer = {
  play: (decision: RuleDecision) => void
  setEnabled: (enabled: boolean) => void
  setPack: (pack: DecisionSoundPack) => void
}

type UISFXPlayerFactory = (settings: ReviewAudioSettings) => UISFXPlayer

/**
 * Owns decision feedback audio and never lets it break a review action.
 * @example createDecisionSoundPlayer().play('warn')
 */
export function createDecisionSoundPlayer(
  createPlayer: UISFXPlayerFactory = createDefaultUISFXPlayer,
  initialSettings: ReviewAudioSettings = defaultDecisionSoundSettings,
): DecisionSoundPlayer {
  let player: UISFXPlayer | undefined
  let settings = { ...initialSettings }

  const getPlayer = () => {
    player ??= createPlayer(settings)
    return player
  }
  const safely = (runAudioAction: () => void) => {
    try {
      runAudioAction()
    } catch {
      // Decision feedback audio is optional; a failing AudioContext must not block the review.
    }
  }

  return {
    play(decision) {
      if (!settings.enabled) return
      safely(() => {
        const activePlayer = getPlayer()
        void activePlayer
          .unlock()
          .then(() => activePlayer.play(decisionSoundCueByDecision[decision]))
          .catch(() => undefined)
      })
    },
    setEnabled(enabled) {
      settings = { ...settings, enabled }
      if (!player) return
      safely(() => player?.setEnabled(enabled))
    },
    setPack(pack) {
      settings = { ...settings, pack }
      if (!player) return
      safely(() => player?.setPack(toUISFXPackName(pack)))
    },
  }
}

function createDefaultUISFXPlayer(settings: ReviewAudioSettings): UISFXPlayer {
  return createUISFX({
    enabled: settings.enabled,
    pack: toUISFXPackName(settings.pack),
    volume: 0.9,
  })
}

function toUISFXPackName(pack: DecisionSoundPack): PackName {
  return pack
}

export function isDecisionSoundPack(value: unknown): value is DecisionSoundPack {
  return decisionSoundPackOptions.some((option) => option.name === value)
}

export const decisionSoundPlayer = createDecisionSoundPlayer()
