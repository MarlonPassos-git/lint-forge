import { useCallback } from 'react'
import type { ReviewSnapshot, RuleChoice } from '../../domain/types'
import { ImportPanel } from '../panels/ImportPanel'
import { OutputPanel } from '../panels/OutputPanel'
import { RuleStage } from '../rules/RuleStage'
import { PanelVisibilitySlot } from './PanelVisibilitySlot'

type ReviewWorkspaceProps = {
  controller: {
    choices: RuleChoice[]
    errorText: string
    hasSelectedCategory: boolean
    importText: string
    isInputVisible: boolean
    isOutputVisible: boolean
    outputText: string
    outgoingDecision: RuleChoice['decision'] | null
    activeRule?: Parameters<typeof RuleStage>[0]['activeRule']
    visibleRules: Parameters<typeof RuleStage>[0]['rules']
    chooseRule: Parameters<typeof RuleStage>[0]['onChoose']
    setImportText: (value: string) => void
    startReview: () => void
    updatePanelVisibility: (patch: Partial<NonNullable<ReviewSnapshot['panels']>>) => void
  }
}

export function ReviewWorkspace({ controller }: ReviewWorkspaceProps) {
  const panelActions = usePanelVisibilityActions(controller.updatePanelVisibility)
  return (
    <section
      className={getWorkspaceClassName(controller.isInputVisible, controller.isOutputVisible)}
      aria-label="Rule review workspace"
    >
      <InputSlot
        controller={controller}
        onHide={panelActions.hideInput}
        onShow={panelActions.showInput}
      />
      <RuleStage
        activeRule={controller.activeRule}
        hasSelectedCategory={controller.hasSelectedCategory}
        outgoingDecision={controller.outgoingDecision}
        rules={controller.visibleRules}
        onChoose={controller.chooseRule}
      />
      <OutputSlot
        controller={controller}
        onHide={panelActions.hideOutput}
        onShow={panelActions.showOutput}
      />
    </section>
  )
}

type PanelSlotProps = ReviewWorkspaceProps & { onHide: () => void; onShow: () => void }

function InputSlot({ controller, onHide, onShow }: PanelSlotProps) {
  return (
    <PanelVisibilitySlot
      isVisible={controller.isInputVisible}
      revealLabel="Show base file"
      side="input"
      onShow={onShow}
    >
      <ImportPanel
        errorText={controller.errorText}
        importText={controller.importText}
        onChange={controller.setImportText}
        onHide={onHide}
        onStart={controller.startReview}
      />
    </PanelVisibilitySlot>
  )
}

function OutputSlot({ controller, onHide, onShow }: PanelSlotProps) {
  return (
    <PanelVisibilitySlot
      isVisible={controller.isOutputVisible}
      revealLabel="Show biome.json"
      side="output"
      onShow={onShow}
    >
      <OutputPanel
        choices={controller.choices}
        outputText={controller.outputText}
        onHide={onHide}
      />
    </PanelVisibilitySlot>
  )
}

function usePanelVisibilityActions(
  updateVisibility: ReviewWorkspaceProps['controller']['updatePanelVisibility'],
) {
  const hideInput = useCallback(() => updateVisibility({ inputVisible: false }), [updateVisibility])
  const hideOutput = useCallback(
    () => updateVisibility({ outputVisible: false }),
    [updateVisibility],
  )
  const showInput = useCallback(() => updateVisibility({ inputVisible: true }), [updateVisibility])
  const showOutput = useCallback(
    () => updateVisibility({ outputVisible: true }),
    [updateVisibility],
  )
  return { hideInput, hideOutput, showInput, showOutput }
}

function getWorkspaceClassName(isInputVisible: boolean, isOutputVisible: boolean) {
  return [
    'workspace',
    isInputVisible ? '' : 'is-input-hidden',
    isOutputVisible ? '' : 'is-output-hidden',
  ]
    .filter(Boolean)
    .join(' ')
}
