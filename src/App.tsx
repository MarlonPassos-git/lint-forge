import './App.css'
import { ReviewWorkspace } from './components/layout/ReviewWorkspace'
import { ResetDialog } from './components/reset/ResetDialog'
import { ReviewHeader } from './components/review/ReviewHeader'
import { useRuleReview } from './hooks/useRuleReview'

function App() {
  const review = useRuleReview()

  return (
    <main className="app-shell">
      <ReviewHeader
        audioEnabled={review.audio.enabled}
        canUndo={review.canUndo}
        completedRules={review.completedRules}
        hasSelectedFilter={review.hasSelectedFilter}
        progress={review.progress}
        selectedCategories={review.selectedCategories}
        selectedDomains={review.selectedDomains}
        totalRules={review.filteredRules.length}
        onAudioToggle={review.toggleAudioEnabled}
        onFilterGroupSelection={review.setFilterGroupSelection}
        onFilterToggle={review.toggleFilter}
        onResetRequest={review.openResetDialog}
        onSoundPreview={review.previewDecisionSound}
        onUndo={review.undoLastDecision}
      />
      <ReviewWorkspace controller={review} />
      {review.isResetDialogOpen ? (
        <ResetDialog onCancel={review.closeResetDialog} onConfirm={review.resetReview} />
      ) : null}
    </main>
  )
}

export default App
