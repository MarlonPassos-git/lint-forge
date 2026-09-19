import { Menu } from 'lucide-react'
import { type RefObject, useEffect, useRef, useState } from 'react'
import { ruleCategories } from '../../domain/ruleCategories'
import {
  availableRuleDomains,
  type RuleFilterGroup,
  ruleDomainLabels,
} from '../../domain/ruleFilters'
import type { RuleCategory, RuleDomain, RuleFilter } from '../../domain/types'

type ReviewSetupMenuProps = {
  selectedCategories: RuleCategory[]
  selectedDomains: RuleDomain[]
  onFilterGroupSelection: (group: RuleFilterGroup, isSelected: boolean) => void
  onFilterToggle: (filter: RuleFilter) => void
}

const setupPanelId = 'review-setup-popover'
const panelViewportMargin = 8
const panelWidth = 360

export function ReviewSetupMenu(props: ReviewSetupMenuProps) {
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [isOpen, setIsOpen] = useState(false)
  useSetupPanelEvents(panelRef, triggerRef, setIsOpen)
  useSetupPanelPosition(isOpen, panelRef, triggerRef)

  return (
    <>
      <button
        ref={triggerRef}
        aria-controls={setupPanelId}
        aria-expanded={isOpen}
        aria-label="Review setup"
        className="setup-menu-button"
        popoverTarget={setupPanelId}
        type="button"
      >
        <Menu aria-hidden="true" size={18} />
      </button>
      <section
        ref={panelRef}
        aria-labelledby="review-setup-title"
        className="review-setup-popover"
        id={setupPanelId}
        popover="auto"
        tabIndex={-1}
      >
        <h2 className="setup-title" id="review-setup-title">
          Review setup
        </h2>
        <FilterGroup
          filters={ruleCategories}
          heading="Languages"
          getFilterLabel={(filter) => filter}
          isFilterSelected={(filter) => props.selectedCategories.includes(filter as RuleCategory)}
          onFilterToggle={props.onFilterToggle}
          onGroupSelection={(isSelected) => props.onFilterGroupSelection('categories', isSelected)}
        />
        <FilterGroup
          filters={availableRuleDomains}
          heading="Tools"
          getFilterLabel={(filter) => ruleDomainLabels[filter as RuleDomain]}
          isFilterSelected={(filter) => props.selectedDomains.includes(filter as RuleDomain)}
          onFilterToggle={props.onFilterToggle}
          onGroupSelection={(isSelected) => props.onFilterGroupSelection('domains', isSelected)}
        />
      </section>
    </>
  )
}

function useSetupPanelEvents(
  panelRef: RefObject<HTMLDivElement | null>,
  triggerRef: RefObject<HTMLButtonElement | null>,
  setIsOpen: (isOpen: boolean) => void,
) {
  useEffect(() => {
    const panel = panelRef.current
    if (!panel) return
    const handleBeforeToggle = (event: Event) => {
      const { newState } = event as ToggleEvent
      if (newState !== 'open' || !triggerRef.current) return
      positionSetupPanel(panel, triggerRef.current)
    }
    const handleToggle = (event: Event) => {
      const newState = (event as ToggleEvent).newState
      setIsOpen(newState === 'open')
      // Move focus into the panel for a predictable keyboard flow in every browser.
      if (newState === 'open') panel.focus()
    }
    panel.addEventListener('beforetoggle', handleBeforeToggle)
    panel.addEventListener('toggle', handleToggle)
    return () => {
      panel.removeEventListener('beforetoggle', handleBeforeToggle)
      panel.removeEventListener('toggle', handleToggle)
    }
  }, [panelRef, setIsOpen, triggerRef])
}

function useSetupPanelPosition(
  isOpen: boolean,
  panelRef: RefObject<HTMLDivElement | null>,
  triggerRef: RefObject<HTMLButtonElement | null>,
) {
  useEffect(() => {
    if (!isOpen) return
    const positionPanel = () => {
      const panel = panelRef.current
      const trigger = triggerRef.current
      if (!panel || !trigger) return
      positionSetupPanel(panel, trigger)
    }
    window.addEventListener('resize', positionPanel)
    window.addEventListener('scroll', positionPanel, true)
    return () => {
      window.removeEventListener('resize', positionPanel)
      window.removeEventListener('scroll', positionPanel, true)
    }
  }, [isOpen, panelRef, triggerRef])
}

function positionSetupPanel(panel: HTMLDivElement, trigger: HTMLButtonElement) {
  const triggerBounds = trigger.getBoundingClientRect()
  const width = Math.min(panelWidth, window.innerWidth - panelViewportMargin * 2)
  const top = triggerBounds.bottom + panelViewportMargin
  const left = clamp(
    triggerBounds.right - width,
    panelViewportMargin,
    window.innerWidth - width - panelViewportMargin,
  )
  panel.style.left = `${Math.round(left)}px`
  panel.style.top = `${Math.round(top)}px`
  panel.style.width = `${Math.round(width)}px`
  panel.style.maxHeight = `${Math.round(Math.max(window.innerHeight - top - panelViewportMargin, 240))}px`
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum)
}

type FilterGroupProps = {
  filters: readonly RuleFilter[]
  heading: string
  getFilterLabel: (filter: RuleFilter) => string
  isFilterSelected: (filter: RuleFilter) => boolean
  onFilterToggle: (filter: RuleFilter) => void
  onGroupSelection: (isSelected: boolean) => void
}

function FilterGroup(props: FilterGroupProps) {
  const headingId = `filter-group-${props.heading.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
  return (
    <section className="filter-group" aria-labelledby={headingId}>
      <div className="filter-group-header">
        <h3 id={headingId}>{props.heading}</h3>
        <div className="filter-group-actions">
          <button
            aria-label={`Select all ${props.heading}`}
            type="button"
            onClick={() => props.onGroupSelection(true)}
          >
            All
          </button>
          <button
            aria-label={`Clear all ${props.heading}`}
            type="button"
            onClick={() => props.onGroupSelection(false)}
          >
            None
          </button>
        </div>
      </div>
      <div className="filter-options">
        {props.filters.map((filter) => (
          <FilterOption
            filter={filter}
            isSelected={props.isFilterSelected(filter)}
            key={filter}
            label={props.getFilterLabel(filter)}
            onFilterToggle={props.onFilterToggle}
          />
        ))}
      </div>
    </section>
  )
}

function FilterOption(props: {
  filter: RuleFilter
  isSelected: boolean
  label: string
  onFilterToggle: (filter: RuleFilter) => void
}) {
  const filterInputId = getFilterInputId(props.filter)

  return (
    <label className="filter-option" htmlFor={filterInputId} title={props.label}>
      <input
        checked={props.isSelected}
        id={filterInputId}
        name="rule-filter"
        onChange={() => props.onFilterToggle(props.filter)}
        type="checkbox"
      />
      <span>{props.label}</span>
    </label>
  )
}

function getFilterInputId(filter: RuleFilter) {
  return `filter-${filter
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-$/g, '')}`
}
