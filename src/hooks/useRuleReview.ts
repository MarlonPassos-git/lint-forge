import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useReviewTool } from '../components/review/ReviewToolContext'
import { toRuleKey } from '../domain/configuration'
import { appendRuleChoice, getProgressPercent, getVisibleRuleWindow } from '../domain/reviewState'
import {
  filterRulesBySelection,
  hasSelectedFilters,
  type RuleFilterGroup,
} from '../domain/ruleFilters'
import {
  initialToolSnapshot,
  selectToolFilterGroup,
  toggleToolFilter,
  toolStorageKey,
  undoToolChoice,
} from '../domain/tools/reviewSnapshot'
import type { ReviewTool } from '../domain/tools/types'
import type { ReviewSnapshot, RuleDecision, RuleFilter } from '../domain/types'
import {
  clearReviewSnapshot,
  loadReviewSnapshot,
  saveReviewSnapshot,
} from '../storage/localReviewStore'
import { useReviewShortcuts } from './useReviewShortcuts'

type SnapshotUpdate = (snapshot: ReviewSnapshot) => ReviewSnapshot

export function useRuleReview() {
  const tool = useReviewTool()
  const [snapshot, setSnapshot] = useState(() => loadToolSnapshot(tool))
  const [importText, setImportText] = useState(snapshot.baseConfigText)
  const [errorText, setErrorText] = useState('')
  const [outgoingDecision, setOutgoingDecision] = useState<RuleDecision | null>(null)
  const derived = useToolReviewState(snapshot, tool)
  const storeSnapshot = useCallback(
    (update: SnapshotUpdate) =>
      setSnapshot((previous) => {
        const next = update(previous)
        saveReviewSnapshot(window.localStorage, next, toolStorageKey(tool))
        return next
      }),
    [tool],
  )
  const timer = useDecisionTimer(setOutgoingDecision)
  const actions = useToolReviewActions({
    tool,
    importText,
    derived,
    outgoingDecision,
    timer,
    storeSnapshot,
    setSnapshot,
    setImportText,
    setErrorText,
    setOutgoingDecision,
  })
  const dialog = useResetDialogActions(actions.resetReview)
  useReviewShortcuts({
    isDecisionBlocked: !derived.activeRule || dialog.isResetDialogOpen || Boolean(outgoingDecision),
    isUndoBlocked:
      !snapshot.choices.length || Boolean(outgoingDecision) || dialog.isResetDialogOpen,
    onChoose: actions.chooseRule,
    onUndo: actions.undoLastDecision,
  })
  return {
    ...derived,
    ...actions,
    ...dialog,
    snapshot,
    choices: snapshot.choices,
    importText,
    errorText,
    outgoingDecision,
    setImportText,
    canUndo: snapshot.choices.length > 0 && !outgoingDecision,
    isInputVisible: snapshot.panels?.inputVisible ?? true,
    isOutputVisible: snapshot.panels?.outputVisible ?? true,
  }
}

function useToolReviewState(snapshot: ReviewSnapshot, tool: ReviewTool) {
  const selectedCategories = snapshot.filters?.selectedCategories ?? tool.categories
  const selectedDomains = useMemo(
    () => snapshot.filters?.selectedDomains ?? Object.keys(tool.domainLabels),
    [snapshot.filters?.selectedDomains, tool],
  )
  const baseConfig = useMemo(
    () => tool.parse(snapshot.baseConfigText),
    [snapshot.baseConfigText, tool],
  )
  const filteredRules = useMemo(
    () => filterRulesBySelection(tool.rules, selectedCategories, selectedDomains),
    [tool, selectedCategories, selectedDomains],
  )
  const pendingRules = useMemo(() => {
    const configured = tool.configuredKeys(baseConfig)
    const decided = new Set(snapshot.choices.map((choice) => choice.ruleKey))
    return filteredRules.filter(
      (rule) => !configured.has(toRuleKey(rule)) && !decided.has(toRuleKey(rule)),
    )
  }, [baseConfig, filteredRules, snapshot.choices, tool])
  const outputText = useMemo(
    () => tool.generate(baseConfig, snapshot.choices),
    [tool, baseConfig, snapshot.choices],
  )
  const visibleRules = useMemo(() => getVisibleRuleWindow(pendingRules, 0), [pendingRules])
  const completedRules = filteredRules.length - pendingRules.length
  return {
    activeRule: pendingRules[0],
    filteredRules,
    outputText,
    filename: tool.filename(baseConfig),
    visibleRules,
    completedRules,
    selectedCategories,
    selectedDomains,
    hasSelectedFilter: hasSelectedFilters(selectedCategories, selectedDomains),
    progress: getProgressPercent(filteredRules.length, completedRules),
  }
}

type ToolActionDependencies = {
  tool: ReviewTool
  importText: string
  derived: ReturnType<typeof useToolReviewState>
  outgoingDecision: RuleDecision | null
  timer: ReturnType<typeof useDecisionTimer>
  storeSnapshot: (update: SnapshotUpdate) => void
  setSnapshot: (snapshot: ReviewSnapshot) => void
  setImportText: (text: string) => void
  setErrorText: (text: string) => void
  setOutgoingDecision: (decision: RuleDecision | null) => void
}

