import { capture } from './helpers.js'
import { describe, it, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import Scheduler from '../core/scheduler.js'

describe('Scheduler', () => {
  let scheduler

  afterEach(async () => {
    if (scheduler) await capture(() => scheduler.stopAll())
  })

  it('adds a task from a command string', async () => {
    scheduler = new Scheduler({})
    await capture(() => scheduler.addTask('Backup 60'))
    assert.equal(scheduler.tasks.length, 1)
    assert.equal(scheduler.tasks[0].name, 'Backup')
    assert.equal(scheduler.tasks[0].interval, 60)
  })

  it('rejects invalid intervals', async () => {
    scheduler = new Scheduler({})
    const output = await capture(() => {
      scheduler.addTask('Bad abc')
      scheduler.addTask('Zero 0')
      scheduler.addTask('Negative -5')
    })
    assert.equal(scheduler.tasks.length, 0)
    assert.match(output, /Interval tidak valid/)
  })

  it('runs a custom action on every tick', async () => {
    scheduler = new Scheduler({})
    let ticks = 0
    await capture(() => scheduler.addTask('Tick', 0.01, () => { ticks++ }))
    await new Promise(resolve => setTimeout(resolve, 80))
    assert.ok(ticks >= 2)
  })

  it('stops a task by id or by name', async () => {
    scheduler = new Scheduler({})
    await capture(() => {
      scheduler.addTask('One 60')
      scheduler.addTask('Two 60')
    })
    await capture(() => scheduler.stopTask('1'))
    await capture(() => scheduler.stopTask('Two'))
    assert.equal(scheduler.tasks.length, 0)
  })

  it('reports unknown tasks', async () => {
    scheduler = new Scheduler({})
    const output = await capture(() => scheduler.stopTask('ghost'))
    assert.match(output, /tidak ditemukan/)
  })
})
