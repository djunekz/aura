import { HOME, tempDir } from './helpers.js'
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { spawn, spawnSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const entry = path.join(root, 'aura.js')
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf-8'))

describe('aura CLI', () => {
  it('prints the version', () => {
    const result = spawnSync(process.execPath, [entry, '--version'], { encoding: 'utf-8' })
    assert.equal(result.status, 0)
    assert.equal(result.stdout.trim(), pkg.version)
  })

  it('prints usage', () => {
    const result = spawnSync(process.execPath, [entry, '--help'], { encoding: 'utf-8' })
    assert.equal(result.status, 0)
    assert.match(result.stdout, /Usage: aura/)
  })

  it('starts the shell, answers commands and exits cleanly', async () => {
    const child = spawn(process.execPath, [entry], {
      cwd: tempDir(),
      env: { ...process.env, AURA_HOME: HOME },
      stdio: ['pipe', 'pipe', 'pipe'],
    })

    let stdout = ''
    child.stdout.on('data', chunk => { stdout += chunk })
    child.stdin.write('status\nmemory set k v\nmemory get k\nexit\n')

    const code = await new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        child.kill()
        reject(new Error('CLI did not exit in time'))
      }, 20000)
      child.on('close', c => {
        clearTimeout(timer)
        resolve(c)
      })
    })

    assert.equal(code, 0)
    assert.match(stdout, /Welcome to AURA/)
    assert.match(stdout, /AURA Kernel Status/)
    assert.match(stdout, /Goodbye/)
  })
})
