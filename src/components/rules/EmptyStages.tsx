import { AlertTriangle, ShieldCheck } from 'lucide-react'

export function NoCategoriesStage() {
  return (
    <section className="finished-stage">
      <AlertTriangle size={44} aria-hidden="true" />
      <h2>No categories selected.</h2>
      <p>Select at least one category to continue reviewing rules.</p>
    </section>
  )
}

export function FinishedStage() {
  return (
    <section className="finished-stage">
      <ShieldCheck size={44} aria-hidden="true" />
      <h2>All rules reviewed.</h2>
      <p>Generated config is ready in the right panel.</p>
    </section>
  )
}
