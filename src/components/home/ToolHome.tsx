import { ArrowUpRight } from 'lucide-react'
import { toolListings } from '../../domain/tools/catalog'
import { NavigationLink } from '../navigation/NavigationLink'
import './ToolHome.css'

export function ToolHome() {
  return (
    <main className="tool-home">
      <header className="home-heading">
        <h1>
          <img src="/favicon.svg" alt="" width="36" height="36" />
          Lint Forge
        </h1>
        <p>Review lint rules. Shape your config.</p>
      </header>
      <section aria-labelledby="tools-heading">
        <h2 id="tools-heading">Choose your linter</h2>
        <p>
          Start with an existing config or build one rule by rule. Each tool keeps its own progress.
        </p>
        <div className="tool-list">
          {toolListings.map((tool) => (
            <NavigationLink
              className={`tool-link tool-${tool.id}`}
              href={`/${tool.id}`}
              key={tool.id}
              aria-label={`Configure ${tool.name}`}
            >
              <div>
                <h3>{tool.name}</h3>
                <p>{tool.description}</p>
              </div>
              <code>{tool.output}</code>
              <ArrowUpRight aria-hidden="true" size={26} />
            </NavigationLink>
          ))}
        </div>
      </section>
      <p className="home-note">
        Your configs and decisions stay in this browser. Built for desktop.
      </p>
    </main>
  )
}
