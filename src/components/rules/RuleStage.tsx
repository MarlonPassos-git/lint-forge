import { memo } from 'react'
import type { BiomeRule, RuleChoice } from '../../domain/types'
import { FinishedStage, NoFiltersStage, NoMatchingRulesStage } from './EmptyStages'
import { RuleActions } from './RuleActions'
import { RuleFrame } from './RuleFrame'

type RuleStageProps = {
  activeRule?: BiomeRule
  hasMatchingRules: boolean
  hasSelectedFilter: boolean
  outgoingDecision: RuleChoice['decision'] | null
  rules: BiomeRule[]
  onChoose: (decision: RuleChoice['decision']) => void
}

export const RuleStage = memo(function RuleStage(props: RuleStageProps) {
  if (!props.hasSelectedFilter) return <NoFiltersStage />
  if (!props.activeRule)
    return props.hasMatchingRules ? <FinishedStage /> : <NoMatchingRulesStage />

  return (
    <section className="rule-stage">
      <div className="iframe-stack">
        {props.rules.map((rule, index) => (
          <RuleFrame
            key={`${rule.group}/${rule.name}`}
            decision={index === 0 ? props.outgoingDecision : null}
            isActive={index === 0}
            rule={rule}
            stackIndex={index}
          />
        ))}
        <RuleActions outgoingDecision={props.outgoingDecision} onChoose={props.onChoose} />
      </div>
    </section>
  )
}, areRuleStagePropsEqual)

function areRuleStagePropsEqual(previous: RuleStageProps, next: RuleStageProps) {
  return (
    previous.activeRule === next.activeRule &&
    previous.hasMatchingRules === next.hasMatchingRules &&
    previous.hasSelectedFilter === next.hasSelectedFilter &&
    previous.outgoingDecision === next.outgoingDecision &&
    previous.rules === next.rules &&
    previous.onChoose === next.onChoose
  )
}
