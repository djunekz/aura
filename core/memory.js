import { fileURLToPath } from 'url'
import path from 'path'
import fs from 'fs'
import chalk from 'chalk'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

class Memory {
  constructor() {
    this.filePath = path.join(__dirname, 'memory.json')
    this.data = {}
    this.loadMemory()
  }

  loadMemory() {
    if (fs.existsSync(this.filePath)) {
      try {
        this.data = JSON.parse(fs.readFileSync(this.filePath, 'utf-8'))
      } catch {
        this.data = {}
      }
    }
  }

  saveMemory() {
    fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2))
  }

  set(key, value) {
    this.data[key] = value
    this.saveMemory()
  }

  get(key) {
    return this.data[key]
  }

  delete(key) {
    if (!(key in this.data)) return false
    delete this.data[key]
    this.saveMemory()
    return true
  }

  clear() {
    this.data = {}
    this.saveMemory()
  }

  showMemory() {
    const keys = Object.keys(this.data)
    console.log(chalk.blue.bold('\n── Memory ──────────────────────────────'))
    if (keys.length === 0) {
      console.log(chalk.gray('  (kosong)'))
    } else {
      keys.forEach(k => {
        console.log(chalk.yellow(`  ${k}`) + chalk.white(' = ') + chalk.green(JSON.stringify(this.data[k])))
      })
    }
    console.log(chalk.blue('────────────────────────────────────────\n'))
  }
}

export default Memory
