import { EyeOff, FileText } from 'lucide-react'
import { useReviewTool } from '../review/ReviewToolContext'

type ImportPanelProps = {
  errorText: string
  importText: string
  onChange: (value: string) => void
  onHide: () => void
  onStart: () => void
}

export function ImportPanel(props: ImportPanelProps) {
  const tool = useReviewTool()
  return (
    <div className="control-panel">
      <div className="panel-title-row">
        <div>
          <FileText size={22} />
          <h2>
            <label htmlFor="biome-config-input">Base file</label>
          </h2>
        </div>
        <HidePanelButton label="Hide base file" onHide={props.onHide} />
      </div>
      <textarea
        aria-describedby="import-hint"
        id="biome-config-input"
        value={props.importText}
        onChange={(event) => props.onChange(event.target.value)}
        spellCheck={false}
      />
      <p id="import-hint" className="import-hint">
        {tool.importHint}
      </p>
      {props.errorText ? <ImportError message={props.errorText} /> : null}
      <button type="button" className="primary-button" onClick={props.onStart}>
        Start from this config
      </button>
    </div>
  )
}

function HidePanelButton({ label, onHide }: { label: string; onHide: () => void }) {
  return (
    <button type="button" className="small-icon-button" onClick={onHide} aria-label={label}>
      <EyeOff size={17} />
    </button>
  )
}

function ImportError({ message }: { message: string }) {
  return (
    <p className="error-text" role="alert">
      {message}
    </p>
  )
}