function useToolReviewActions(dependencies: ToolActionDependencies) {
  const { tool, storeSnapshot, outgoingDecision, derived, setOutgoingDecision, timer } =
    dependencies
  const chooseRule = useCallback(
    (decision: RuleDecision) => {
      const rule = derived.activeRule
      if (
        !rule ||
        outgoingDecision ||
        timer.pending.current !== null ||
        !tool.decisions.includes(decision)
      )
        return
      setOutgoingDecision(decision)
      timer.pending.current = window.setTimeout(() => {
        storeSnapshot((snapshot) => ({
          ...snapshot,
          choices: appendRuleChoice(snapshot.choices, rule, decision),
          currentIndex: snapshot.currentIndex + 1,
        }))
        timer.pending.current = null
        setOutgoingDecision(null)
      }, 280)
    },
    [derived.activeRule, outgoingDecision, setOutgoingDecision, storeSnapshot, timer.pending, tool],
  )
  const undoLastDecision = useCallback(() => {
    if (!outgoingDecision) storeSnapshot((snapshot) => undoToolChoice(snapshot, tool))
  }, [outgoingDecision, storeSnapshot, tool])
  const filters = useToolFilterActions(tool, storeSnapshot)
  return {
    ...filters,
    chooseRule,
    undoLastDecision,
    startReview: () => importToolConfig(dependencies),
    resetReview: () => resetToolReview(dependencies),
  }
}

function useToolFilterActions(tool: ReviewTool, storeSnapshot: (update: SnapshotUpdate) => void) {
  const toggleFilter = useCallback(
    (filter: RuleFilter) => storeSnapshot((snapshot) => toggleToolFilter(snapshot, filter, tool)),
    [storeSnapshot, tool],
  )
  const setFilterGroupSelection = useCallback(
    (group: RuleFilterGroup, selected: boolean) =>
      storeSnapshot((snapshot) => selectToolFilterGroup(snapshot, group, selected, tool)),
    [storeSnapshot, tool],
  )
  const updatePanelVisibility = useCallback(
    (patch: Partial<NonNullable<ReviewSnapshot['panels']>>) =>
      storeSnapshot((snapshot) => ({
        ...snapshot,
        panels: { inputVisible: true, outputVisible: true, ...snapshot.panels, ...patch },
      })),
    [storeSnapshot],
  )
  return { toggleFilter, setFilterGroupSelection, updatePanelVisibility }
}

function importToolConfig({
  tool,
  importText,
  timer,
  storeSnapshot,
  setImportText,
  setErrorText,
}: ToolActionDependencies) {
  try {
    const config = tool.parse(importText)
    tool.generate(config, [])
    const baseConfigText = tool.format(config)
    timer.cancel()
    storeSnapshot((snapshot) => ({ ...snapshot, baseConfigText, choices: [], currentIndex: 0 }))
    setImportText(baseConfigText)
    setErrorText('')
  } catch (error) {
    setErrorText(error instanceof Error ? error.message : 'Invalid config')
  }
}

function resetToolReview({
  tool,
  timer,
  setSnapshot,
  setImportText,
  setErrorText,
}: ToolActionDependencies) {
  timer.cancel()
  clearReviewSnapshot(window.localStorage, toolStorageKey(tool))
  setSnapshot(initialToolSnapshot(tool))
  setImportText(tool.defaultInput)
  setErrorText('')
}

function loadToolSnapshot(tool: ReviewTool): ReviewSnapshot {
  const snapshot = loadReviewSnapshot(
    window.localStorage,
    toolStorageKey(tool),
    tool.categories,
    Object.keys(tool.domainLabels),
  )
  if (!snapshot) return initialToolSnapshot(tool)
  try {
    tool.generate(tool.parse(snapshot.baseConfigText), snapshot.choices)
    return snapshot
  } catch {
    clearReviewSnapshot(window.localStorage, toolStorageKey(tool))
    return initialToolSnapshot(tool)
  }
}

function useDecisionTimer(setOutgoingDecision: (decision: RuleDecision | null) => void) {
  const pending = useRef<number | null>(null)
  const cancel = useCallback(() => {
    if (pending.current !== null) window.clearTimeout(pending.current)
    pending.current = null
    setOutgoingDecision(null)
  }, [setOutgoingDecision])
  useEffect(
    () => () => {
      if (pending.current !== null) window.clearTimeout(pending.current)
    },
    [],
  )
  return { pending, cancel }
}

function useResetDialogActions(resetReviewAction: () => void) {
  const [isResetDialogOpen, setIsOpen] = useState(false)
  const resetTriggerRef = useRef<HTMLElement | null>(null)
  const closeResetDialog = useCallback(() => {
    setIsOpen(false)
    window.requestAnimationFrame(() => resetTriggerRef.current?.focus())
  }, [])
  const openResetDialog = useCallback((trigger: HTMLElement) => {
    resetTriggerRef.current = trigger
    setIsOpen(true)
  }, [])
  const resetReview = () => {
    resetReviewAction()
    closeResetDialog()
  }
  return { isResetDialogOpen, closeResetDialog, openResetDialog, resetReview }
}
