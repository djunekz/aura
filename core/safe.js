const UNSAFE_KEYS = new Set(['__proto__', 'constructor', 'prototype'])

export function assertSafeKey(key) {
  if (typeof key !== 'string' || key.length === 0 || UNSAFE_KEYS.has(key)) {
    throw new Error(`Invalid key: ${String(key)}`)
  }
  return key
}
