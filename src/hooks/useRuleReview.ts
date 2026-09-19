import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  type DecisionSoundPlayer,
  decisionSoundPlayer,
  defaultDecisionSoundSettings,
} from '../audio/decisionSoundPlayer'
import { biomeRules } from '../domain/biomeRules'
import {
  buildBiomeConfig,
  formatBiomeConfig,
  getReviewableRules,
  parseBiomeConfig,
  toRuleKey,
} from '../domain/configuration'
import {
  appendRuleChoice,
  getCompletedRuleCount,
  getProgressPercent,
  getVisibleRuleWindow,
  removeLastRuleChoice,
} from '../domain/reviewState'
import { getRuleCategories, ruleCategories } from '../domain/ruleCategories'
import {
  availableRuleDomains,
  filterRulesBySelection,
  hasSelectedFilters,
  isRuleDomain,
  type RuleFilterGroup,
  setRuleFilterGroupSelection,
  toggleSelectedFilter,
} from '../domain/ruleFilters'
import type {
  BiomeConfig,
  BiomeRule,
  ReviewAudioSettings,
  ReviewSnapshot,
  RuleCategory,
  RuleChoice,
  RuleDomain,
  RuleFilter,
} from '../domain/types'
import {
  clearReviewSnapshot,
  loadReviewSnapshot,
  saveReviewSnapshot,
} from '../storage/localReviewStore'
import { useDecisionSoundSettings } from './useDecisionSoundSettings'
import { useReviewShortcuts } from './useReviewShortcuts'

const defaultInput = '{\n  "$schema": "https://biomejs.dev/schemas/2.4.16/schema.json"\n}\n'
type ReviewSnapshotUpdater = (currentSnapshot: ReviewSnapshot) => ReviewSnapshot
type StoreReviewSnapshot = (updateSnapshot: ReviewSnapshotUpdater) => void
type SetReviewSnapshot = (
  snapshot: ReviewSnapshot | ((currentSnapshot: ReviewSnapshot) => ReviewSnapshot),
) => void

export function useRuleReview() {
  const [snapshot, setSnapshot] = useState(() => loadInitialSnapshot())
  const [importText, setImportText] = useState(snapshot.baseConfigText)
  const [errorText, setErrorText] = useState('')
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false)
  const [outgoingDecision, setOutgoingDecision] = useState<RuleChoice['decision'] | null>(null)
  const state = useReviewState(snapshot, importText, errorText, isResetDialogOpen, outgoingDecision)
  useDecisionSoundSettings(state.audio)
  const actions = useReviewActions(
    state,
    setSnapshot,
    setImportText,
    setErrorText,
    setOutgoingDecision,
    decisionSoundPlayer,
  )
  const dialogActions = useResetDialogActions(actions.resetReview, setIsResetDialogOpen)
  useReviewShortcuts({
    isDecisionBlocked:
      !state.activeRule || state.isResetDialogOpen || Boolean(state.outgoingDecision),
    isUndoBlocked: !state.canUndo || state.isResetDialogOpen,
    onChoose: actions.chooseRule,
    onUndo: actions.undoLastDecision,
  })

  return {
    ...state,
    ...actions,
    ...dialogActions,
    setImportText,
  }
}

function useResetDialogActions(resetReviewAction: () => void, setIsOpen: (value: boolean) => void) {
  const resetTriggerRef = useRef<HTMLElement | null>(null)
  const closeResetDialog = useCallback(() => {
    setIsOpen(false)
    window.requestAnimationFrame(() => resetTriggerRef.current?.focus())
  }, [setIsOpen])
  const openResetDialog = useCallback(
    (trigger: HTMLElement) => {
      resetTriggerRef.current = trigger
      setIsOpen(true)
    },
    [setIsOpen],
  )
  const resetReview = useCallback(() => {
    resetReviewAction()
    closeResetDialog()
  }, [closeResetDialog, resetReviewAction])
  return { closeResetDialog, openResetDialog, resetReview }
}

