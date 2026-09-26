import type { BiomeConfig, BiomeRule, RuleCategory, RuleChoice, RuleDecision } from '../types'

export type ToolId = 'biome' | 'eslint' | 'ruff'

/** Tool-specific contracts used by the shared review workflow. */
export type ReviewTool = {
  id: ToolId
  name: string
  description: string
  version: string
  rules: BiomeRule[]
  categories: RuleCategory[]
  domainLabels: Record<string, string>
  decisions: RuleDecision[]
  decisionLabels?: Partial<Record<RuleDecision, string>>
  defaultInput: string
  importHint: string
  parse: (input: string) => BiomeConfig
  format: (config: BiomeConfig) => string
  configuredKeys: (config: BiomeConfig) => Set<string>
  generate: (config: BiomeConfig, choices: RuleChoice[]) => string
  filename: (config: BiomeConfig) => string
}
