import { ESLint } from 'eslint'
import { describe, expect, it } from 'vitest'
import { generateEslintConfig, parseEslintConfig } from '../eslint'

describe('generated configs with the installed ESLint engine', () => {
  it('loads generated core and plugin settings and lints JavaScript and TypeScript', async () => {
    const output = generateEslintConfig(parseEslintConfig(''), [
      { ruleKey: 'eslint/no-alert', decision: 'warn' },
      { ruleKey: '@typescript-eslint/no-explicit-any', decision: 'error' },
      { ruleKey: 'react-hooks/rules-of-hooks', decision: 'error' },
    ])
    const resolvedOutput = output.replace(
      /from '([^']+)'/g,
      (_match, name: string) => `from '${import.meta.resolve(name)}'`,
    )
    const moduleUrl = `data:text/javascript;base64,${Buffer.from(resolvedOutput).toString('base64')}`
    const config = await import(/* @vite-ignore */ moduleUrl)
    const engine = new ESLint({ overrideConfigFile: true, overrideConfig: config.default })
    const [javascript] = await engine.lintText('alert("test")', { filePath: 'example.js' })
    expect(javascript.messages).toEqual(
      expect.arrayContaining([expect.objectContaining({ ruleId: 'no-alert', severity: 1 })]),
    )
    const [typescript] = await engine.lintText('const value: any = 1', { filePath: 'example.ts' })
    expect(typescript.messages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ ruleId: '@typescript-eslint/no-explicit-any', severity: 2 }),
      ]),
    )
    expect(javascript.fatalErrorCount + typescript.fatalErrorCount).toBe(0)
  })
})