function useReviewState(
  snapshot: ReviewSnapshot,
  importText: string,
  errorText: string,
  isResetDialogOpen: boolean,
  outgoingDecision: RuleChoice['decision'] | null,
) {
  const storedSelectedCategories = snapshot.filters?.selectedCategories
  const selectedCategories = useMemo(
    () => storedSelectedCategories ?? [...ruleCategories],
    [storedSelectedCategories],
  )
  const storedSelectedDomains = snapshot.filters?.selectedDomains
  const selectedDomains = useMemo(
    () => storedSelectedDomains ?? [...availableRuleDomains],
    [storedSelectedDomains],
  )
  const audio = useMemo(() => getAudioSettings(snapshot), [snapshot])
  const baseConfig = useMemo(
    () => safeParseConfig(snapshot.baseConfigText),
    [snapshot.baseConfigText],
  )
  const filteredRules = useMemo(
    () => filterRulesBySelection(biomeRules, selectedCategories, selectedDomains),
    [selectedCategories, selectedDomains],
  )
  const pendingRules = useMemo(
    () => getReviewableRules(filteredRules, baseConfig, snapshot.choices),
    [baseConfig, filteredRules, snapshot.choices],
  )
  const outputText = useMemo(
    () => formatBiomeConfig(buildBiomeConfig(baseConfig, snapshot.choices)),
    [baseConfig, snapshot.choices],
  )
  const visibleRules = useMemo(() => getVisibleRuleWindow(pendingRules, 0), [pendingRules])
  const completedRules = getCompletedRuleCount(filteredRules.length, pendingRules.length, 0)

  return buildReviewState(snapshot, importText, errorText, {
    audio,
    completedRules,
    filteredRules,
    isResetDialogOpen,
    outputText,
    outgoingDecision,
    pendingRules,
    selectedCategories,
    selectedDomains,
    visibleRules,
  })
}

function useReviewActions(
  state: ReturnType<typeof buildReviewState>,
  setSnapshot: SetReviewSnapshot,
  setImportText: (value: string) => void,
  setErrorText: (value: string) => void,
  setOutgoingDecision: (decision: RuleChoice['decision'] | null) => void,
  decisionSounds: DecisionSoundPlayer,
) {
  const storeSnapshot = useSnapshotStore(setSnapshot)
  const primaryActions = usePrimaryReviewActions({
    decisionSounds,
    setErrorText,
    setImportText,
    setOutgoingDecision,
    setSnapshot,
    state,
    storeSnapshot,
  })
  const snapshotActions = useSnapshotActions(storeSnapshot)
  return { ...primaryActions, ...snapshotActions }
}

function useSnapshotActions(storeSnapshot: StoreReviewSnapshot) {
  const toggleFilterAction = useCallback(
    (filter: RuleFilter) => toggleReviewFilter(filter, storeSnapshot),
    [storeSnapshot],
  )
  const setFilterGroupAction = useCallback(
    (group: RuleFilterGroup, isSelected: boolean) =>
      storeRuleFilterGroupSelection(group, isSelected, storeSnapshot),
    [storeSnapshot],
  )
  const updatePanelVisibilityAction = useCallback(
    (patch: Partial<NonNullable<ReviewSnapshot['panels']>>) =>
      updatePanelVisibility(patch, storeSnapshot),
    [storeSnapshot],
  )
  const toggleAudioEnabledAction = useCallback(
    () => toggleDecisionSounds(storeSnapshot),
    [storeSnapshot],
  )
  return {
    setFilterGroupSelection: setFilterGroupAction,
    toggleAudioEnabled: toggleAudioEnabledAction,
    toggleFilter: toggleFilterAction,
    updatePanelVisibility: updatePanelVisibilityAction,
  }
}

type PrimaryReviewActionDependencies = {
  decisionSounds: DecisionSoundPlayer
  state: ReturnType<typeof buildReviewState>
  setSnapshot: SetReviewSnapshot
  setImportText: (value: string) => void
  setErrorText: (value: string) => void
  setOutgoingDecision: (decision: RuleChoice['decision'] | null) => void
  storeSnapshot: StoreReviewSnapshot
}

