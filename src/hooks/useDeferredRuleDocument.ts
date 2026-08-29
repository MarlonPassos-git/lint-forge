import { useEffect, useState } from 'react'

export function useDeferredRuleDocument(ruleUrl: string) {
  const [documentSource, setDocumentSource] = useState<string>()

  useEffect(() => {
    setDocumentSource(undefined)
    return revealRuleDocumentAfterContentPaint(() => {
      performance.mark('lint-forge-rule-document-reveal')
      setDocumentSource(ruleUrl)
    })
  }, [ruleUrl])

  return documentSource
}

function revealRuleDocumentAfterContentPaint(revealDocument: () => void) {
  const loadSchedule = { animationFrame: 0, idleCallback: 0, timer: 0 }
  const scheduleReveal = () => scheduleRuleDocumentReveal(revealDocument, loadSchedule)
  if (document.readyState === 'complete') scheduleReveal()
  else window.addEventListener('load', scheduleReveal, { once: true })
  return () => {
    window.removeEventListener('load', scheduleReveal)
    cancelRuleDocumentReveal(loadSchedule)
  }
}

function scheduleRuleDocumentReveal(
  revealDocument: () => void,
  loadSchedule: { animationFrame: number; idleCallback: number; timer: number },
) {
  loadSchedule.animationFrame = window.requestAnimationFrame(() => {
    const revealAfterDelay = () => {
      loadSchedule.timer = window.setTimeout(revealDocument, 100)
    }
    const requestIdle = Reflect.get(window, 'requestIdleCallback') as
      | Window['requestIdleCallback']
      | undefined
    if (requestIdle) {
      loadSchedule.idleCallback = requestIdle.call(window, revealAfterDelay, { timeout: 500 })
      return
    }
    revealAfterDelay()
  })
}

function cancelRuleDocumentReveal(loadSchedule: {
  animationFrame: number
  idleCallback: number
  timer: number
}) {
  window.cancelAnimationFrame(loadSchedule.animationFrame)
  window.clearTimeout(loadSchedule.timer)
  const cancelIdle = Reflect.get(window, 'cancelIdleCallback') as
    | Window['cancelIdleCallback']
    | undefined
  cancelIdle?.call(window, loadSchedule.idleCallback)
}
