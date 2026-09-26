import { type AnchorHTMLAttributes, useSyncExternalStore } from 'react'

const routeEvent = 'lint-forge:navigate'

function subscribeToNavigation(notify: () => void) {
  window.addEventListener('popstate', notify)
  window.addEventListener(routeEvent, notify)
  return () => {
    window.removeEventListener('popstate', notify)
    window.removeEventListener(routeEvent, notify)
  }
}

export function useRoutePath() {
  return useSyncExternalStore(
    subscribeToNavigation,
    () => window.location.pathname.replace(/\/$/, '') || '/',
  )
}

export function NavigationLink(props: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  return (
    <a
      {...props}
      href={props.href}
      onClick={(event) => {
        if (
          event.button !== 0 ||
          event.ctrlKey ||
          event.metaKey ||
          event.shiftKey ||
          event.altKey ||
          props.target
        )
          return
        event.preventDefault()
        window.history.pushState(null, '', props.href)
        window.dispatchEvent(new Event(routeEvent))
      }}
    />
  )
}
