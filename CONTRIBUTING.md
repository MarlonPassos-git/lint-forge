<div align="center">
  <img src="public/favicon.svg" alt="Lint Forge icon" width="72" height="72" />

  <h1>Contributing to Lint Forge</h1>

  <p>Keep the review workflow fast, predictable, and easy to validate.</p>
</div>

## Getting Started

### Runtime

- Node: `>=24.0.0`
- pnpm: `>=10.0.0`
- Package manager: pinned by `packageManager` in `package.json`

### Installation

```powershell
corepack enable
pnpm install
```

## Development

Start the local app:

```powershell
pnpm dev -- --host 127.0.0.1
```

Open:

```text
http://127.0.0.1:5173
```

Run local development checks:

```powershell
pnpm lint
pnpm lint:fix
pnpm test
pnpm type-check
```

## Tests

- Use `*.unit.spec.ts` for unit tests.
- Use `*.integration.spec.ts` for integration tests.
- Use `*.e2e.spec.ts` for end-to-end tests.
- Prefer colocated `__tests__/` folders beside the code under test.
- Keep tests fast, independent, repeatable, self-validating, and timely.
- Mock external I/O with named fake classes, not inline stubs.

Run the full local verification set before opening a pull request:

```powershell
pnpm lint
pnpm test
pnpm build
pnpm test:e2e
```

## Rule Catalogs

Catalogs are committed generated files. Normal builds and CI do not need Ruff or network access to regenerate them. Biome reads its installed schema and CLI; ESLint reads metadata from the installed core, TypeScript and React Hooks packages; Ruff reads the official CLI's JSON output. Ruff generation requires [uv](https://docs.astral.sh/uv/) and uses a version pinned in its generator.

```powershell
pnpm catalog:biome
pnpm catalog:eslint
pnpm catalog:ruff
# Or regenerate all three:
pnpm catalog:all
```

Run the matching generator after changing a source package or Ruff version, then review the corresponding `src/domain/*Rules.ts` diff. Deprecated ESLint and preview/deprecated/removed Ruff rules are excluded.

Tool adapters in `src/domain/tools` own parsing, explicit-rule extraction, generation, filenames and filters. The shared `ReviewApp` owns the workbench; `App` owns `/`, `/biome`, `/eslint` and `/ruff`. Each tool is loaded on demand. Storage keys are independent; Biome retains `biome-rule-swipe:v1` for existing users.

`pnpm build` creates real HTML entrypoints for every tool route through `scripts/build-tool-pages.mjs`, so deep links and refresh work on GitHub Pages. Keep Vite's root-relative asset base for the custom domain. The existing PageSpeed check targets the home by default; use `PAGESPEED_URL` to check a tool route.

Configuration references: [ESLint flat config](https://eslint.org/docs/latest/use/configure/configuration-files), [ESLint severities](https://eslint.org/docs/latest/use/configure/rules), [Ruff selection precedence](https://docs.astral.sh/ruff/linter/).

## Pull Requests

- Keep changes focused on one concern.
- Update tests and docs with behavior changes.
- Include screenshots or recordings for visible UI changes.
- Confirm destructive actions still require a modal confirmation.
- Do not crop or translate the cross-origin Biome documentation iframe.

## Commit Style

Use Conventional Commits:

```text
feat(scope): add new behavior
fix(scope): correct broken behavior
docs(scope): update documentation
```
