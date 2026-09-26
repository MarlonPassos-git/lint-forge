export type RuleSeverity = 'error' | 'info' | 'warn'

export type RuleDecision = RuleSeverity | 'off'

export type BiomeRule = {
  group: string
  name: string
  title: string
  summary: string
  url: string
  domains: RuleDomain[]
  categories?: RuleCategory[]
  requiresTypeChecking?: boolean
}

export type RuleCategory =
  | 'JavaScript'
  | 'TypeScript'
  | 'Python'
  | 'CSS'
  | 'JSON'
  | 'GraphQL'
  | 'HTML/ARIA'
  | 'General'

/** Domain identifiers come from each tool's generated catalog. */
export type RuleDomain = string

export type RuleFilter = RuleCategory | RuleDomain

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
}
