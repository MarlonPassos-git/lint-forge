import type { Property } from 'acorn'
import { eslintPropertyName } from './eslintSource'

const legacyFields = new Set([
  'env',
  'root',
  'ignorePatterns',
  'overrides',
  'parser',
  'parserOptions',
])
const severities = new Set<unknown>([0, 1, 2, 'off', 'warn', 'error'])

export function validateEslintBlocks(blocks: Property[][]) {
  for (const properties of blocks) {
    const legacy = properties.find((property) =>
      legacyFields.has(eslintPropertyName(property) ?? ''),
    )
    if (legacy)
      throw new Error(
        `Invalid ESLint field: ${eslintPropertyName(legacy)}; expected flat config fields (migrate .eslintrc first)`,
      )
    const plugins = properties.find((property) => eslintPropertyName(property) === 'plugins')
    if (plugins?.value.type === 'ArrayExpression')
      throw new Error('Invalid ESLint plugins: array; expected a flat config plugin object')
    const rules = properties.find((property) => eslintPropertyName(property) === 'rules')?.value
    if (rules?.type !== 'ObjectExpression') continue
    for (const rule of rules.properties) {
      if (rule.type === 'Property') validateLiteralSeverity(rule)
    }
  }
}

function validateLiteralSeverity(rule: Property) {
  const severity = rule.value.type === 'ArrayExpression' ? rule.value.elements[0] : rule.value
  if (severity?.type !== 'Literal') return
  if (severities.has(severity.value)) return
  throw new Error(
    `Invalid ESLint rules.${eslintPropertyName(rule)} severity: ${JSON.stringify(severity.value)}; expected off, warn, error, 0, 1, or 2`,
  )
}
