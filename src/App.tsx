import './App.css'
import { ReviewWorkspace } from './components/layout/ReviewWorkspace'
import { ResetDialog } from './components/reset/ResetDialog'
import { ReviewHeader } from './components/review/ReviewHeader'
import { ReviewSidebar } from './components/sidebar/ReviewSidebar'
import { useRuleReview } from './hooks/useRuleReview'

function App() {
  const review = useRuleReview()

  return (
    <main className="app-shell">
      <ReviewHeader
        canUndo={review.canUndo}
        completedRules={review.completedRules}
        hasSelectedFilter={review.hasSelectedFilter}
        progress={review.progress}
        totalRules={review.filteredRules.length}
        onResetRequest={review.openResetDialog}
        onUndo={review.undoLastDecision}
      />
      <div className="workbench">
        <ReviewSidebar
          audioEnabled={review.audio.enabled}
          audioPack={review.audio.pack}
          selectedCategories={review.selectedCategories}
          selectedDomains={review.selectedDomains}
          onAudioPackChange={review.setAudioPack}
          onAudioToggle={review.toggleAudioEnabled}
          onFilterGroupSelection={review.setFilterGroupSelection}
          onFilterToggle={review.toggleFilter}
          onSoundPreview={review.previewDecisionSound}
        />
        <ReviewWorkspace controller={review} />
      </div>
      {review.isResetDialogOpen ? (
        <ResetDialog onCancel={review.closeResetDialog} onConfirm={review.resetReview} />
      ) : null}
    </main>
  )
}

export default App
