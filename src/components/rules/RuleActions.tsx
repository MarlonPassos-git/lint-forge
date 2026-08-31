import { AlertTriangle, Info, ShieldCheck, X } from 'lucide-react'
import type { ReactNode } from 'react'
import { reviewShortcuts } from '../../domain/reviewShortcuts'
import type { RuleChoice } from '../../domain/types'

type RuleActionsProps = {
  outgoingDecision: RuleChoice['decision'] | null
  onChoose: (decision: RuleChoice['decision']) => void
}

export function RuleActions({ outgoingDecision, onChoose }: RuleActionsProps) {
  return (
    <>
      <fieldset className="decision-bar" aria-label="Rule decisions">
        <DecisionButton
          className="off-button"
          decision="off"
          icon={<X size={20} />}
          label="Off"
          outgoingDecision={outgoingDecision}
          shortcut={reviewShortcuts.off}
          onChoose={onChoose}
        />
        <DecisionButton
          className="info-button"
          decision="info"
          icon={<Info size={20} />}
          label="Info"
          outgoingDecision={outgoingDecision}
          shortcut={reviewShortcuts.info}
          onChoose={onChoose}
        />
        <DecisionButton
          className="warn-button"
          decision="warn"
          icon={<AlertTriangle size={20} />}
          label="Warn"
          outgoingDecision={outgoingDecision}
          shortcut={reviewShortcuts.warn}
          onChoose={onChoose}
        />
        <DecisionButton
          className="error-button"
          decision="error"
          icon={<ShieldCheck size={20} />}
          label="Error"
          outgoingDecision={outgoingDecision}
          shortcut={reviewShortcuts.error}
          onChoose={onChoose}
        />
      </fieldset>
      <output aria-atomic="true" aria-live="polite" className="decision-status">
        {getDecisionStatus(outgoingDecision)}
      </output>
    </>
  )
}

function getDecisionStatus(decision: RuleChoice['decision'] | null) {
  if (!decision) return ''
  return `${decision} decision selected`
}

type DecisionButtonProps = {
  className: string
  decision: RuleChoice['decision']
  icon: ReactNode
  label: string
  outgoingDecision: RuleChoice['decision'] | null
  shortcut: (typeof reviewShortcuts)[RuleChoice['decision']]
  onChoose: (decision: RuleChoice['decision']) => void
}

function DecisionButton(props: DecisionButtonProps) {
  const labelId = `decision-label-${props.decision}`
  const decisionClassName = getDecisionButtonClassName(
    props.className,
    props.outgoingDecision,
    props.decision,
  )
  const buttonAttributes = {
    'aria-keyshortcuts': props.shortcut.ariaKey,
    'aria-labelledby': labelId,
    className: decisionClassName,
    disabled: Boolean(props.outgoingDecision),
    onClick: () => props.onChoose(props.decision),
  }
  return (
    <button type="button" {...buttonAttributes}>
      {props.icon} <span id={labelId}>{props.label}</span>
      <kbd className="decision-shortcut-hint">{props.shortcut.badge}</kbd>
    </button>
  )
}

function getDecisionButtonClassName(
  baseClassName: string,
  outgoingDecision: RuleChoice['decision'] | null,
  decision: RuleChoice['decision'],
) {
  return [baseClassName, outgoingDecision === decision ? 'is-selected-decision' : '']
    .filter(Boolean)
    .join(' ')
}
