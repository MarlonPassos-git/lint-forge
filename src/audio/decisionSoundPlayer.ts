import { type CueName, createUISFX, type PackName, type UISFXPlayer } from 'uisfx'
import type { ReviewAudioSettings, RuleDecision } from '../domain/types'

export const defaultDecisionSoundSettings: ReviewAudioSettings = {
  enabled: true,
}

const decisionSoundPack: PackName = 'zen'

/**
 * Semantic uisfx cues per decision. The Zen pack renders `warning` and `error`
 * with near-identical pitch contours, so error uses `blocked` for a clearly
 * lower and heavier failure signal instead.
 */
export const decisionSoundCueByDecision: Record<RuleDecision, CueName> = {
  error: 'blocked',
  info: 'info',
  off: 'toggle-off',
  warn: 'warning',
}

export type DecisionSoundPlayer = {
  play: (decision: RuleDecision) => void
  setEnabled: (enabled: boolean) => void
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
  }
}

function createDefaultUISFXPlayer(settings: ReviewAudioSettings): UISFXPlayer {
  return createUISFX({
    enabled: settings.enabled,
    pack: decisionSoundPack,
    volume: 0.9,
  })
}

export const decisionSoundPlayer = createDecisionSoundPlayer()
