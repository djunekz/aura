import fs from 'fs'
import { dataPath } from './paths.js'
import { assertSafeKey } from './safe.js'

class World {
  constructor() {
    this.filePath = dataPath('world.json')
    this.state = { users: {}, projects: {} }
    this.loadWorld()
  }

  loadWorld() {
    if (!fs.existsSync(this.filePath)) {
      this.saveWorld()
      return
    }
    try {
      const parsed = JSON.parse(fs.readFileSync(this.filePath, 'utf-8'))
      this.state = {
        users: parsed.users || {},
        projects: parsed.projects || {},
      }
    } catch {
      this.state = { users: {}, projects: {} }
    }
  }

  saveWorld() {
    fs.writeFileSync(this.filePath, JSON.stringify(this.state, null, 2))
  }

  updateUser(userId, data) {
    assertSafeKey(userId)
    Object.keys(data).forEach(assertSafeKey)
    if (!this.state.users[userId]) this.state.users[userId] = {}
    Object.assign(this.state.users[userId], data)
    this.saveWorld()
  }

  getUser(userId) {
    return this.state.users[userId] || {}
  }

  updateProject(projectName, data) {
    assertSafeKey(projectName)
    Object.keys(data).forEach(assertSafeKey)
    if (!this.state.projects[projectName]) this.state.projects[projectName] = {}
    Object.assign(this.state.projects[projectName], data)
    this.saveWorld()
  }

  getProject(projectName) {
    return this.state.projects[projectName] || {}
  }
}

export default World
