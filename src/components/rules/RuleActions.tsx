import { AlertTriangle, Info, ShieldCheck, X } from 'lucide-react'
import type { ReactNode } from 'react'
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
          onChoose={onChoose}
        />
        <DecisionButton
          className="info-button"
          decision="info"
          icon={<Info size={20} />}
          label="Info"
          outgoingDecision={outgoingDecision}
          onChoose={onChoose}
        />
        <DecisionButton
          className="warn-button"
          decision="warn"
          icon={<AlertTriangle size={20} />}
          label="Warn"
          outgoingDecision={outgoingDecision}
          onChoose={onChoose}
        />
        <DecisionButton
          className="error-button"
          decision="error"
          icon={<ShieldCheck size={20} />}
          label="Error"
          outgoingDecision={outgoingDecision}
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

function DecisionButton(props: {
  className: string
  decision: RuleChoice['decision']
  icon: ReactNode
  label: string
  outgoingDecision: RuleChoice['decision'] | null
  onChoose: (decision: RuleChoice['decision']) => void
}) {
  return (
    <button
      type="button"
      className={getDecisionButtonClassName(
        props.className,
        props.outgoingDecision,
        props.decision,
      )}
      disabled={Boolean(props.outgoingDecision)}
      onClick={() => props.onChoose(props.decision)}
    >
      {props.icon} {props.label}
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