function usePrimaryReviewActions(dependencies: PrimaryReviewActionDependencies) {
  const {
    decisionSounds,
    setErrorText,
    setImportText,
    setOutgoingDecision,
    setSnapshot,
    state,
    storeSnapshot,
  } = dependencies
  const { cancelDecisionTimer, decisionTimer } = usePendingDecisionTimer(setOutgoingDecision)
  const chooseRule = useChooseRuleAction(
    state.activeRule,
    state.outgoingDecision,
    decisionTimer,
    storeSnapshot,
    setOutgoingDecision,
    decisionSounds,
  )
  const startReview = useStartReviewAction(
    state.importText,
    cancelDecisionTimer,
    storeSnapshot,
    setImportText,
    setErrorText,
  )
  const resetReview = useResetReviewAction(
    cancelDecisionTimer,
    setSnapshot,
    setImportText,
    setErrorText,
  )
  const undoLastDecision = useCallback(() => {
    if (state.outgoingDecision) return
    storeSnapshot((snapshot) => {
      const { choices, restoredChoice } = removeLastRuleChoice(snapshot.choices)
      if (!restoredChoice) return snapshot
      const restoredRule = biomeRules.find((rule) => toRuleKey(rule) === restoredChoice.ruleKey)
      return {
        ...snapshot,
        choices,
        currentIndex: Math.max(snapshot.currentIndex - 1, 0),
        filters: restoreChosenRuleFilters(snapshot, restoredRule),
      }
    })
  }, [state.outgoingDecision, storeSnapshot])
  return { chooseRule, resetReview, startReview, undoLastDecision }
}

function restoreChosenRuleFilters(snapshot: ReviewSnapshot, restoredRule: BiomeRule | undefined) {
  const selectedCategories = getSelectedCategories(snapshot)
  const selectedDomains = getSelectedDomains(snapshot)
  if (!restoredRule) return { selectedCategories, selectedDomains }
  return {
    selectedCategories: [...new Set([...selectedCategories, ...getRuleCategories(restoredRule)])],
    selectedDomains: [...new Set([...selectedDomains, ...restoredRule.domains])],
  }
}

function useSnapshotStore(setSnapshot: SetReviewSnapshot) {
  return useCallback(
    (updateSnapshot: ReviewSnapshotUpdater) => {
      setSnapshot((currentSnapshot) => {
        const nextSnapshot = updateSnapshot(currentSnapshot)
        saveReviewSnapshot(window.localStorage, nextSnapshot)
        return nextSnapshot
      })
    },
    [setSnapshot],
  )
}

function usePendingDecisionTimer(
  setOutgoingDecision: (decision: RuleChoice['decision'] | null) => void,
) {
  const decisionTimer = useRef<number | null>(null)
  const cancelDecisionTimer = useCallback(() => {
    if (decisionTimer.current === null) return
    window.clearTimeout(decisionTimer.current)
    decisionTimer.current = null
    setOutgoingDecision(null)
  }, [setOutgoingDecision])
  useEffect(() => () => clearDecisionTimer(decisionTimer), [])
  return { cancelDecisionTimer, decisionTimer }
}

function useChooseRuleAction(
  activeRule: BiomeRule | undefined,
  outgoingDecision: RuleChoice['decision'] | null,
  decisionTimer: { current: number | null },
  storeSnapshot: StoreReviewSnapshot,
  setOutgoingDecision: (decision: RuleChoice['decision'] | null) => void,
  decisionSounds: DecisionSoundPlayer,
) {
  return useCallback(
    (decision: RuleChoice['decision']) =>
      chooseRule(
        activeRule,
        outgoingDecision,
        decision,
        decisionTimer,
        storeSnapshot,
        setOutgoingDecision,
        decisionSounds,
      ),
    [
      activeRule,
      decisionSounds,
      decisionTimer,
      outgoingDecision,
      setOutgoingDecision,
      storeSnapshot,
    ],
  )
}

