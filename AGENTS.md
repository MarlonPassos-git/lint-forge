# AGENTS.md

## Project

Desktop-only React SPA for reviewing Biome linter rules and producing a custom `biome.json`.

Core user flow:
- User can paste an existing Biome config in the base file panel.
- Explicitly configured rules in that config are skipped.
- User reviews remaining rules as a deck.
- Three rule documentation iframes are kept mounted at a time.
- Decisions are `off`, `info`, `warn`, or `error`.
- Generated `biome.json` is shown in the output panel.
- Progress counts imported explicit rules plus decisions made in the app.
- A review setup popover beside the reset button holds language/tool filters and sound settings.
- Panel visibility, filters, sound settings, imported config, current progress, and decisions persist in `localStorage`.

## Stack

- React 19
- Vite 8
- TypeScript 6
- Vitest + Testing Library
- Playwright for E2E tests
- Biome for linting and formatting
- `@biomejs/biome` is used as the source for the official configuration schema.
- `uisfx` provides semantic decision sound effects.
- `@oddbird/popover-polyfill` covers the Popover API in older browsers.
- `lucide-react` provides icons.

## Commands

- Install: `pnpm install`
- Run dev server: `pnpm dev -- --host 127.0.0.1`
- Test: `pnpm test`
- E2E: `pnpm test:e2e`
- Lint: `pnpm lint`
- Format/fix: `pnpm lint:fix`
- Build: `pnpm build`
- Regenerate rule catalog: `node scripts/generate-biome-rules.mjs`

Before finishing behavior changes, run:

```powershell
pnpm test
pnpm lint
pnpm build
pnpm test:e2e
```

## Important Files

- `src/App.tsx`: main SPA UI shell that wires the review hook, header, side panel, and workspace.
- `src/App.css`: shared layout, control, and workbench styling.
- `src/domain/biomeRules.ts`: generated rule catalog. Do not edit by hand unless generation is intentionally bypassed.
- `src/domain/configuration.ts`: Biome config parsing, rule key extraction, output generation, reviewable-rule filtering.
- `src/domain/ruleCategories.ts`: local language classifier for JavaScript, CSS, JSON, GraphQL, HTML/ARIA, and General.
- `src/domain/ruleFilters.ts`: language/tool filter metadata, catalog tool domains, and deck selection rules.
- `src/domain/reviewState.ts`: progress/window/choice helpers.
- `src/audio/decisionSoundPlayer.ts`: wraps `uisfx` behind the project-owned decision sound player.
- `src/components/setup/ReviewSetupMenu.tsx`: header-anchored popover with filters, sound settings, and previews.
- `src/main.tsx`: conditionally loads the popover polyfill before rendering.
- `src/storage/localReviewStore.ts`: `localStorage` persistence.
- `scripts/generate-biome-rules.mjs`: builds `biomeRules.ts` from `node_modules/@biomejs/biome/configuration_schema.json` plus `biome explain` rule domains.
- `DESIGN.md`: visual identity tokens and Gumroad-inspired neo-brutalist design rules for UI work.
- `biome.json`: Biome lint/format configuration.
- `.github/workflows/ci.yml`: GitHub CI with pnpm, Biome, Vitest, build, and Playwright E2E.

## Design System

- Before changing layout, styling, component visuals, interaction surfaces, or design tokens, read `DESIGN.md` and follow its logic.
- Preserve the Gumroad-inspired neo-brutalist devtool direction: hard black borders, offset shadows, warm paper surfaces, dense desktop workbench layout, and stable semantic decision colors.
- If `DESIGN.md` changes, validate it with:

```powershell
npx -p @google/design.md designmd lint DESIGN.md
```

## Biome Rule Catalog

Rules are generated from the installed Biome package schema, currently `@biomejs/biome 2.4.16`.

Tool domains (`react`, `next`, `vue`, `playwright`, and so on) are not part of the JSON schema. The generator reads them from the official CLI with `biome explain <ruleName>` and stores them on each rule as `domains`.

Rule docs URLs come from schema descriptions and point to:

```text
https://biomejs.dev/linter/rules/{rule-slug}
```

Do not crawler-scrape the docs unless schema generation stops being viable. Prefer the official schema and CLI because they are stable, versioned with the package, and include rule descriptions, URLs, and domains.

## App Behavior

