import './helpers.js'
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { shouldIgnore } from '../core/watcher.js'

describe('Watcher ignore rules', () => {
  it('ignores dependency, git and backup folders', () => {
    assert.equal(shouldIgnore('/p/node_modules/x/index.js'), true)
    assert.equal(shouldIgnore('/p/.git/HEAD'), true)
    assert.equal(shouldIgnore('/p/aura_backups/a.js.bak'), true)
    assert.equal(shouldIgnore('C:\\p\\node_modules\\x.js'), true)
  })

  it('does not ignore lookalike paths', () => {
    assert.equal(shouldIgnore('/p/.github/workflows/ci.yml'), false)
    assert.equal(shouldIgnore('/p/.gitignore'), false)
    assert.equal(shouldIgnore('/p/src/node_modules_notes.md'), false)
  })
})
