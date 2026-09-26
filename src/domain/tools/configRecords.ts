export function isConfigRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function configRecord(value: unknown, field: string): Record<string, unknown> {
  if (value === undefined) return {}
  if (isConfigRecord(value)) return value
  throw new Error(`Invalid ${field}: ${JSON.stringify(value)}; expected an object`)
}

export function configStringList(value: unknown, field: string): string[] {
  if (value === undefined) return []
  if (Array.isArray(value) && value.every((item) => typeof item === 'string')) return value
  throw new Error(`Invalid ${field}: ${JSON.stringify(value)}; expected an array of strings`)
}
