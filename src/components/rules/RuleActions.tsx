import { AlertTriangle, Info, ShieldCheck, X } from 'lucide-react'
import type { CSSProperties, ReactNode } from 'react'
import { reviewShortcuts } from '../../domain/reviewShortcuts'
import type { RuleChoice } from '../../domain/types'
import { useReviewTool } from '../review/ReviewToolContext'

type RuleActionsProps = {
  outgoingDecision: RuleChoice['decision'] | null
  onChoose: (decision: RuleChoice['decision']) => void
}

export function RuleActions({ outgoingDecision, onChoose }: RuleActionsProps) {
  const tool = useReviewTool()
  const icons = {
    off: <X size={20} />,
    info: <Info size={20} />,
    warn: <AlertTriangle size={20} />,
    error: <ShieldCheck size={20} />,
  }
  return (
    <>
      <fieldset
        className="decision-bar"
        id="rule-decisions"
        aria-label="Rule decisions"
        tabIndex={-1}
        style={{ '--decision-count': tool.decisions.length } as CSSProperties}
      >
        {tool.decisions.map((decision) => (
          <DecisionButton
            key={decision}
            className={
              tool.id === 'ruff' && decision === 'error' ? 'enable-button' : `${decision}-button`
            }
            decision={decision}
            icon={icons[decision]}
            label={tool.decisionLabels?.[decision] ?? decision[0].toUpperCase() + decision.slice(1)}
            outgoingDecision={outgoingDecision}
            shortcut={reviewShortcuts[decision]}
            onChoose={onChoose}
          />
        ))}
      </fieldset>
      <output aria-atomic="true" aria-live="polite" className="decision-status">
        {outgoingDecision
          ? `${tool.decisionLabels?.[outgoingDecision] ?? outgoingDecision} decision selected`
          : ''}
      </output>
    </>
  )
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
      <kbd className="shortcut-hint">{props.shortcut.badge}</kbd>
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
