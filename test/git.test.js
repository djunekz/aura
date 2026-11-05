import { tempDir, capture } from './helpers.js'
import { describe, it, before } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import GitManager from '../core/git.js'

describe('GitManager', () => {
  let dir
  let git

  before(() => {
    dir = tempDir('aura-git-')
    process.chdir(dir)
    execFileSync('git', ['init'], { cwd: dir, stdio: 'ignore' })
    execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: dir })
    execFileSync('git', ['config', 'user.name', 'Test'], { cwd: dir })
    execFileSync('git', ['config', 'commit.gpgsign', 'false'], { cwd: dir })
    git = new GitManager({})
  })

  it('refuses to run outside a repository', async () => {
    const elsewhere = tempDir('aura-nogit-')
    const previous = process.cwd()
    process.chdir(elsewhere)
    const output = await capture(() => new GitManager({}).status())
    process.chdir(previous)
    assert.match(output, /bukan repositori Git/)
  })

  it('adds and commits files', async () => {
    fs.writeFileSync(path.join(dir, 'a.txt'), 'a')
    await capture(() => git.add('.'))
    await capture(() => git.commit('feat: first'))
    const subject = execFileSync('git', ['log', '-1', '--format=%s'], { cwd: dir }).toString().trim()
    assert.equal(subject, 'feat: first')
  })

  it('treats shell metacharacters in commit messages literally', async () => {
    fs.writeFileSync(path.join(dir, 'b.txt'), 'b')
    await capture(() => git.add('b.txt'))
    const message = 'fix: x; touch pwned $(touch pwned2) `touch pwned3`'
    await capture(() => git.commit(message))
    const subject = execFileSync('git', ['log', '-1', '--format=%s'], { cwd: dir }).toString().trim()
    assert.equal(subject, message)
    for (const name of ['pwned', 'pwned2', 'pwned3']) {
      assert.equal(fs.existsSync(path.join(dir, name)), false)
    }
  })

  it('does not execute injected commands through add', async () => {
    await capture(() => git.add('. ; touch injected'))
    assert.equal(fs.existsSync(path.join(dir, 'injected')), false)
  })

  it('shows recent history', async () => {
    const output = await capture(() => git.log(2))
    assert.match(output, /feat: first/)
  })

  it('falls back to a timestamped message when none is given', async () => {
    fs.writeFileSync(path.join(dir, 'c.txt'), 'c')
    await capture(() => git.add('c.txt'))
    await capture(() => git.commit())
    const subject = execFileSync('git', ['log', '-1', '--format=%s'], { cwd: dir }).toString().trim()
    assert.match(subject, /^chore: auto-commit by AURA/)
  })
})
