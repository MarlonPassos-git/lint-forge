import { SlidersHorizontal, Volume2, VolumeX } from 'lucide-react'
import { decisionSoundPackOptions } from '../../audio/decisionSoundPlayer'
import { ruleCategories } from '../../domain/ruleCategories'
import {
  availableRuleDomains,
  type RuleFilterGroup,
  ruleDomainLabels,
} from '../../domain/ruleFilters'
import type {
  DecisionSoundPack,
  RuleCategory,
  RuleDecision,
  RuleDomain,
  RuleFilter,
} from '../../domain/types'

type ReviewSidebarProps = {
  audioEnabled: boolean
  audioPack: DecisionSoundPack
  selectedCategories: RuleCategory[]
  selectedDomains: RuleDomain[]
  onAudioPackChange: (pack: DecisionSoundPack) => void
  onAudioToggle: () => void
  onFilterGroupSelection: (group: RuleFilterGroup, isSelected: boolean) => void
  onFilterToggle: (filter: RuleFilter) => void
  onSoundPreview: (decision: RuleDecision) => void
}

export function ReviewSidebar(props: ReviewSidebarProps) {
  return (
    <aside className="review-sidebar" aria-label="Review setup">
      <h2 className="sidebar-title">
        <SlidersHorizontal aria-hidden="true" size={20} /> Review setup
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
      <SoundSettings {...props} />
    </aside>
  )
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

function SoundSettings(props: ReviewSidebarProps) {
  return (
    <section className="sound-settings" aria-labelledby="sound-settings-heading">
      <div className="filter-group-header">
        <h3 id="sound-settings-heading">Sound</h3>
        {props.audioEnabled ? (
          <Volume2 aria-hidden="true" size={18} />
        ) : (
          <VolumeX aria-hidden="true" size={18} />
        )}
      </div>
      <label className="sound-toggle" htmlFor="decision-sounds-enabled">
        <input
          checked={props.audioEnabled}
          id="decision-sounds-enabled"
          onChange={props.onAudioToggle}
          type="checkbox"
        />
        <span>Decision sounds</span>
      </label>
      <label className="sound-pack" htmlFor="decision-sound-pack">
        <span>Pack</span>
        <select
          id="decision-sound-pack"
          onChange={(event) => props.onAudioPackChange(event.target.value as DecisionSoundPack)}
          value={props.audioPack}
        >
          {decisionSoundPackOptions.map((option) => (
            <option key={option.name} value={option.name}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <SoundPreviews audioEnabled={props.audioEnabled} onSoundPreview={props.onSoundPreview} />
    </section>
  )
}

function SoundPreviews(props: {
  audioEnabled: boolean
  onSoundPreview: (decision: RuleDecision) => void
}) {
  return (
    <div className="sound-previews">
      {soundPreviewDecisions.map((decision) => (
        <button
          aria-label={`Preview ${decision} sound`}
          className={`preview-${decision}-button`}
          disabled={!props.audioEnabled}
          key={decision}
          onClick={() => props.onSoundPreview(decision)}
          type="button"
        >
          {decisionLabels[decision]}
        </button>
      ))}
    </div>
  )
}

const soundPreviewDecisions: RuleDecision[] = ['off', 'info', 'warn', 'error']

const decisionLabels: Record<RuleDecision, string> = {
  error: 'Error',
  info: 'Info',
  off: 'Off',
  warn: 'Warn',
}

function getFilterInputId(filter: RuleFilter) {
  return `filter-${filter
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-$/g, '')}`
}
