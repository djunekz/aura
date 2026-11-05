import { tempDir } from './helpers.js'
import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'fs'
import path from 'path'
import Context from '../core/context.js'

describe('Context', () => {
  let dir

  beforeEach(() => {
    dir = tempDir()
    process.chdir(dir)
  })

  it('detects a Node.js project', () => {
    fs.writeFileSync(path.join(dir, 'package.json'), '{}')
    assert.equal(new Context().projectType, 'Node.js / JavaScript')
  })

  it('detects a Go project', () => {
    fs.writeFileSync(path.join(dir, 'go.mod'), 'module x')
    assert.equal(new Context().projectType, 'Go')
  })

  it('detects a .NET project by glob', () => {
    fs.writeFileSync(path.join(dir, 'App.csproj'), '<Project />')
    assert.equal(new Context().projectType, '.NET / C#')
  })

  it('falls back to generic for unknown folders', () => {
    assert.equal(new Context().projectType, 'Unknown / Generic')
  })
})
