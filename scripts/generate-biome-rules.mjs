import { execFile } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import schema from '../node_modules/@biomejs/biome/configuration_schema.json' with { type: 'json' }

const ruleGroups = [
  'a11y',
  'complexity',
  'correctness',
  'nursery',
  'performance',
  'security',
  'style',
  'suspicious',
]

const biomeCliPath = fileURLToPath(
  new URL('../node_modules/@biomejs/biome/bin/biome', import.meta.url),
)
const ruleDomainReadConcurrency = 8
const explainMaxBuffer = 2 * 1024 * 1024

const execFileAsync = promisify(execFile)

const toTitle = (ruleName) =>
  ruleName.replace(/([A-Z])/g, ' $1').replace(/^./, (letter) => letter.toUpperCase())

const extractSummary = (description) => description.split('\n')[0].trim()

const extractUrl = (description) => {
  const match = description.match(/https:\/\/biomejs\.dev\/linter\/rules\/[\w-]+/)
  return match?.[0] ?? 'https://biomejs.dev/linter/rules/'
}

const ruleDefinitions = ruleGroups.flatMap((group) => {
  const groupDefinition = schema.$defs[group[0].toUpperCase() + group.slice(1)]
  return Object.entries(groupDefinition.properties)
    .filter(([ruleName]) => ruleName !== 'recommended')
    .map(([ruleName, ruleDefinition]) => ({
      group,
      name: ruleName,
      title: toTitle(ruleName),
      summary: extractSummary(ruleDefinition.description),
      url: extractUrl(ruleDefinition.description),
    }))
})

// Biome only exposes rule domains through `biome explain`, so the catalog
// reads them from the installed CLI instead of the JSON schema.
async function readRuleDomains(ruleName) {
  const { stdout } = await execFileAsync(process.execPath, [biomeCliPath, 'explain', ruleName], {
    maxBuffer: explainMaxBuffer,
  })
  return parseRuleDomains(stdout)
}

function parseRuleDomains(explainOutput) {
  const lines = explainOutput.split('\n')
  const domainsHeaderIndex = lines.indexOf('Domains')
  if (domainsHeaderIndex === -1) return []

  const domains = []
  for (const line of lines.slice(domainsHeaderIndex + 1)) {
    if (line.startsWith('- Name: ')) {
      domains.push(line.slice('- Name: '.length).trim())
      continue
    }
    if (line.trim() !== '') break
  }
  return domains.sort()
}

async function readAllRuleDomains(definitions) {
  const domainsByIndex = new Array(definitions.length)
  let nextIndex = 0

  const readNextRule = async () => {
    while (nextIndex < definitions.length) {
      const index = nextIndex
      nextIndex += 1
      domainsByIndex[index] = await readRuleDomains(definitions[index].name)
    }
  }

  await Promise.all(Array.from({ length: ruleDomainReadConcurrency }, () => readNextRule()))
  return domainsByIndex
}

const ruleDomains = await readAllRuleDomains(ruleDefinitions)
const ruleEntries = ruleDefinitions.map((rule, index) => ({
  ...rule,
  domains: ruleDomains[index],
}))

const source = `import type { BiomeRule } from './types'\n\nexport const biomeRules: BiomeRule[] = ${JSON.stringify(
  ruleEntries,
  null,
  2,
)}\n`

writeFileSync(new URL('../src/domain/biomeRules.ts', import.meta.url), source)
