export type RuleSeverity = 'error' | 'info' | 'warn'

export type RuleDecision = RuleSeverity | 'off'

export type BiomeRule = {
  group: string
  name: string
  title: string
  summary: string
  url: string
  domains: RuleDomain[]
}

export type RuleCategory = 'JavaScript' | 'CSS' | 'JSON' | 'GraphQL' | 'HTML/ARIA' | 'General'

/** Biome rule domains, mirroring the `linter.domains` keys of the installed schema. */
export type RuleDomain =
  | 'drizzle'
  | 'next'
  | 'playwright'
  | 'project'
  | 'qwik'
  | 'react'
  | 'reactNative'
  | 'solid'
  | 'tailwind'
  | 'test'
  | 'turborepo'
  | 'types'
  | 'vue'

export type RuleFilter = RuleCategory | RuleDomain

export type DecisionSoundPack =
  | 'arcade'
  | 'cinematic'
  | 'dreamy'
  | 'glass'
  | 'mechanical'
  | 'minimal'
  | 'organic'
  | 'rubber'
  | 'scifi'
  | 'soft'
  | 'studio'
  | 'zen'

export type ReviewAudioSettings = {
  enabled: boolean
  pack: DecisionSoundPack
}

export type RuleChoice = {
  ruleKey: string
  decision: RuleDecision
}

export type BiomeConfig = {
  $schema?: string
  linter?: {
    rules?: Record<string, unknown>
  }
  [key: string]: unknown
}

export type ReviewSnapshot = {
  baseConfigText: string
  choices: RuleChoice[]
  currentIndex: number
  panels?: {
    inputVisible: boolean
    outputVisible: boolean
  }
  filters?: {
    selectedCategories: RuleCategory[]
    selectedDomains?: RuleDomain[]
  }
  audio?: ReviewAudioSettings
}