function useStartReviewAction(
  importText: string,
  cancelDecisionTimer: () => void,
  storeSnapshot: StoreReviewSnapshot,
  setImportText: (value: string) => void,
  setErrorText: (value: string) => void,
) {
  return useCallback(() => {
    cancelDecisionTimer()
    startReview(importText, storeSnapshot, setImportText, setErrorText)
  }, [cancelDecisionTimer, importText, setErrorText, setImportText, storeSnapshot])
}

function useResetReviewAction(
  cancelDecisionTimer: () => void,
  setSnapshot: SetReviewSnapshot,
  setImportText: (value: string) => void,
  setErrorText: (value: string) => void,
) {
  return useCallback(() => {
    cancelDecisionTimer()
    resetReview(setSnapshot, setImportText, setErrorText)
  }, [cancelDecisionTimer, setErrorText, setImportText, setSnapshot])
}

function clearDecisionTimer(decisionTimer: { current: number | null }) {
  if (decisionTimer.current === null) return
  window.clearTimeout(decisionTimer.current)
  decisionTimer.current = null
}

function chooseRule(
  activeRule: BiomeRule | undefined,
  outgoingDecision: RuleChoice['decision'] | null,
  decision: RuleChoice['decision'],
  decisionTimer: { current: number | null },
  storeSnapshot: StoreReviewSnapshot,
  setOutgoingDecision: (decision: RuleChoice['decision'] | null) => void,
  decisionSounds: DecisionSoundPlayer,
) {
  if (!activeRule || outgoingDecision) return
  decisionSounds.play(decision)
  setOutgoingDecision(decision)
  decisionTimer.current = window.setTimeout(() => {
    storeSnapshot((snapshot) => saveRuleDecision(snapshot, activeRule, decision))
    decisionTimer.current = null
    setOutgoingDecision(null)
  }, 280)
}

function buildReviewState(
  snapshot: ReviewSnapshot,
  importText: string,
  errorText: string,
  derived: {
    audio: ReviewAudioSettings
    completedRules: number
    filteredRules: BiomeRule[]
    isResetDialogOpen: boolean
    outputText: string
    outgoingDecision: RuleChoice['decision'] | null
    pendingRules: BiomeRule[]
    selectedCategories: RuleCategory[]
    selectedDomains: RuleDomain[]
    visibleRules: BiomeRule[]
  },
) {
  const isInputVisible = snapshot.panels?.inputVisible ?? true
  const isOutputVisible = snapshot.panels?.outputVisible ?? true
  return {
    activeRule: derived.pendingRules[0],
    audio: derived.audio,
    canUndo: snapshot.choices.length > 0 && !derived.outgoingDecision,
    choices: snapshot.choices,
    completedRules: derived.completedRules,
    errorText,
    filteredRules: derived.filteredRules,
    hasSelectedFilter: hasSelectedFilters(derived.selectedCategories, derived.selectedDomains),
    importText,
    isInputVisible,
    isOutputVisible,
    isResetDialogOpen: derived.isResetDialogOpen,
    outputText: derived.outputText,
    outgoingDecision: derived.outgoingDecision,
    progress: getProgressPercent(derived.filteredRules.length, derived.completedRules),
    selectedCategories: derived.selectedCategories,
    selectedDomains: derived.selectedDomains,
    snapshot,
    visibleRules: derived.visibleRules,
  }
}

function startReview(
  importText: string,
  storeSnapshot: StoreReviewSnapshot,
  setImportText: (value: string) => void,
  setErrorText: (value: string) => void,
) {
  try {
    const config = parseBiomeConfig(importText)
    const formattedConfig = formatBiomeConfig(config)
    storeSnapshot((snapshot) => createImportedSnapshot(snapshot, formattedConfig))
    setImportText(formattedConfig)
    setErrorText('')
  } catch (error) {
    setErrorText(error instanceof Error ? error.message : 'Invalid config')
  }
}

