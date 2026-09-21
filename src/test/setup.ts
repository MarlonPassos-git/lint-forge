import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// jsdom does not implement the Popover API. Load the same conditional polyfill
// the app loads for browsers without native popover support.
if (!('popover' in HTMLElement.prototype)) {
  await import('@oddbird/popover-polyfill')
}

// jsdom keeps every [popover] at display: none in its default stylesheet, even
// after the polyfill opens it, so tests need the open state to win.
const popoverVisibilityStyle = document.createElement('style')
popoverVisibilityStyle.textContent = '[popover].\\:popover-open { display: block !important; }'
document.head.append(popoverVisibilityStyle)

afterEach(() => {
  cleanup()
})
