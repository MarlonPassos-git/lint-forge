import { Menu } from 'lucide-react'
import { type RefObject, useEffect, useRef, useState } from 'react'
import type { RuleFilterGroup } from '../../domain/ruleFilters'
import type { ReviewDomainGroup } from '../../domain/tools/types'
import type { RuleCategory, RuleDomain, RuleFilter } from '../../domain/types'
import { useReviewTool } from '../review/ReviewToolContext'

type ReviewSetupMenuProps = {
  selectedCategories: RuleCategory[]
  selectedDomains: RuleDomain[]
  onDomainSelection: (domains: RuleDomain[], isSelected: boolean) => void
  onFilterGroupSelection: (group: RuleFilterGroup, isSelected: boolean) => void
  onFilterToggle: (filter: RuleFilter) => void
}

const setupPanelId = 'review-setup-popover'
const panelViewportMargin = 8
const panelWidth = 360

export function ReviewSetupMenu(props: ReviewSetupMenuProps) {
  const tool = useReviewTool()
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
        data-tool={tool.id}
        id={setupPanelId}
        popover="auto"
        tabIndex={-1}
      >
        <h2 className="setup-title" id="review-setup-title">
          Review setup
        </h2>
        <FilterGroup
          filters={tool.categories}
          heading="Languages"
          getFilterLabel={(filter) => filter}
          isFilterSelected={(filter) => props.selectedCategories.includes(filter as RuleCategory)}
          onFilterToggle={props.onFilterToggle}
          onGroupSelection={(isSelected) => props.onFilterGroupSelection('categories', isSelected)}
        />
        <DomainFilterGroup
          groups={tool.domainGroups}
          heading={tool.domainSectionLabel}
          labels={tool.domainLabels}
          selectedDomains={props.selectedDomains}
          onDomainSelection={props.onDomainSelection}
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
  const preferredWidth = panel.dataset.tool === 'ruff' ? 480 : panelWidth
  const width = Math.min(preferredWidth, window.innerWidth - panelViewportMargin * 2)
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
  const headingId = getFilterGroupHeadingId(props.heading)
  const selectedCount = props.filters.filter((filter) => props.isFilterSelected(filter)).length
  return (
    <section className="filter-group" aria-labelledby={headingId}>
      <FilterGroupHeader
        heading={props.heading}
        headingId={headingId}
        isAllSelected={props.filters.length > 0 && selectedCount === props.filters.length}
        isPartial={selectedCount > 0 && selectedCount < props.filters.length}
        onToggle={() => props.onGroupSelection(selectedCount < props.filters.length)}
      />
      <FilterOptions
        filters={props.filters}
        getFilterLabel={props.getFilterLabel}
        isFilterSelected={props.isFilterSelected}
        onFilterToggle={props.onFilterToggle}
      />
    </section>
  )
}

type DomainFilterGroupProps = {
  groups: ReviewDomainGroup[]
  heading: string
  labels: Record<string, string>
  selectedDomains: RuleDomain[]
  onDomainSelection: (domains: RuleDomain[], isSelected: boolean) => void
  onFilterToggle: (filter: RuleFilter) => void
  onGroupSelection: (isSelected: boolean) => void
}

/** Renders tool domains grouped by origin, such as built-in rules versus plugins. */
function DomainFilterGroup(props: DomainFilterGroupProps) {
  const headingId = getFilterGroupHeadingId(props.heading)
  const domains = props.groups.flatMap((group) => group.domains)
  const selectedCount = domains.filter((domain) => props.selectedDomains.includes(domain)).length
  return (
    <section className="filter-group" aria-labelledby={headingId}>
      <FilterGroupHeader
        heading={props.heading}
        headingId={headingId}
        isAllSelected={domains.length > 0 && selectedCount === domains.length}
        isPartial={selectedCount > 0 && selectedCount < domains.length}
        onToggle={() => props.onGroupSelection(selectedCount < domains.length)}
      />
      {props.groups.map((group) => (
        <DomainGroup
          group={group}
          key={group.label}
          labels={props.labels}
          onDomainSelection={props.onDomainSelection}
          onFilterToggle={props.onFilterToggle}
          selectedDomains={props.selectedDomains}
        />
      ))}
    </section>
  )
}

function DomainGroup(props: {
  group: ReviewDomainGroup
  labels: Record<string, string>
  selectedDomains: RuleDomain[]
  onDomainSelection: (domains: RuleDomain[], isSelected: boolean) => void
  onFilterToggle: (filter: RuleFilter) => void
}) {
  const headingId = getFilterGroupHeadingId(props.group.label)
  const selectedCount = props.group.domains.filter((domain) =>
    props.selectedDomains.includes(domain),
  ).length
  const isAllSelected = selectedCount === props.group.domains.length
  return (
    <section className="domain-group" aria-labelledby={headingId}>
      <div className="domain-group-header">
        <h4 id={headingId}>{props.group.label}</h4>
        <GroupToggle
          isAllSelected={isAllSelected}
          isPartial={selectedCount > 0 && !isAllSelected}
          name={props.group.label}
          onToggle={() => props.onDomainSelection(props.group.domains, !isAllSelected)}
        />
      </div>
      <p className="domain-group-summary">{props.group.summary}</p>
      <FilterOptions
        filters={props.group.domains}
        getFilterLabel={(filter) => props.labels[filter] ?? filter}
        isFilterSelected={(filter) => props.selectedDomains.includes(filter as RuleDomain)}
        onFilterToggle={props.onFilterToggle}
      />
    </section>
  )
}

function FilterGroupHeader(props: {
  heading: string
  headingId: string
  isAllSelected: boolean
  isPartial: boolean
  onToggle: () => void
}) {
  return (
    <div className="filter-group-header">
      <h3 id={props.headingId}>{props.heading}</h3>
      <GroupToggle
        isAllSelected={props.isAllSelected}
        isPartial={props.isPartial}
        name={props.heading}
        onToggle={props.onToggle}
      />
    </div>
  )
}

/** Tri-state select-all used by the whole section and by every domain group. */
function GroupToggle(props: {
  isAllSelected: boolean
  isPartial: boolean
  name: string
  onToggle: () => void
}) {
  return (
    <input
      aria-label={`Toggle all ${props.name}`}
      checked={props.isAllSelected}
      className="filter-checkbox group-toggle"
      onChange={props.onToggle}
      ref={(input) => {
        if (input) input.indeterminate = props.isPartial
      }}
      title={props.isAllSelected ? `Clear all ${props.name}` : `Select all ${props.name}`}
      type="checkbox"
    />
  )
}

type FilterOptionsProps = {
  filters: readonly RuleFilter[]
  getFilterLabel: (filter: RuleFilter) => string
  isFilterSelected: (filter: RuleFilter) => boolean
  onFilterToggle: (filter: RuleFilter) => void
}

function FilterOptions(props: FilterOptionsProps) {
  return (
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
  )
}

function getFilterGroupHeadingId(heading: string) {
  return `filter-group-${heading
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-$/g, '')}`
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
        className="filter-checkbox"
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