- Imported explicit rules are treated as complete and skipped.
- `recommended: true` is not expanded into completed rules. Only explicit rules count as configured.
- Language and tool filters live in a review setup popover anchored to the header button beside reset, and affect the review deck and progress denominator.
- A rule enters the deck when one of its languages or one of its tool domains is selected.
- Already-decided rules do not reappear when filters change.
- The setup popover uses the native Popover API: light dismiss and Escape close it, focus moves into the panel on open, and focus returns to the trigger on close. `@oddbird/popover-polyfill` is loaded only when `popover` is missing from `HTMLElement.prototype`.
- Reset is destructive and must open a confirmation modal with `Cancel` and `Reset everything`.
- Do not require typing text for reset confirmation.
- The iframe must render normally. Do not crop, translate, or otherwise mutate the cross-origin Biome docs iframe; prior crop attempts made navigation feel broken.
- Browser security prevents editing DOM inside the Biome docs iframe because it is cross-origin.
- Decision buttons float over the bottom of the card to preserve iframe height.
- `Error` button should not be green. Current semantics: Off neutral, Info blue-purple, Warn amber, Error red.
- Decision sounds use the Zen `uisfx` pack with semantic cues: `off` → `toggle-off`, `info` → `info`, `warn` → `warning`, `error` → `blocked` (the `error` cue is too close to `warning` in Zen). Audio failures must never block a review decision.
- The setup menu controls sound on/off and plays per-decision previews.

## Persistence

Storage key:

```text
biome-rule-swipe:v1
```

Snapshot shape includes:
- `baseConfigText`
- `choices`
- `currentIndex`
- `panels.inputVisible`
- `panels.outputVisible`
- `filters.selectedCategories`
- `filters.selectedDomains`
- `audio.enabled`

Handle corrupt stored JSON by clearing the key and returning `null`. Legacy snapshots without `selectedDomains` fall back to all tool domains selected, snapshots without `audio` default to sounds enabled, and the retired `audio.pack` field is ignored.

## Code Style

- Functions: 4-20 lines. Split if longer.
- One thing per function, one responsibility per module.
- Names must be specific and unique. Avoid `data`, `handler`, `Manager`.
- Prefer names that return fewer than 5 grep hits.
- No code duplication. Extract shared logic into a function/module.
- Prefer early returns over nested ifs.
- Maximum 2 levels of indentation.
- Exception messages must include offending value and expected shape.
- Follow lint tools and style guides.

## Comments

- Keep existing comments when refactoring.
- Write why, not what.
- Public functions need docstrings only when they become a public API surface; include intent and one usage example.
- Reference issue numbers or commit SHAs when code exists because of a specific bug or upstream constraint.

## Tests

- Every new function gets a test.
- Bug fixes get regression tests.
- Any feature or adjustment must create/update tests unless change is only `*.md`, `*.json`, or under `scripts/**/*`.
- Use named fake classes for external I/O mocks, not inline stubs.
- Tests live in `__tests__` folders.
- Test files use `{file_name}.{unit|integration|e2e}.spec.{extension}`.
- Tests should be fast, independent, repeatable, self-validating, timely.

## Dependencies

- Inject dependencies through constructor/parameter when practical.
- Wrap third-party libraries behind project-owned interfaces for shared/domain logic.
- UI-only libraries such as `lucide-react` may be imported directly in components.

## Structure

- Follow Vite/React conventions.
- Prefer small focused modules over large god files.
- Keep domain helpers under `src/domain`.
- Keep audio wrappers under `src/audio`.
- Keep persistence under `src/storage`.
- Keep test setup under `src/test`.

## Formatting

- Use project tooling.
- Do not discuss style beyond lint/test/build output.
- Biome is the formatter and linter. Do not reintroduce ESLint unless explicitly requested.

## Logging

- Structured JSON for debugging/observability logs.
- Plain text only for user-facing CLI output.

## Browser QA

When changing layout or interaction, verify in the in-app browser at:

```text
http://127.0.0.1:5173
```

Useful checks:
- App loads without console errors.
- There are 3 `iframe.docs-frame` elements during active review.
- Reset modal appears before destructive reset.
- Side panel hide/show state survives reload.
- The review setup menu opens beside reset, closes on Escape and outside click, and returns focus to its trigger.
- Language and tool filters survive reload and update progress.
- Filter chips and All/None controls show hover and focus lift states.
- Decision sound settings survive reload; a preview creates a running `AudioContext` and logs no errors.
- No unwanted horizontal overflow.

## Package Manager

Use pnpm only.

- Do not create `package-lock.json` or `yarn.lock`.
- Keep `packageManager` pinned in `package.json`.
- CI uses `pnpm install --frozen-lockfile`.

## Git

Use `rtk git ...` for git commands when committing from Codex.

Commit messages use Conventional Commits:
- `feat`
- `fix`
- `test`
- `build`
- `docs`
- `refactor`
- `chore`
