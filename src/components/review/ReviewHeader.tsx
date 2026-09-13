import { RotateCcw, Undo2 } from 'lucide-react'
import { memo } from 'react'
import { undoShortcut } from '../../domain/reviewShortcuts'
import type { RuleCategory } from '../../domain/types'
import { CategoryFilter } from './CategoryFilter'

type ReviewHeaderProps = {
  canUndo: boolean
  completedRules: number
  hasSelectedCategory: boolean
  progress: number
  selectedCategories: RuleCategory[]
  totalRules: number
  onCategoryToggle: (category: RuleCategory) => void
  onResetRequest: (trigger: HTMLButtonElement) => void
  onUndo: () => void
}

export const ReviewHeader = memo(function ReviewHeader(props: ReviewHeaderProps) {
  return (
    <header className="review-header">
      <div>
        <p className="eyebrow">Lint Forge</p>
        <h1>Lint Forge</h1>
        <p className="project-note">
          For Biome configs. Independent project, not an official Biome tool.
        </p>
      </div>
      <CategoryFilter
        selectedCategories={props.selectedCategories}
        onCategoryToggle={props.onCategoryToggle}
      />
      <ProgressActions {...props} />
    </header>
  )
}, areReviewHeaderPropsEqual)

function ProgressActions(props: ReviewHeaderProps) {
  return (
    <div className="progress-block">
      <span className="progress-value">
        {props.hasSelectedCategory ? `${props.progress}%` : 'No categories'}
      </span>
      <small className="progress-count">
        {props.completedRules}/{props.totalRules}
      </small>
      <ProgressTrack hasSelectedCategory={props.hasSelectedCategory} progress={props.progress} />
      <button
        type="button"
        aria-label="Back, undo last decision"
        aria-keyshortcuts={undoShortcut.ariaKey}
        className="secondary-button back-button"
        disabled={!props.canUndo}
        onClick={props.onUndo}
      >
        <Undo2 aria-hidden="true" size={18} />
        Back
        <kbd className="shortcut-hint">{undoShortcut.badge}</kbd>
      </button>
      <ResetButton onResetRequest={props.onResetRequest} />
    </div>
  )
}

function ProgressTrack({
  hasSelectedCategory,
  progress,
}: {
  hasSelectedCategory: boolean
  progress: number
}) {
  return (
    <progress
      aria-label="Review progress"
      className="progress-track"
      max={100}
      value={hasSelectedCategory ? progress : 0}
    />
  )
}

function ResetButton({ onResetRequest }: { onResetRequest: ReviewHeaderProps['onResetRequest'] }) {
  return (
    <button
      type="button"
      className="icon-button"
      onClick={(event) => onResetRequest(event.currentTarget)}
      aria-label="Reset review"
    >
      <RotateCcw size={18} />
    </button>
  )
}

function areReviewHeaderPropsEqual(previous: ReviewHeaderProps, next: ReviewHeaderProps) {
  return (
    previous.completedRules === next.completedRules &&
    previous.canUndo === next.canUndo &&
    previous.hasSelectedCategory === next.hasSelectedCategory &&
    previous.progress === next.progress &&
    previous.selectedCategories === next.selectedCategories &&
    previous.totalRules === next.totalRules &&
    previous.onCategoryToggle === next.onCategoryToggle &&
    previous.onResetRequest === next.onResetRequest &&
    previous.onUndo === next.onUndo
  )
}
