import { useEffect } from 'react'
import { decisionSoundPlayer } from '../audio/decisionSoundPlayer'
import type { ReviewAudioSettings } from '../domain/types'

/** Applies persisted sound preferences to the shared decision sound player. */
export function useDecisionSoundSettings(audio: ReviewAudioSettings) {
  const { enabled, pack } = audio

  useEffect(() => {
    decisionSoundPlayer.setEnabled(enabled)
    decisionSoundPlayer.setPack(pack)
  }, [enabled, pack])
}
