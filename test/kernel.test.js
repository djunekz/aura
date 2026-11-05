import { tempDir, capture } from './helpers.js'
import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'
import Kernel from '../core/kernel.js'

describe('Kernel commands', () => {
  let kernel

  before(() => {
    process.chdir(tempDir())
    kernel = new Kernel()
  })

  after(() => {
    kernel.shutdown()
  })

  it('stores, reads and deletes memory', async () => {
    await capture(() => kernel.handleCommand('memory set greeting hello world'))
    assert.equal(kernel.memory.get('greeting'), 'hello world')
    const read = await capture(() => kernel.handleCommand('memory get greeting'))
    assert.match(read, /hello world/)
    const removed = await capture(() => kernel.handleCommand('memory delete greeting'))
    assert.match(removed, /dihapus/)
    const missing = await capture(() => kernel.handleCommand('memory get greeting'))
    assert.match(missing, /tidak ditemukan/)
  })

  it('sets the identity', async () => {
    await capture(() => kernel.handleCommand('identity set Dev User'))
    assert.equal(kernel.identity.getName(), 'Dev User')
  })

  it('updates world data and rejects unsafe keys', async () => {
    await capture(() => kernel.handleCommand('world user alice role admin'))
    assert.deepEqual(kernel.world.getUser('alice'), { role: 'admin' })
    await assert.rejects(() => kernel.handleCommand('world user __proto__ x y'), /Invalid key/)
    assert.equal(({}).x, undefined)
  })

  it('manages scheduler tasks', async () => {
    await capture(() => kernel.handleCommand('scheduler add Nightly 3600'))
    const listed = await capture(() => kernel.handleCommand('scheduler list'))
    assert.match(listed, /Nightly/)
    await capture(() => kernel.handleCommand('scheduler stop Nightly'))
    assert.equal(kernel.scheduler.tasks.length, 0)
  })

  it('prints help with every command group', async () => {
    const output = await capture(() => kernel.handleCommand('help'))
    for (const group of ['System', 'Memory', 'Git', 'Runner', 'Plugins', 'Marketplace', 'Scheduler', 'Config']) {
      assert.match(output, new RegExp(`${group}:`))
    }
  })

  it('suggests commands for typos', async () => {
    const output = await capture(() => kernel.handleCommand('statu'))
    assert.match(output, /Unknown command/)
    assert.match(output, /status/)
  })

  it('shows the kernel status', async () => {
    const output = await capture(() => kernel.handleCommand('status'))
    assert.match(output, /AURA Kernel Status/)
  })

  it('records and reloads command history', () => {
    kernel.commandHistory.push('status')
    kernel._saveHistory()
    const reloaded = new Kernel()
    assert.ok(reloaded.commandHistory.includes('status'))
    reloaded.shutdown()
  })
})