function resetReview(
  setSnapshot: SetReviewSnapshot,
  setImportText: (value: string) => void,
  setErrorText: (value: string) => void,
) {
  clearReviewSnapshot(window.localStorage)
  setImportText(defaultInput)
  setErrorText('')
  setSnapshot(createInitialSnapshot())
}

function toggleReviewFilter(filter: RuleFilter, storeSnapshot: StoreReviewSnapshot) {
  storeSnapshot((snapshot) => {
    const filters = isRuleDomain(filter)
      ? {
          selectedCategories: getSelectedCategories(snapshot),
          selectedDomains: toggleSelectedFilter(getSelectedDomains(snapshot), filter),
        }
      : {
          selectedCategories: toggleSelectedFilter(getSelectedCategories(snapshot), filter),
          selectedDomains: getSelectedDomains(snapshot),
        }
    return { ...snapshot, currentIndex: 0, filters }
  })
}

function storeRuleFilterGroupSelection(
  group: RuleFilterGroup,
  isSelected: boolean,
  storeSnapshot: StoreReviewSnapshot,
) {
  storeSnapshot((snapshot) => ({
    ...snapshot,
    currentIndex: 0,
    filters: setRuleFilterGroupSelection(
      group,
      isSelected,
      getSelectedCategories(snapshot),
      getSelectedDomains(snapshot),
    ),
  }))
}

function toggleDecisionSounds(storeSnapshot: StoreReviewSnapshot) {
  storeSnapshot((snapshot) => {
    const audio = getAudioSettings(snapshot)
    return { ...snapshot, audio: { ...audio, enabled: !audio.enabled } }
  })
}

function updatePanelVisibility(
  visibilityPatch: Partial<NonNullable<ReviewSnapshot['panels']>>,
  storeSnapshot: StoreReviewSnapshot,
) {
  storeSnapshot((snapshot) => ({
    ...snapshot,
    panels: {
      inputVisible: snapshot.panels?.inputVisible ?? true,
      outputVisible: snapshot.panels?.outputVisible ?? true,
      ...visibilityPatch,
    },
  }))
}

function saveRuleDecision(
  snapshot: ReviewSnapshot,
  rule: BiomeRule,
  decision: RuleChoice['decision'],
) {
  return {
    ...snapshot,
    choices: appendRuleChoice(snapshot.choices, rule, decision),
    currentIndex: snapshot.currentIndex + 1,
  }
}

function createImportedSnapshot(snapshot: ReviewSnapshot, baseConfigText: string): ReviewSnapshot {
  return {
    baseConfigText,
    choices: [],
    currentIndex: 0,
    filters: snapshot.filters,
    panels: snapshot.panels,
  }
}

function safeParseConfig(inputText: string): BiomeConfig {
  try {
    return parseBiomeConfig(inputText)
  } catch {
    return {}
  }
}

function loadInitialSnapshot(): ReviewSnapshot {
  return loadReviewSnapshot(window.localStorage) ?? createInitialSnapshot()
}

function createInitialSnapshot(): ReviewSnapshot {
  return {
    audio: { ...defaultDecisionSoundSettings },
    baseConfigText: defaultInput,
    choices: [],
    currentIndex: 0,
    filters: {
      selectedCategories: [...ruleCategories],
      selectedDomains: [...availableRuleDomains],
    },
    panels: { inputVisible: true, outputVisible: true },
  }
}

function getSelectedCategories(snapshot: ReviewSnapshot): RuleCategory[] {
  return snapshot.filters?.selectedCategories ?? [...ruleCategories]
}

function getSelectedDomains(snapshot: ReviewSnapshot): RuleDomain[] {
  return snapshot.filters?.selectedDomains ?? [...availableRuleDomains]
}

function getAudioSettings(snapshot: ReviewSnapshot): ReviewAudioSettings {
  return snapshot.audio ?? { ...defaultDecisionSoundSettings }
}
