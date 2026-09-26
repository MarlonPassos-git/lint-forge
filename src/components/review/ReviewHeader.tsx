import { RotateCcw, Undo2 } from 'lucide-react'
import { memo } from 'react'
import { undoShortcut } from '../../domain/reviewShortcuts'
import { NavigationLink } from '../navigation/NavigationLink'
import { ReviewSetupMenu } from '../setup/ReviewSetupMenu'
import { useReviewTool } from './ReviewToolContext'

type ReviewSetupMenuProps = Parameters<typeof ReviewSetupMenu>[0]

type ReviewHeaderProps = ReviewSetupMenuProps & {
  canUndo: boolean
  completedRules: number
  hasSelectedFilter: boolean
  progress: number
  totalRules: number
  onResetRequest: (trigger: HTMLButtonElement) => void
  onUndo: () => void
}

export const ReviewHeader = memo(function ReviewHeader(props: ReviewHeaderProps) {
  const tool = useReviewTool()
  return (
    <header className="review-header">
      <div>
        <h1>
          <img src="/favicon.svg" alt="" width="36" height="36" />
          Lint Forge
        </h1>
        <nav className="tool-navigation" aria-label="Tool navigation">
          <NavigationLink href="/">All tools</NavigationLink>
          <span>{tool.name}</span>
          <small>v{tool.version}</small>
        </nav>
      </div>
      <ProgressActions {...props} />
    </header>
  )
}, areReviewHeaderPropsEqual)

function ProgressActions(props: ReviewHeaderProps) {
  return (
    <div className="progress-block">
      <span className="progress-value">
        {props.hasSelectedFilter ? `${props.progress}%` : 'No filters'}
      </span>
      <small className="progress-count">
        {props.completedRules}/{props.totalRules}
      </small>
      <ProgressTrack hasSelectedFilter={props.hasSelectedFilter} progress={props.progress} />
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
      <ReviewSetupMenu {...props} />
    </div>
  )
}

function ProgressTrack({
  hasSelectedFilter,
  progress,
}: {
  hasSelectedFilter: boolean
  progress: number
}) {
  return (
    <progress
      aria-label="Review progress"
      className="progress-track"
      max={100}
      value={hasSelectedFilter ? progress : 0}
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
    previous.canUndo === next.canUndo &&
    previous.completedRules === next.completedRules &&
    previous.hasSelectedFilter === next.hasSelectedFilter &&
    previous.progress === next.progress &&
    previous.selectedCategories === next.selectedCategories &&
    previous.selectedDomains === next.selectedDomains &&
    previous.totalRules === next.totalRules &&
    previous.onFilterGroupSelection === next.onFilterGroupSelection &&
    previous.onFilterToggle === next.onFilterToggle &&
    previous.onResetRequest === next.onResetRequest &&
    previous.onUndo === next.onUndo
  )
}
