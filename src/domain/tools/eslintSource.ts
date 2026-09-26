import { type Expression, type Node, type Program, type Property, parse } from 'acorn'

/** Reads configuration structure without evaluating imported or pasted JavaScript. */
export function inspectEslintSource(source: string) {
  let program: Program
  try {
    program = parse(source, { ecmaVersion: 'latest', sourceType: 'module' })
  } catch {
    throw new Error(
      'Invalid ESLint config syntax; expected JavaScript with export default or a JSON config object',
    )
  }
  const exported = program.body.find((statement) => statement.type === 'ExportDefaultDeclaration')
  if (!exported || !('declaration' in exported)) {
    throw new Error(
      'Invalid ESLint export: missing; expected export default with an object, array, or defineConfig(...)',
    )
  }
  const bindings = collectConfigBindings(program)
  const declaration = exported.declaration as Expression
  const blocks = collectConfigBlocks(declaration, bindings, new Set())
  return {
    declaration,
    blocks,
    isObject: resolveConfigExpression(declaration, bindings).type === 'ObjectExpression',
  }
}

function collectConfigBindings(program: Program) {
  const bindings = new Map<string, Expression>()
  for (const statement of program.body) {
    if (statement.type !== 'VariableDeclaration') continue
    for (const declaration of statement.declarations) {
      if (declaration.id.type === 'Identifier' && declaration.init)
        bindings.set(declaration.id.name, declaration.init)
    }
  }
  return bindings
}

function resolveConfigExpression(
  expression: Expression,
  bindings: Map<string, Expression>,
): Expression {
  if (expression.type !== 'Identifier') return expression
  const resolved = bindings.get(expression.name)
  if (!resolved || resolved.type === 'Identifier') return expression
  return resolved
}

function collectConfigBlocks(
  expression: Expression,
  bindings: Map<string, Expression>,
  seen: Set<Node>,
): Property[][] {
  const resolved = resolveConfigExpression(expression, bindings)
  if (seen.has(resolved)) return []
  seen.add(resolved)
  if (resolved.type === 'ObjectExpression')
    return [
      resolved.properties.filter((property): property is Property => property.type === 'Property'),
    ]
  if (resolved.type === 'ArrayExpression')
    return resolved.elements.flatMap((item) =>
      item
        ? collectConfigBlocks(item.type === 'SpreadElement' ? item.argument : item, bindings, seen)
        : [],
    )
  if (resolved.type === 'CallExpression' && isDefineConfigCall(resolved.callee)) {
    return resolved.arguments.flatMap((item) =>
      collectConfigBlocks(item.type === 'SpreadElement' ? item.argument : item, bindings, seen),
    )
  }
  if (
    resolved.type === 'CallExpression' &&
    resolved.callee.type === 'MemberExpression' &&
    resolved.callee.object.type === 'ArrayExpression' &&
    resolved.callee.property.type === 'Identifier' &&
    resolved.callee.property.name === 'flat'
  ) {
    return collectConfigBlocks(resolved.callee.object, bindings, seen)
  }
  // Imported presets and expressions are preserved, but never executed or expanded.
  if (resolved.type === 'MemberExpression' || resolved.type === 'Identifier') return []
  throw new Error(
    `Invalid ESLint config expression: ${resolved.type}; expected an object, array, or defineConfig(...)`,
  )
}

function isDefineConfigCall(callee: Node) {
  return (
    (callee.type === 'Identifier' && 'name' in callee && callee.name === 'defineConfig') ||
    (callee.type === 'MemberExpression' &&
      'property' in callee &&
      (callee.property as { name?: string }).name === 'config')
  )
}

export function eslintPropertyName(property: Property): string | undefined {
  if (property.computed) return undefined
  if (property.key.type === 'Identifier') return property.key.name
  if (property.key.type === 'Literal' && typeof property.key.value === 'string')
    return property.key.value
  return undefined
}

export function explicitEslintRules(source: string): Set<string> {
  const { blocks } = inspectEslintSource(source)
  const keys = blocks.flatMap((properties) => {
    const rules = properties.find((property) => eslintPropertyName(property) === 'rules')?.value
    if (rules?.type !== 'ObjectExpression') return []
    return rules.properties.flatMap((property) =>
      property.type === 'Property'
        ? [eslintPropertyName(property)].filter((key): key is string => Boolean(key))
        : [],
    )
  })
  return new Set(keys.map((key) => (key.includes('/') ? key : `eslint/${key}`)))
}
