import './helpers.js'
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'fs'
import Identity from '../core/identity.js'

describe('Identity', () => {
  it('falls back to a default name', () => {
    const identity = new Identity()
    fs.rmSync(identity.filePath, { force: true })
    assert.equal(new Identity().getName(), 'Unknown User')
  })

  it('persists the chosen name', () => {
    new Identity().setName('Djunekz')
    assert.equal(new Identity().getName(), 'Djunekz')
  })

  it('survives a corrupted identity file', () => {
    const identity = new Identity()
    fs.writeFileSync(identity.filePath, '???')
    assert.equal(new Identity().getName(), 'Unknown User')
  })
})
