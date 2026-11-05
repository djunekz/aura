import fs from 'fs'
import os from 'os'
import path from 'path'

export const HOME = fs.mkdtempSync(path.join(os.tmpdir(), 'aura-home-'))
process.env.AURA_HOME = HOME

const ANSI = new RegExp(String.fromCharCode(27) + '\\[[0-9;]*m', 'g')

export function tempDir(prefix = 'aura-test-') {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix))
}

export function stripAnsi(text) {
  return String(text).replace(ANSI, '')
}

export async function capture(fn) {
  const lines = []
  const original = console.log
  console.log = (...args) => { lines.push(args.join(' ')) }
  try {
    await fn()
  } finally {
    console.log = original
  }
  return stripAnsi(lines.join('\n'))
}
