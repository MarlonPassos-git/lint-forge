import { useEffect } from 'react'
import { reviewShortcuts } from '../domain/reviewShortcuts'
import type { RuleChoice, RuleDecision } from '../domain/types'

type ReviewShortcutOptions = {
  isBlocked: boolean
  onChoose: (decision: RuleChoice['decision']) => void
}

const shortcutDecisionByKey = new Map(
  Object.entries(reviewShortcuts).map(([decision, shortcut]) => [
    shortcut.key,
    decision as RuleDecision,
  ]),
)

/** Connects global review chords to the existing decision flow.
 * @example useReviewShortcuts({ isBlocked: false, onChoose: chooseRule })
 */
export function useReviewShortcuts({ isBlocked, onChoose }: ReviewShortcutOptions) {
  useEffect(() => {
    const chooseRuleWithShortcut = (event: KeyboardEvent) => {
      if (shouldIgnoreReviewShortcut(event, isBlocked)) return
      const decision = getReviewShortcutDecision(event)
      if (decision) onChoose(decision)
    }
    window.addEventListener('keydown', chooseRuleWithShortcut)
    return () => window.removeEventListener('keydown', chooseRuleWithShortcut)
  }, [isBlocked, onChoose])
}

function shouldIgnoreReviewShortcut(event: KeyboardEvent, isBlocked: boolean) {
  return (
    isBlocked ||
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
