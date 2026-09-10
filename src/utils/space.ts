export function resolveSpace(value: string | number, hyphenateCustomTokens = false): string {
  if (typeof value !== 'number' && !/^\d+(\.\d+)?$/.test(value)) return value
  const key = String(value)
  // Only 0.5 is a shipped fractional token. SplitLayout historically hyphenates
  // custom keys too; other layouts must retain their existing key spelling.
  const token = key === '0.5' || hyphenateCustomTokens ? key.replace('.', '-') : key
  return `var(--ui-space-${token})`
}
