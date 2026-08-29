import { useEffect, useRef } from 'react'

type ResetDialogProps = {
  onCancel: () => void
  onConfirm: () => void
}

export function ResetDialog({ onCancel, onConfirm }: ResetDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    openResetDialog(dialog)
    return () => closeResetDialog(dialog)
  }, [])

  return (
    <dialog
      ref={dialogRef}
      className="reset-dialog"
      aria-labelledby="reset-title"
      onCancel={onCancel}
    >
      <h2 id="reset-title">Reset review?</h2>
      <p>This clears imported config, decisions, progress, filters, and hidden panel state.</p>
      <form
        method="dialog"
        className="dialog-actions"
        onSubmit={(event) => {
          event.preventDefault()
          onCancel()
        }}
      >
        <button type="submit" value="cancel" className="secondary-button">
          Cancel
        </button>
        <button type="button" className="error-button" onClick={onConfirm}>
          Reset everything
        </button>
      </form>
    </dialog>
  )
}

function openResetDialog(dialog: HTMLDialogElement) {
  if (dialog.open) return
  if (typeof dialog.showModal !== 'function') {
    dialog.setAttribute('open', '')
    return
  }
  try {
    dialog.showModal()
  } catch {
    dialog.setAttribute('open', '')
  }
}

function closeResetDialog(dialog: HTMLDialogElement) {
  if (!dialog.open) return
  if (typeof dialog.close === 'function') {
    dialog.close()
    return
  }
  dialog.removeAttribute('open')
}
