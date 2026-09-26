import { lazy, Suspense, useEffect } from 'react'
import './App.css'
import { ToolHome } from './components/home/ToolHome'
import { NavigationLink, useRoutePath } from './components/navigation/NavigationLink'
import { toolListings } from './domain/tools/catalog'
import type { ReviewTool, ToolId } from './domain/tools/types'

const toolLoaders = {
  biome: () => import('./domain/tools/biome').then((module) => module.biomeTool),
  eslint: () => import('./domain/tools/eslint').then((module) => module.eslintTool),
  ruff: () => import('./domain/tools/ruff').then((module) => module.ruffTool),
}

function lazyToolReview(loadTool: () => Promise<ReviewTool>) {
  return lazy(async () => {
    const [tool, { default: ReviewApp }, { ReviewToolContext }] = await Promise.all([
      loadTool(),
      import('./ReviewApp'),
      import('./components/review/ReviewToolContext'),
    ])
    return {
      default: () => (
        <ReviewToolContext value={tool}>
          <ReviewApp />
        </ReviewToolContext>
      ),
    }
  })
}

const toolPages = {
  biome: lazyToolReview(toolLoaders.biome),
  eslint: lazyToolReview(toolLoaders.eslint),
  ruff: lazyToolReview(toolLoaders.ruff),
}

function App() {
  const pathname = useRoutePath()
  const listing = toolListings.find((tool) => pathname === `/${tool.id}`)
  useEffect(() => {
    document.title = listing
      ? `${listing.name} Config Builder - Lint Forge`
      : 'Lint Forge - Linter Config Builder'
    document
      .querySelector('link[rel="canonical"]')
      ?.setAttribute(
        'href',
        `https://lint-forge.marlonpassos.com.br${pathname === '/' ? '/' : pathname}`,
      )
  }, [listing, pathname])
  if (pathname === '/') return <ToolHome />
  if (!listing)
    return (
      <main className="tool-home">
        <h1>Tool not found</h1>
        <NavigationLink href="/">All tools</NavigationLink>
      </main>
    )
  return (
    <Suspense
      fallback={
        <main className="tool-home" role="status">
          Loading {listing.name}…
        </main>
      }
    >
      <ToolRoute id={listing.id} key={listing.id} />
    </Suspense>
  )
}

function ToolRoute({ id }: { id: ToolId }) {
  const Page = toolPages[id]
  useEffect(() => {
    const heading = document.querySelector('h1')
    heading?.setAttribute('tabindex', '-1')
    heading?.focus()
  }, [])
  return <Page key={id} />
}

export default App
