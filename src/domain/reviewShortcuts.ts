import type { RuleDecision } from './types'

export type ReviewShortcut = {
  ariaKey: string
  badge: string
  key: string
}

export const reviewShortcuts: Record<RuleDecision, ReviewShortcut> = {
  off: { ariaKey: 'Shift+H', badge: '⇧H', key: 'H' },
  info: { ariaKey: 'Shift+J', badge: '⇧J', key: 'J' },
  warn: { ariaKey: 'Shift+K', badge: '⇧K', key: 'K' },
  error: { ariaKey: 'Shift+L', badge: '⇧L', key: 'L' },
}
