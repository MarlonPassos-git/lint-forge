import { parse } from 'smol-toml'
import { describe, expect, it } from 'vitest'
import { eslintRules } from '../../eslintRules'
import { ruffRules } from '../../ruffRules'
import { eslintTool, generateEslintConfig, parseEslintConfig } from '../eslint'
import { explicitEslintRules, inspectEslintSource } from '../eslintSource'
import { configuredRuffKeys, generateRuffConfig, parseRuffConfig, ruffTool } from '../ruff'

describe('ESLint config adapter', () => {
  it('imports JSON rules with options and skips only explicit keys', () => {
    const config = parseEslintConfig(
      '{"rules":{"eqeqeq":["error","always"],"@typescript-eslint/no-explicit-any":"off"}}',
    )
    expect(eslintTool.configuredKeys(config)).toEqual(
      new Set(['eslint/eqeqeq', '@typescript-eslint/no-explicit-any']),
    )
    const output = generateEslintConfig(config, [{ ruleKey: 'eslint/no-alert', decision: 'warn' }])
    expect(output).toContain('"always"')
    expect(output).toContain('"no-alert": "warn"')
    expect(explicitEslintRules(output)).toContain('eslint/no-alert')
    expect(() => inspectEslintSource(output)).not.toThrow()
  })

  it('preserves imports, presets, file scopes, comments and config variables', () => {
    const source =
      "import js from '@eslint/js'\nimport { defineConfig } from 'eslint/config'\n// Project exclusions\nconst base = [{ ignores: ['dist/**'] }, js.configs.recommended, { files: ['src/*.js'], rules: { 'no-alert': 0 } }]\nexport default defineConfig(base)\n"
    const config = parseEslintConfig(source)
    expect(eslintTool.configuredKeys(config)).toEqual(new Set(['eslint/no-alert']))
    const output = generateEslintConfig(config, [{ ruleKey: 'eslint/eqeqeq', decision: 'error' }])
    expect(output).toContain('// Project exclusions')
    expect(output).toContain("ignores: ['dist/**']")
    expect(output).toContain('js.configs.recommended')
    expect(output).toContain('defineConfig(base)')
    expect(explicitEslintRules(output)).toEqual(new Set(['eslint/no-alert', 'eslint/eqeqeq']))
  })

  it('does not execute pasted code or expand imported presets', () => {
    const source =
      'globalThis.lintForgeProbe = true; export default [{ rules: { "no-alert": "error" } }]'
    expect(eslintTool.configuredKeys(parseEslintConfig(source))).toContain('eslint/no-alert')
    expect(Reflect.get(globalThis, 'lintForgeProbe')).toBeUndefined()
    expect(explicitEslintRules('import preset from "preset"; export default [preset]')).toEqual(
      new Set(),
    )
  })

  it('adds plugin imports, parser and type services only when needed', () => {
    const config = parseEslintConfig('export default {}')
    const plain = generateEslintConfig(config, [
      { ruleKey: '@typescript-eslint/no-explicit-any', decision: 'warn' },
    ])
    expect(plain).toContain("from '@typescript-eslint/eslint-plugin'")
    expect(plain).toContain("from '@typescript-eslint/parser'")
    expect(plain).not.toContain('projectService')
    const typed = generateEslintConfig(config, [
      { ruleKey: '@typescript-eslint/no-floating-promises', decision: 'error' },
    ])
    expect(typed).toContain('"projectService":true')
    expect(explicitEslintRules(typed)).toContain('@typescript-eslint/no-floating-promises')
    const hooks = generateEslintConfig(config, [
      { ruleKey: 'react-hooks/rules-of-hooks', decision: 'error' },
    ])
    expect(hooks).toContain("from 'eslint-plugin-react-hooks'")
    expect(hooks).not.toContain('projectService')
  })

  it.each([
    'export default () => []',
    'const config = {}',
    '{invalid',
    'null',
  ])('rejects unsupported input %s with actionable feedback', (source) => {
    expect(() => parseEslintConfig(source)).toThrow(/Invalid ESLint.*expected/)
  })

  it('rejects unsupported info severity', () => {
    expect(() =>
      generateEslintConfig(parseEslintConfig(''), [
        { ruleKey: 'eslint/no-alert', decision: 'info' },
      ]),
    ).toThrow(/expected off, warn, or error/)
  })

  it.each([
    '{"env":{"browser":true}}',
    '{"plugins":["react"]}',
    '{"rules":{"no-alert":"info"}}',
  ])('rejects invalid flat config input %s', (source) => {
    expect(() => parseEslintConfig(source)).toThrow(/Invalid ESLint.*expected/)
  })
})

