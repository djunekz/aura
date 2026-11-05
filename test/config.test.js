import { tempDir, capture } from './helpers.js'
import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'fs'
import path from 'path'
import Config from '../core/config.js'

describe('Config', () => {
  let dir

  beforeEach(() => {
    dir = tempDir()
    process.chdir(dir)
  })

  it('uses defaults when no file exists', () => {
    const config = new Config()
    assert.equal(config.get('autoWatch'), false)
    assert.deepEqual(config.get('autoScheduler'), [])
    assert.equal(config.get('theme'), 'default')
  })

  it('creates a template with init and does not overwrite it', async () => {
    const config = new Config()
    await capture(() => config.init())
    const file = path.join(dir, 'aura.config.json')
    assert.ok(fs.existsSync(file))
    fs.writeFileSync(file, JSON.stringify({ theme: 'custom' }))
    const output = await capture(() => config.init())
    assert.match(output, /sudah ada/)
    assert.equal(JSON.parse(fs.readFileSync(file, 'utf-8')).theme, 'custom')
  })

  it('persists values set at runtime', async () => {
    const config = new Config()
    await capture(() => config.set('autoWatch', true))
    assert.equal(new Config().get('autoWatch'), true)
  })

  it('falls back to defaults on invalid JSON', async () => {
    fs.writeFileSync(path.join(dir, 'aura.config.json'), '{broken')
    let config
    const output = await capture(() => { config = new Config() })
    assert.match(output, /tidak valid/)
    assert.equal(config.get('theme'), 'default')
  })
})
