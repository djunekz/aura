import { capture } from './helpers.js'
import { describe, it, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import AIEngine from '../core/ai.js'

describe('AIEngine', () => {
  let ai

  afterEach(() => {
    ai?.destroy()
  })

  it('maps known errors to fixes', () => {
    ai = new AIEngine({})
    assert.match(ai.trackError("Error: Cannot find module 'x'"), /npm install/)
    assert.match(ai.trackError('EADDRINUSE: address already in use'), /Port/)
  })

  it('falls back when no pattern matches', () => {
    ai = new AIEngine({})
    assert.match(ai.trackError('something odd happened'), /Tidak ada saran spesifik/)
  })

  it('keeps only the last 50 errors', () => {
    ai = new AIEngine({})
    for (let i = 0; i < 60; i++) ai.trackError(`failure ${i}`)
    assert.equal(ai.errorLog.length, 50)
  })

  it('counts commands and ranks them', () => {
    ai = new AIEngine({})
    ai.trackCommand('status')
    ai.trackCommand('status')
    ai.trackCommand('help')
    assert.deepEqual(ai._topCommands(1), [{ name: 'status', count: 2 }])
  })

  it('answers topic questions from kernel state', async () => {
    ai = new AIEngine({ networkWatcher: { online: true }, context: { projectType: 'Go' }, pluginManager: { plugins: [] } })
    const output = await capture(() => ai.answer('how do I deploy'))
    assert.match(output, /Network: ONLINE/)
    assert.match(output, /Project type: Go/)
  })

  it('lists topics for unknown questions', async () => {
    ai = new AIEngine({})
    const output = await capture(() => ai.answer('zzz'))
    assert.match(output, /ask deploy/)
  })
})
