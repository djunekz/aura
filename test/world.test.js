import './helpers.js'
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'fs'
import World from '../core/world.js'

describe('World', () => {
  it('merges user data', () => {
    const world = new World()
    world.updateUser('alice', { role: 'admin' })
    world.updateUser('alice', { team: 'core' })
    assert.deepEqual(world.getUser('alice'), { role: 'admin', team: 'core' })
  })

  it('stores project data and persists it', () => {
    new World().updateProject('aura', { stage: 'beta' })
    assert.deepEqual(new World().getProject('aura'), { stage: 'beta' })
  })

  it('returns empty objects for unknown entries', () => {
    const world = new World()
    assert.deepEqual(world.getUser('nobody'), {})
    assert.deepEqual(world.getProject('nothing'), {})
  })

  it('refuses to pollute Object.prototype', () => {
    const world = new World()
    assert.throws(() => world.updateUser('__proto__', { polluted: 'yes' }), /Invalid key/)
    assert.throws(() => world.updateProject('ok', { constructor: 'x' }), /Invalid key/)
    assert.equal(({}).polluted, undefined)
  })

  it('recovers from a corrupted file', () => {
    const world = new World()
    fs.writeFileSync(world.filePath, 'oops')
    assert.deepEqual(new World().state, { users: {}, projects: {} })
  })
})
