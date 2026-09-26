# Lint Forge

<div align="center">
  <img src="public/favicon.svg" alt="Lint Forge icon" width="96" height="96" />

  <p>Desktop React SPA for reviewing lint rules and building custom linter configs.</p>

  <p>
    <img alt="Version" src="https://img.shields.io/badge/version-0.0.0-111111" />
    <img alt="Tests" src="https://img.shields.io/badge/tests-Vitest%20%2B%20Playwright-111111" />
    <img alt="Quality" src="https://img.shields.io/badge/quality-Biome-111111" />
    <img alt="License" src="https://img.shields.io/badge/license-MIT-111111" />
  </p>
</div>

Lint Forge helps developers build custom Biome, ESLint and Ruff configurations. Choose a tool from the home, import an existing config, review unconfigured rules as a deck, and copy the generated file. Each tool keeps its own progress.

> Lint Forge is an independent project, unaffiliated with Biome, ESLint or Ruff.

## Features

- Review linter rules with a card/deck workflow.
- Open Biome at `/biome`, ESLint at `/eslint`, or Ruff at `/ruff`.
- Import `biome.json`, ESLint flat config JavaScript or JSON, and `ruff.toml` or `pyproject.toml`.
- Choose Biome severities (`Off`, `Info`, `Warn`, `Error`), ESLint severities (`Off`, `Warn`, `Error`), or Ruff `Enable`/`Disable`.
- Read rule documentation inside the deck or open the official page in another tab.
- Filter the review deck by language and tool domain, such as React, Next.js, Vue, and Playwright, from the review setup menu.
- Persist imported config, decisions, filters, progress, and panel visibility in `localStorage`.
- Generate `biome.json`, `eslint.config.mjs`, `ruff.toml` or `pyproject.toml` as decisions are made.

## Demo

- Live app: [lint-forge.marlonpassos.com.br](https://lint-forge.marlonpassos.com.br/)
- Source: [github.com/MarlonPassos-git/lint-forge](https://github.com/MarlonPassos-git/lint-forge)

## Getting Started

Open the public app and use the review flow:

1. Choose your linter and paste its configuration in the base file panel, or start with the provided empty config.
2. Start the review so explicitly configured rules are skipped.
3. Select languages and tools in Review setup, then decide each remaining rule.
4. Copy the generated file from the output panel.

ESLint supports core, TypeScript and React Hooks rules. Install the packages imported by the generated config in your project; type-aware rules also require a TypeScript project configuration. JavaScript imports and presets are preserved without executing them in the browser. Only literal rule keys are counted as configured; dynamic expressions and inherited presets are not expanded. JSON input must describe flat configuration objects rather than legacy `.eslintrc` fields.

Ruff includes stable rules from the pinned version. Exact imported rule codes are skipped; selectors such as `E`, `F` and `ALL` remain in the config without marking every matching rule reviewed. Existing Ruff settings and other `pyproject.toml` sections are retained; TOML formatting and comments are not preserved. Rule families can contain mutually exclusive conventions, so choose rules appropriate to your project.

To run the project locally, follow the [Contributing guide](CONTRIBUTING.md#getting-started).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for local setup, branch workflow, test expectations, and pull request guidelines.
