import { tempDir } from './helpers.js'
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { validateMarketplace } from '../scripts/validate-marketplace.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function rootWith(entries) {
  const dir = tempDir('aura-market-')
  fs.mkdirSync(path.join(dir, 'marketplace'))
  fs.writeFileSync(path.join(dir, 'marketplace', 'plugins.json'), JSON.stringify(entries))
  return dir
}

describe('marketplace index', () => {
  it('matches the bundled plugins', async () => {
    assert.deepEqual(await validateMarketplace(root), [])
  })

  it('flags duplicate names, bad versions and non-https urls', async () => {
    const dir = rootWith([
      { name: 'A', version: '1.0', url: 'http://example.com/a.js', description: 'x' },
      { name: 'A', version: '1.0.0', url: 'https://example.com/a.js', description: 'x' },
    ])
    const errors = await validateMarketplace(dir)
    assert.ok(errors.some(e => e.includes('duplikat')))
    assert.ok(errors.some(e => e.includes('semver')))
    assert.ok(errors.some(e => e.includes('https')))
  })

  it('flags missing fields', async () => {
    const errors = await validateMarketplace(rootWith([{ name: 'A' }]))
    assert.ok(errors.length >= 3)
  })

  it('flags a version that drifts from the plugin file', async () => {
    const dir = rootWith([
      {
        name: 'AutoBackup',
        version: '0.0.1',
        url: 'https://raw.githubusercontent.com/djunekz/aura/main/core/plugins/autobackup.js',
        description: 'x',
      },
    ])
    fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ type: 'module' }))
    fs.mkdirSync(path.join(dir, 'core', 'plugins'), { recursive: true })
    fs.copyFileSync(
      path.join(root, 'core', 'plugins', 'autobackup.js'),
      path.join(dir, 'core', 'plugins', 'autobackup.js')
    )
    fs.symlinkSync(path.join(root, 'node_modules'), path.join(dir, 'node_modules'))
    const errors = await validateMarketplace(dir)
    assert.ok(errors.some(e => e.includes('berbeda')))
  })

  it('reports an unreadable index', async () => {
    const errors = await validateMarketplace(tempDir())
    assert.equal(errors.length, 1)
  })
})
