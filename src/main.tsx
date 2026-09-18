import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// The review setup menu relies on the Popover API; older browsers get the
// polyfill only when native support is missing.
if (!('popover' in HTMLElement.prototype)) {
  await import('@oddbird/popover-polyfill')
}

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Invalid root element: null; expected element with id "root"')
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
