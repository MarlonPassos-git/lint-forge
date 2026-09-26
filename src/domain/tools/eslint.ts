import { eslintDomainLabels, eslintRules, eslintVersions } from '../eslintRules'
import type { BiomeConfig, RuleChoice } from '../types'
import { isConfigRecord } from './configRecords'
import { explicitEslintRules, inspectEslintSource } from './eslintSource'
import { validateEslintBlocks } from './eslintValidation'
import type { ReviewTool } from './types'

export const eslintTool: ReviewTool = {
  id: 'eslint',
  name: 'ESLint',
  description: 'JavaScript and TypeScript, with ESLint core, TypeScript and React Hooks rules.',
  version: eslintVersions.eslint,
  rules: eslintRules,
  categories: ['JavaScript', 'TypeScript'],
  domainLabels: eslintDomainLabels,
  decisions: ['off', 'warn', 'error'],
  defaultInput: 'export default [\n  { rules: {} },\n]\n',
  importHint:
    'Paste eslint.config.js or a JSON config object. Imports and presets are preserved, never executed; only literal rule keys are skipped. Install the packages imported by the generated file.',
  parse: parseEslintConfig,
  format: (config) => String(config.source),
  configuredKeys: (config) => explicitEslintRules(String(config.source)),
  generate: generateEslintConfig,
  filename: () => 'eslint.config.mjs',
}

export function parseEslintConfig(input: string): BiomeConfig {
  const trimmed = input.trim() || 'export default []'
  let source = trimmed
  try {
    const parsed: unknown = JSON.parse(trimmed)
    if (!isConfigRecord(parsed) && !Array.isArray(parsed)) throw new Error('Invalid ESLint root')
    source = `export default ${JSON.stringify(Array.isArray(parsed) ? parsed : [parsed], null, 2)}\n`
  } catch {
    // JavaScript configs are inspected as syntax, never evaluated.
  }
  validateEslintBlocks(inspectEslintSource(source).blocks)
  return { source: `${source.trim()}\n` }
}

export function generateEslintConfig(config: BiomeConfig, choices: RuleChoice[]): string {
  const source = String(config.source)
  if (!choices.length) return source
  if (choices.some((choice) => choice.decision === 'info'))
    throw new Error('Invalid ESLint severity: info; expected off, warn, or error')
  const { declaration } = inspectEslintSource(source)
  const original = source.slice(declaration.start, declaration.end)
  const additions = buildEslintAdditions(choices, source)
  const expression = `[\n  ...[${original}].flat(),\n${additions.blocks.join(',\n')}\n]`
  return `${additions.imports.join('\n')}\n${source.slice(0, declaration.start)}${expression}${source.slice(declaration.end)}`.trimStart()
}

function buildEslintAdditions(choices: RuleChoice[], source: string) {
  const imports: string[] = []
  const blocks: string[] = []
  const coreChoices = choices.filter((choice) => choice.ruleKey.startsWith('eslint/'))
  if (coreChoices.length)
    blocks.push(
      JSON.stringify(
        {
          files: ['**/*.{js,jsx,mjs,cjs}'],
          languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
          rules: eslintChoiceRules(coreChoices),
        },
        null,
        2,
      ),
    )
  for (const [group, packageName] of [
    ['@typescript-eslint', '@typescript-eslint/eslint-plugin'],
    ['react-hooks', 'eslint-plugin-react-hooks'],
  ]) {
    const pluginChoices = choices.filter((choice) => choice.ruleKey.startsWith(`${group}/`))
    if (!pluginChoices.length) continue
    const identifier = uniquePluginIdentifier(group, source)
    imports.push(`import ${identifier} from '${packageName}'`)
    blocks.push(pluginConfigBlock(group, identifier, pluginChoices, imports))
  }
  return { imports, blocks }
}

function uniquePluginIdentifier(group: string, source: string) {
  let identifier = `lintForge_${group.replace(/[^a-z]/g, '_')}`
  while (source.includes(identifier)) identifier += '_'
  return identifier
}

function pluginConfigBlock(
  group: string,
  identifier: string,
  choices: RuleChoice[],
  imports: string[],
) {
  const rules = JSON.stringify(eslintChoiceRules(choices), null, 2)
  const plugin = `plugins: { '${group}': ${identifier} }`
  imports.push(`import ${identifier}_parser from '@typescript-eslint/parser'`)
  const files =
    group === '@typescript-eslint'
      ? '**/*.{ts,tsx,mts,cts}'
      : '**/*.{js,jsx,mjs,cjs,ts,tsx,mts,cts}'
  const needsTypes = choices.some(
    (choice) =>
      choice.decision !== 'off' &&
      eslintRules.some(
        (rule) => `${rule.group}/${rule.name}` === choice.ruleKey && rule.requiresTypeChecking,
      ),
  )
  const parserOptions = JSON.stringify({
    ecmaFeatures: { jsx: true },
    ...(needsTypes ? { projectService: true } : {}),
  })
  return `{ files: ['${files}'], ${plugin}, languageOptions: { parser: ${identifier}_parser, parserOptions: ${parserOptions} }, rules: ${rules} }`
}

function eslintChoiceRules(choices: RuleChoice[]) {
  return Object.fromEntries(
    choices.map((choice) => [choice.ruleKey.replace(/^eslint\//, ''), choice.decision]),
  )
}
