import { HOME, tempDir, capture } from './helpers.js'
import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'fs'
import path from 'path'
import PluginManager, { assertInstallableUrl } from '../core/plugin.js'

function fakeKernel() {
  return {
    watcher: { handleEvent() {} },
    networkWatcher: { online: false },
    logger: { warn() {} },
  }
}

describe('assertInstallableUrl', () => {
  it('accepts https urls to .js files', () => {
    assert.equal(assertInstallableUrl('https://example.com/a/my-plugin.js'), 'my-plugin.js')
  })

  it('rejects other protocols, invalid urls and non-js files', () => {
    assert.throws(() => assertInstallableUrl('http://example.com/a.js'), /https/)
    assert.throws(() => assertInstallableUrl('file:///etc/passwd'), /https/)
    assert.throws(() => assertInstallableUrl('not a url'), /tidak valid/)
    assert.throws(() => assertInstallableUrl('https://example.com/a.sh'), /\.js/)
    assert.throws(() => assertInstallableUrl('https://example.com/'), /\.js/)
  })
})

describe('PluginManager', () => {
  const userDir = path.join(HOME, 'plugins')

  beforeEach(() => {
    process.chdir(tempDir())
    fs.rmSync(userDir, { recursive: true, force: true })
  })

  it('loads the bundled plugins', async () => {
    const manager = new PluginManager(fakeKernel())
    await capture(() => manager.loadPlugins())
    const names = manager.plugins.map(p => p.name).sort()
    assert.deepEqual(names, ['AutoBackup', 'AutoDeploy'])
  })

  it('lets a user plugin override a bundled one with the same name', async () => {
    fs.mkdirSync(userDir, { recursive: true })
    fs.writeFileSync(
      path.join(userDir, 'autobackup.js'),
      "export default { name: 'AutoBackup', version: '9.9.9', init() {} }\n"
    )
    const manager = new PluginManager(fakeKernel())
    await capture(() => manager.loadPlugins())
    assert.equal(manager.plugins.length, 2)
    assert.equal(manager.plugins.find(p => p.name === 'AutoBackup').version, '9.9.9')
  })

  it('marks the user plugin folder as ES modules so every Node version can load it', async () => {
    const manager = new PluginManager(fakeKernel())
    await capture(() => manager.loadPlugins())
    const manifest = JSON.parse(fs.readFileSync(path.join(userDir, 'package.json'), 'utf-8'))
    assert.equal(manifest.type, 'module')
  })

  it('logs and skips plugins that fail to load', async () => {
    fs.mkdirSync(userDir, { recursive: true })
    fs.writeFileSync(path.join(userDir, 'broken.js'), 'export default {')
    const warnings = []
    const kernel = fakeKernel()
    kernel.logger.warn = msg => warnings.push(msg)
    const manager = new PluginManager(kernel)
    await capture(() => manager.loadPlugins())
    assert.equal(manager.plugins.length, 2)
    assert.ok(warnings.some(w => w.includes('broken.js')))
  })

  it('installs a local plugin into the user directory', async () => {
    const source = path.join(tempDir(), 'hello.js')
    fs.writeFileSync(source, "export default { name: 'Hello', init() {} }\n")
    const manager = new PluginManager(fakeKernel())
    await capture(() => manager.installPlugin(source))
    assert.ok(fs.existsSync(path.join(userDir, 'hello.js')))
  })

  it('refuses plugin files with unsafe names', async () => {
    const source = path.join(tempDir(), 'bad name.js')
    fs.writeFileSync(source, 'export default {}\n')
    const manager = new PluginManager(fakeKernel())
    await capture(() => manager.installPlugin(source))
    assert.equal(fs.existsSync(path.join(userDir, 'bad name.js')), false)
  })
})
