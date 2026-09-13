import { useEffect } from 'react'
import { reviewShortcuts, undoShortcut } from '../domain/reviewShortcuts'
import type { RuleChoice, RuleDecision } from '../domain/types'

type ReviewShortcutOptions = {
  isDecisionBlocked: boolean
  isUndoBlocked: boolean
  onChoose: (decision: RuleChoice['decision']) => void
  onUndo: () => void
}

const shortcutDecisionByKey = new Map(
  Object.entries(reviewShortcuts).map(([decision, shortcut]) => [
    shortcut.key,
    decision as RuleDecision,
  ]),
)

/** Connects global review chords to the existing review actions.
 * @example useReviewShortcuts({ isDecisionBlocked: false, isUndoBlocked: true, onChoose, onUndo })
 */
export function useReviewShortcuts({
  isDecisionBlocked,
  isUndoBlocked,
  onChoose,
  onUndo,
}: ReviewShortcutOptions) {
  useEffect(() => {
    const runReviewShortcut = (event: KeyboardEvent) => {
      if (shouldIgnoreReviewShortcut(event)) return
      if (event.shiftKey && event.key.toUpperCase() === undoShortcut.key) {
        if (!isUndoBlocked) onUndo()
        return
      }
      if (isDecisionBlocked) return
      const decision = getReviewShortcutDecision(event)
      if (decision) onChoose(decision)
    }
    window.addEventListener('keydown', runReviewShortcut)
    return () => window.removeEventListener('keydown', runReviewShortcut)
  }, [isDecisionBlocked, isUndoBlocked, onChoose, onUndo])
}

function shouldIgnoreReviewShortcut(event: KeyboardEvent) {
  return (
    event.repeat ||
    event.isComposing ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey ||
    isEditableShortcutTarget(event.target)
  )
}

function getReviewShortcutDecision(event: KeyboardEvent) {
  if (!event.shiftKey) return undefined
  return shortcutDecisionByKey.get(event.key.toUpperCase())
}

function isEditableShortcutTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) return false
  return Boolean(
    target.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"])'),
  )
}
