import './helpers.js'
import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'fs'
import Memory from '../core/memory.js'

describe('Memory', () => {
  beforeEach(() => {
    new Memory().clear()
  })

  it('stores and reads values', () => {
    const memory = new Memory()
    memory.set('project', 'aura')
    assert.equal(memory.get('project'), 'aura')
  })

  it('persists values across instances', () => {
    new Memory().set('repo', 'aura')
    assert.equal(new Memory().get('repo'), 'aura')
  })

  it('deletes existing keys and reports missing ones', () => {
    const memory = new Memory()
    memory.set('a', '1')
    assert.equal(memory.delete('a'), true)
    assert.equal(memory.delete('a'), false)
    assert.equal(memory.get('a'), undefined)
  })

  it('clears everything', () => {
    const memory = new Memory()
    memory.set('a', '1')
    memory.clear()
    assert.deepEqual(memory.data, {})
  })

  it('rejects prototype-polluting keys', () => {
    const memory = new Memory()
    assert.throws(() => memory.set('__proto__', 'x'), /Invalid key/)
    assert.throws(() => memory.set('constructor', 'x'), /Invalid key/)
    assert.equal(({}).x, undefined)
  })

  it('recovers from a corrupted file', () => {
    const memory = new Memory()
    fs.writeFileSync(memory.filePath, '{not json')
    assert.deepEqual(new Memory().data, {})
  })
})
