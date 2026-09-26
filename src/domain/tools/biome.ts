import { biomeRules } from '../biomeRules'
import {
  buildBiomeConfig,
  extractConfiguredRuleKeys,
  formatBiomeConfig,
  parseBiomeConfig,
} from '../configuration'
import { ruleCategories } from '../ruleCategories'
import { availableRuleDomains, ruleDomainLabels } from '../ruleFilters'
import type { ReviewTool } from './types'

export const biomeTool: ReviewTool = {
  id: 'biome',
  name: 'Biome',
  description: 'JavaScript, CSS, JSON and more. Language and framework rules in one place.',
  version: '2.4.16',
  rules: biomeRules,
  categories: ruleCategories,
  domainLabels: Object.fromEntries(
    availableRuleDomains.map((domain) => [domain, ruleDomainLabels[domain]]),
  ),
  decisions: ['off', 'info', 'warn', 'error'],
  defaultInput: '{\n  "$schema": "https://biomejs.dev/schemas/2.4.16/schema.json"\n}\n',
  importHint: 'Paste biome.json. Only explicitly configured rules are skipped.',
  parse: parseBiomeConfig,
  format: formatBiomeConfig,
  configuredKeys: extractConfiguredRuleKeys,
  generate: (config, choices) => formatBiomeConfig(buildBiomeConfig(config, choices)),
  filename: () => 'biome.json',
}
