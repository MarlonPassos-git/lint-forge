import { biomeRules } from '../biomeRules'
import {
  buildBiomeConfig,
  extractConfiguredRuleKeys,
  formatBiomeConfig,
  parseBiomeConfig,
} from '../configuration'
import { ruleCategories } from '../ruleCategories'
import { availableRuleDomains, ruleDomainLabels } from '../ruleFilters'
import type { ReviewDomainGroup, ReviewTool } from './types'

const biomeDomainGroups = [
  {
    label: 'Frameworks',
    summary: 'React, Next.js, Vue, Solid, Qwik, and React Native rules.',
    domains: ['react', 'next', 'vue', 'solid', 'qwik', 'reactNative'],
  },
  {
    label: 'Testing',
    summary: 'Test-file and Playwright rules.',
    domains: ['test', 'playwright'],
  },
  {
    label: 'Tooling',
    summary: 'Type-aware, project structure, monorepo, ORM, and CSS framework rules.',
    domains: ['types', 'project', 'drizzle', 'turborepo', 'tailwind'],
  },
] satisfies ReviewDomainGroup[]

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
  domainSectionLabel: 'Frameworks & ecosystems',
  // Only domains present in the catalog are offered, so absent ecosystems stay hidden.
  domainGroups: biomeDomainGroups.map((group) => ({
    ...group,
    domains: group.domains.filter((domain) => availableRuleDomains.includes(domain)),
  })),
  decisions: ['off', 'info', 'warn', 'error'],
  defaultInput: '{\n  "$schema": "https://biomejs.dev/schemas/2.4.16/schema.json"\n}\n',
  importHint: 'Paste biome.json. Only explicitly configured rules are skipped.',
  parse: parseBiomeConfig,
  format: formatBiomeConfig,
  configuredKeys: extractConfiguredRuleKeys,
  generate: (config, choices) => formatBiomeConfig(buildBiomeConfig(config, choices)),
  filename: () => 'biome.json',
}
