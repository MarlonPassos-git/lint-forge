import { useEffect } from 'react'
import { decisionSoundPlayer } from '../audio/decisionSoundPlayer'
import type { ReviewAudioSettings } from '../domain/types'

/** Applies the persisted sound preference to the shared decision sound player. */
export function useDecisionSoundSettings(audio: ReviewAudioSettings) {
  const { enabled } = audio

  useEffect(() => {
    decisionSoundPlayer.setEnabled(enabled)
  }, [enabled])
}
