import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { biomeRules } from '../domain/biomeRules'
import {
  buildBiomeConfig,
  formatBiomeConfig,
  getReviewableRules,
  parseBiomeConfig,
} from '../domain/configuration'
import {
  appendRuleChoice,
  getCompletedRuleCount,
  getProgressPercent,
  getVisibleRuleWindow,
} from '../domain/reviewState'
import { filterRulesByCategories, ruleCategories } from '../domain/ruleCategories'
import type {
  BiomeConfig,
  BiomeRule,
  ReviewSnapshot,
  RuleCategory,
  RuleChoice,
} from '../domain/types'
import {
  clearReviewSnapshot,
  loadReviewSnapshot,
  saveReviewSnapshot,
} from '../storage/localReviewStore'
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
  const actions = useReviewActions(
    state,
    setSnapshot,
    setImportText,
    setErrorText,
    setOutgoingDecision,
  )
  const dialogActions = useResetDialogActions(actions.resetReview, setIsResetDialogOpen)
  useReviewShortcuts({
    isBlocked: !state.activeRule || state.isResetDialogOpen || Boolean(state.outgoingDecision),
    onChoose: actions.chooseRule,
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
  const baseConfig = useMemo(
    () => safeParseConfig(snapshot.baseConfigText),
    [snapshot.baseConfigText],
  )
  const filteredRules = useMemo(
    () => filterRulesByCategories(biomeRules, selectedCategories),
    [selectedCategories],
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
    completedRules,
    filteredRules,
    isResetDialogOpen,
    outputText,
    outgoingDecision,
    pendingRules,
    selectedCategories,
    visibleRules,
  })
}

function useReviewActions(
  state: ReturnType<typeof buildReviewState>,
  setSnapshot: SetReviewSnapshot,
  setImportText: (value: string) => void,
  setErrorText: (value: string) => void,
  setOutgoingDecision: (decision: RuleChoice['decision'] | null) => void,
) {
  const storeSnapshot = useSnapshotStore(setSnapshot)
  const primaryActions = usePrimaryReviewActions({
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
  const toggleCategoryAction = useCallback(
    (category: RuleCategory) => toggleCategory(category, storeSnapshot),
    [storeSnapshot],
  )
  const updatePanelVisibilityAction = useCallback(
    (patch: Partial<NonNullable<ReviewSnapshot['panels']>>) =>
      updatePanelVisibility(patch, storeSnapshot),
    [storeSnapshot],
  )
  return {
    toggleCategory: toggleCategoryAction,
    updatePanelVisibility: updatePanelVisibilityAction,
  }
}

type PrimaryReviewActionDependencies = {
  state: ReturnType<typeof buildReviewState>
  setSnapshot: SetReviewSnapshot
  setImportText: (value: string) => void
  setErrorText: (value: string) => void
  setOutgoingDecision: (decision: RuleChoice['decision'] | null) => void
  storeSnapshot: StoreReviewSnapshot
}

function usePrimaryReviewActions(dependencies: PrimaryReviewActionDependencies) {
  const { setErrorText, setImportText, setOutgoingDecision, setSnapshot, state, storeSnapshot } =
    dependencies
  const { cancelDecisionTimer, decisionTimer } = usePendingDecisionTimer(setOutgoingDecision)
  const chooseRule = useChooseRuleAction(
    state.activeRule,
    state.outgoingDecision,
    decisionTimer,
    storeSnapshot,
    setOutgoingDecision,
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
  return { chooseRule, resetReview, startReview }
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
      ),
    [activeRule, decisionTimer, outgoingDecision, setOutgoingDecision, storeSnapshot],
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
) {
  if (!activeRule || outgoingDecision) return
  playClickTone(decision)
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
    completedRules: number
    filteredRules: BiomeRule[]
    isResetDialogOpen: boolean
    outputText: string
    outgoingDecision: RuleChoice['decision'] | null
    pendingRules: BiomeRule[]
    selectedCategories: RuleCategory[]
    visibleRules: BiomeRule[]
  },
) {
  const isInputVisible = snapshot.panels?.inputVisible ?? true
  const isOutputVisible = snapshot.panels?.outputVisible ?? true
  return {
    activeRule: derived.pendingRules[0],
    choices: snapshot.choices,
    completedRules: derived.completedRules,
    errorText,
    filteredRules: derived.filteredRules,
    hasSelectedCategory: derived.selectedCategories.length > 0,
    importText,
    isInputVisible,
    isOutputVisible,
    isResetDialogOpen: derived.isResetDialogOpen,
    outputText: derived.outputText,
    outgoingDecision: derived.outgoingDecision,
    progress: getProgressPercent(derived.filteredRules.length, derived.completedRules),
    selectedCategories: derived.selectedCategories,
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

function toggleCategory(category: RuleCategory, storeSnapshot: StoreReviewSnapshot) {
  storeSnapshot((snapshot) => ({
    ...snapshot,
    currentIndex: 0,
    filters: {
      selectedCategories: getToggledCategories(getSelectedCategories(snapshot), category),
    },
  }))
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

function playClickTone(decision: RuleChoice['decision']) {
  const audioContext = new AudioContext()
  const oscillator = audioContext.createOscillator()
  const frequencies = { error: 620, info: 360, off: 240, warn: 460 }
  oscillator.frequency.value = frequencies[decision]
  oscillator.connect(audioContext.destination)
  oscillator.start()
  oscillator.stop(audioContext.currentTime + 0.045)
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
    baseConfigText: defaultInput,
    choices: [],
    currentIndex: 0,
    filters: { selectedCategories: [...ruleCategories] },
    panels: { inputVisible: true, outputVisible: true },
  }
}

function getSelectedCategories(snapshot: ReviewSnapshot) {
  return snapshot.filters?.selectedCategories ?? [...ruleCategories]
}

function getToggledCategories(selectedCategories: RuleCategory[], category: RuleCategory) {
  if (selectedCategories.includes(category)) {
    return selectedCategories.filter((selectedCategory) => selectedCategory !== category)
  }
  return [...selectedCategories, category]
}