describe('Ruff config adapter', () => {
  it('starts with no enabled rules and emits native selections', () => {
    const config = parseRuffConfig(ruffTool.defaultInput)
    const output = generateRuffConfig(config, [
      { ruleKey: 'ruff/F401', decision: 'error' },
      { ruleKey: 'ruff/E501', decision: 'off' },
    ])
    expect(parse(output)).toEqual({
      lint: { select: [], ignore: ['E501'], 'extend-select': ['F401'] },
    })
    expect(configuredRuffKeys(parseRuffConfig(output))).toEqual(new Set(['ruff/F401', 'ruff/E501']))
    expect(parse(ruffTool.generate(config, []))).toEqual(config)
  })

  it('preserves pyproject metadata and other tools when changing Ruff', () => {
    const config = parseRuffConfig(
      '[project]\nname = "sample"\nversion = "1.0.0"\n[tool.pytest.ini_options]\naddopts = "-q"\n[tool.ruff]\nline-length = 100\n[tool.ruff.lint]\nselect = ["E", "F401"]\n[tool.ruff.lint.per-file-ignores]\n"tests/*" = ["S101"]\n',
    )
    const next = parseRuffConfig(
      generateRuffConfig(config, [{ ruleKey: 'ruff/UP006', decision: 'error' }]),
    )
    expect(next.project).toEqual(config.project)
    expect(next.tool).toMatchObject({
      pytest: { ini_options: { addopts: '-q' } },
      ruff: {
        'line-length': 100,
        lint: {
          select: ['E', 'F401'],
          'extend-select': ['UP006'],
          'per-file-ignores': { 'tests/*': ['S101'] },
        },
      },
    })
    expect(configuredRuffKeys(config)).toEqual(new Set(['ruff/F401']))
    expect(ruffTool.filename(config)).toBe('pyproject.toml')
  })

  it('creates a Ruff section in a pyproject without one', () => {
    const config = parseRuffConfig('[project]\nname = "sample"')
    expect(
      parse(generateRuffConfig(config, [{ ruleKey: 'ruff/F401', decision: 'off' }])),
    ).toMatchObject({ project: { name: 'sample' }, tool: { ruff: { lint: { ignore: ['F401'] } } } })
  })

  it('preserves prefix selectors, migrates legacy fields and avoids contradictory exact codes', () => {
    const config = parseRuffConfig('select = ["ALL"]\nignore = ["F", "F401"]\n')
    const output = parseRuffConfig(
      generateRuffConfig(config, [{ ruleKey: 'ruff/F401', decision: 'error' }]),
    )
    expect(output).toEqual({ lint: { select: ['ALL'], ignore: ['F'], 'extend-select': ['F401'] } })
    expect(config.ignore).toEqual(['F', 'F401'])
  })

  it.each([
    '[lint]\nselect = "F"',
    '[tool.ruff]\nlint = false',
    '[lint]\nignore = [1]',
    'not toml',
  ])('rejects invalid Ruff configuration %s', (source) => {
    expect(() => parseRuffConfig(source)).toThrow(/Invalid.*expected/)
  })

  it('does not invent severity levels for Ruff', () => {
    expect(() => generateRuffConfig({}, [{ ruleKey: 'ruff/F401', decision: 'warn' }])).toThrow(
      /expected off.*enabled/,
    )
  })
})

describe('generated tool catalogs', () => {
  it.each([
    ['ESLint', eslintRules, 300],
    ['Ruff', ruffRules, 800],
  ] as const)('%s publishes a complete unique catalog with official documentation', (_name, rules, minimum) => {
    expect(rules.length).toBeGreaterThan(minimum)
    expect(new Set(rules.map((rule) => `${rule.group}/${rule.name}`)).size).toBe(rules.length)
    for (const rule of rules) {
      expect(rule.url).toMatch(/^https:\/\//)
      expect(rule.categories?.length).toBeGreaterThan(0)
      expect(rule.domains.length).toBeGreaterThan(0)
    }
  })
})
