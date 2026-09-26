import { EyeOff } from 'lucide-react'
import { memo } from 'react'
import type { RuleChoice } from '../../domain/types'

type OutputPanelProps = {
  filename?: string
  choices: RuleChoice[]
  onHide: () => void
  outputText: string
}

export const OutputPanel = memo(function OutputPanel(props: OutputPanelProps) {
  return (
    <div className="output-panel">
      <div className="panel-title-row">
        <h2>Generated {props.filename ?? 'biome.json'}</h2>
        <button
          type="button"
          className="small-icon-button"
          onClick={props.onHide}
          aria-label="Hide output"
        >
          <EyeOff size={17} />
        </button>
      </div>
      <p>{props.choices.length} decisions saved locally.</p>
      <textarea
        aria-label={`Generated ${props.filename ?? 'biome.json'} code`}
        className="output-code"
        readOnly
        spellCheck={false}
        value={props.outputText}
      />
    </div>
  )
})
