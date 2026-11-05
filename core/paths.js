import fs from 'fs'
import os from 'os'
import path from 'path'

export const DATA_DIR = process.env.AURA_HOME || path.join(os.homedir(), '.aura')

try {
  fs.mkdirSync(DATA_DIR, { recursive: true })
} catch {}

export function dataPath(...segments) {
  return path.join(DATA_DIR, ...segments)
}
