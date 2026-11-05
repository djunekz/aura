import fs from 'fs'
import chalk from 'chalk'
import { dataPath } from './paths.js'

class Identity {
  constructor() {
    this.filePath = dataPath('identity.json')
    this.name = 'Unknown User'
    this.loadIdentity()
  }

  loadIdentity() {
    if (!fs.existsSync(this.filePath)) return
    try {
      const data = JSON.parse(fs.readFileSync(this.filePath, 'utf-8'))
      this.name = data.name || 'Unknown User'
    } catch {
      this.name = 'Unknown User'
    }
  }

  showIdentity() {
    console.log(chalk.cyan(`User Identity: ${this.name}`))
  }

  getName() {
    return this.name
  }

  setName(name) {
    this.name = name
    fs.writeFileSync(this.filePath, JSON.stringify({ name: this.name }, null, 2))
  }
}

export default Identity
