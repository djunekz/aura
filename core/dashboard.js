import { fork } from 'child_process'
import { fileURLToPath } from 'url'
import path from 'path'
import chalk from 'chalk'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

class Dashboard {
  constructor(kernel) {
    this.kernel = kernel
    this.child = null
    this.ready = false

    this._spawn()
  }

  _spawn() {
    const dashboardPath = path.resolve(__dirname, 'dashboard-process.js')

    try {
      this.child = fork(dashboardPath, [], {
        detached: false,
        stdio: ['ignore', 'ignore', 'pipe', 'ipc']
      })

      this.child.on('error', (err) => {
        console.error(chalk.yellow('[Dashboard] Child process error:'), err.message)
        this.child = null
        this.ready = false
      })

      this.child.on('exit', (code) => {
        if (code !== 0 && code !== null) {
          console.error(chalk.yellow(`[Dashboard] Child exited with code ${code}. Dashboard disabled.`))
        }
        this.child = null
        this.ready = false
      })

      this.child.stderr?.on('data', (data) => {
        process.stderr.write(chalk.yellow('[Dashboard] ') + data.toString())
      })

      this.ready = true
      console.log(chalk.gray('[Dashboard] Running in separate process (PID: ' + this.child.pid + ')'))

    } catch (err) {
      console.error(chalk.yellow('[Dashboard] Could not spawn dashboard process:'), err.message)
      this.child = null
      this.ready = false
    }
  }

  render() {
    if (!this.child || !this.ready) return

    try {
      const kernel = this.kernel

      const data = {
        user: kernel?.identity?.getName?.() || 'Unknown',
        commandsCount: kernel?.commandHistory?.length || 0,
        memKeys: kernel?.memory
          ? Object.keys(kernel.memory.data || {}).join('\n') || 'empty'
          : 'empty',
        networkOnline: kernel?.networkWatcher?.online || false
      }

      this.child.send({ type: 'state', data })
    } catch (err) {
      console.error(chalk.yellow('[Dashboard.render]'), err.message)
      this.ready = false
    }
  }

  log(message) {
    if (!this.child || !this.ready) {
      console.log(chalk.gray('[log]'), message)
      return
    }

    try {
      this.child.send({ type: 'log', data: message })
    } catch (err) {
      console.log(chalk.gray('[log]'), message)
    }
  }

  refreshAll() {
    this.render()
  }

  destroy() {
    if (this.child) {
      try {
        this.child.kill()
      } catch (_) {}
      this.child = null
      this.ready = false
    }
  }
}

export default Dashboard
