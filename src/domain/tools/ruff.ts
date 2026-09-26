import { parse, stringify, type TomlTable } from 'smol-toml'
import { ruffDomainLabels, ruffRules, ruffVersion } from '../ruffRules'
import type { BiomeConfig, RuleChoice } from '../types'
import { configRecord, configStringList, isConfigRecord } from './configRecords'
import type { ReviewTool } from './types'

const selectionFields = ['select', 'extend-select', 'ignore', 'extend-ignore'] as const

export const ruffTool: ReviewTool = {
  id: 'ruff',
  name: 'Ruff',
  description: 'Python lint rules from Pyflakes, pycodestyle, isort, flake8 and more.',
  version: ruffVersion,
  rules: ruffRules,
  categories: ['Python'],
  domainLabels: ruffDomainLabels,
  decisions: ['off', 'error'],
  decisionLabels: { off: 'Disable', error: 'Enable' },
  defaultInput: '[lint]\nselect = []\nignore = []\n',
  importHint:
    'Paste ruff.toml or pyproject.toml. Review stable rules only. Exact codes count as configured; prefixes stay in your config. Ruff uses enabled/disabled rules, without per-rule severity.',
  parse: parseRuffConfig,
  format: (config) => stringify(config as TomlTable),
  configuredKeys: configuredRuffKeys,
  generate: generateRuffConfig,
  filename: (config) => (isPyprojectConfig(config) ? 'pyproject.toml' : 'ruff.toml'),
}

export function parseRuffConfig(input: string): BiomeConfig {
  let config: BiomeConfig
  try {
    config = parse(input)
  } catch {
    throw new Error('Invalid Ruff config syntax; expected TOML from ruff.toml or pyproject.toml')
  }
  const settings = ruffSettings(config)
  const lint = configRecord(settings.lint, 'lint')
  for (const field of selectionFields) {
    configStringList(lint[field], `lint.${field}`)
    configStringList(settings[field], field)
  }
  return config
}

function isPyprojectConfig(config: BiomeConfig) {
  return (
    Object.hasOwn(config, 'tool') ||
    Object.hasOwn(config, 'project') ||
    Object.hasOwn(config, 'build-system')
  )
}

function ruffSettings(config: BiomeConfig) {
  if (!isPyprojectConfig(config)) return config
  const tool = configRecord(config.tool, 'tool')
  return configRecord(tool.ruff, 'tool.ruff')
}

export function configuredRuffKeys(config: BiomeConfig): Set<string> {
  const settings = ruffSettings(config)
  const lint = configRecord(settings.lint, 'lint')
  const codes = selectionFields.flatMap((field) =>
    configStringList(lint[field] ?? settings[field], `lint.${field}`),
  )
  return new Set(
    codes
      .filter((code) => ruffRules.some((rule) => rule.name === code))
      .map((code) => `ruff/${code}`),
  )
}

export function generateRuffConfig(config: BiomeConfig, choices: RuleChoice[]): string {
  if (choices.some((choice) => choice.decision !== 'off' && choice.decision !== 'error'))
    throw new Error('Invalid Ruff decision; expected off (disabled) or error (enabled)')
  const nextConfig = structuredClone(config)
  const settings = mutableRuffSettings(nextConfig)
  const lint = { ...configRecord(settings.lint, 'lint') }
  for (const field of selectionFields) {
    if (lint[field] === undefined && settings[field] !== undefined) lint[field] = settings[field]
    delete settings[field]
  }
  applyRuffChoices(lint, choices)
  settings.lint = lint
  return stringify(nextConfig as TomlTable)
}

function mutableRuffSettings(config: BiomeConfig): Record<string, unknown> {
  if (!isPyprojectConfig(config)) return config
  if (!isConfigRecord(config.tool)) config.tool = {}
  const tool = config.tool as Record<string, unknown>
  if (!isConfigRecord(tool.ruff)) tool.ruff = {}
  return tool.ruff as Record<string, unknown>
}

function applyRuffChoices(lint: Record<string, unknown>, choices: RuleChoice[]) {
  const enabled = choices
    .filter((choice) => choice.decision === 'error')
    .map((choice) => choice.ruleKey.slice(5))
  const disabled = choices
    .filter((choice) => choice.decision === 'off')
    .map((choice) => choice.ruleKey.slice(5))
  const decided = new Set([...enabled, ...disabled])
  for (const field of selectionFields) {
    if (lint[field] !== undefined)
      lint[field] = configStringList(lint[field], `lint.${field}`).filter(
        (code) => !decided.has(code),
      )
  }
  // Extend preserves an imported baseline, including Ruff's defaults and prefix selectors.
  if (enabled.length)
    lint['extend-select'] = [
      ...new Set([...configStringList(lint['extend-select'], 'lint.extend-select'), ...enabled]),
    ]
  if (disabled.length)
    lint.ignore = [...new Set([...configStringList(lint.ignore, 'lint.ignore'), ...disabled])]
}
