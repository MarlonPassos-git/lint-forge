import { memo } from 'react'
import type { BiomeRule, RuleChoice } from '../../domain/types'
import { useDeferredRuleDocument } from '../../hooks/useDeferredRuleDocument'

type RuleFrameProps = {
  decision: RuleChoice['decision'] | null
  isActive: boolean
  rule: BiomeRule
  stackIndex: number
}

export const RuleFrame = memo(function RuleFrame({
  decision,
  isActive,
  rule,
  stackIndex,
}: RuleFrameProps) {
  const headingId = getRuleHeadingId(rule)
  const isHidden = !isActive
  const documentSource = useDeferredRuleDocument(rule.url)

  return (
    <article
      aria-hidden={isHidden || undefined}
      aria-labelledby={headingId}
      className={getRuleFrameClassName(isActive, decision, stackIndex)}
      data-decision-label={decision ? getDecisionLabel(decision) : undefined}
      inert={isHidden || undefined}
    >
      <div className="rule-meta">
        <div>
          <span>{rule.group}</span>
          <h2 id={headingId}>
            <strong>{rule.name}</strong>
          </h2>
        </div>
        <p>{rule.summary}</p>
      </div>
      <iframe
        className="docs-frame"
        aria-hidden={isHidden || undefined}
        title={`${rule.name} documentation`}
        src={documentSource}
        tabIndex={isActive ? 0 : -1}
        loading="eager"
      />
    </article>
  )
})

function getRuleHeadingId(rule: BiomeRule) {
  return `rule-heading-${rule.group}-${rule.name}`.replace(/[^a-zA-Z0-9_-]/g, '-')
}

function getRuleFrameClassName(
  isActive: boolean,
  decision: RuleChoice['decision'] | null,
  stackIndex: number,
) {
  return [
    'rule-frame',
    isActive ? 'is-active' : '',
    stackIndex === 1 ? 'is-queued-next' : '',
    stackIndex === 2 ? 'is-queued-after' : '',
    decision ? 'is-exiting' : '',
    decision ? `is-exiting-${decision}` : '',
  ]
    .filter(Boolean)
    .join(' ')
}

function getDecisionLabel(decision: RuleChoice['decision']) {
  return decision.toUpperCase()
}
