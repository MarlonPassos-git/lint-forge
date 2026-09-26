export const toolListings = [
  {
    id: 'biome',
    name: 'Biome',
    description: 'JavaScript, CSS, JSON, GraphQL and HTML. Review language and framework rules.',
    output: 'biome.json',
  },
  {
    id: 'eslint',
    name: 'ESLint',
    description: 'JavaScript and TypeScript. Includes ESLint core, TypeScript and React Hooks.',
    output: 'eslint.config.mjs',
  },
  {
    id: 'ruff',
    name: 'Ruff',
    description: 'Python. Review stable rules from Pyflakes, pycodestyle, isort, flake8 and more.',
    output: 'ruff.toml / pyproject.toml',
  },
] as const
