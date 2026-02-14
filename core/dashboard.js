// dashboard.js
// Replaces the old blessed-in-main-process Dashboard.
// Spawns dashboard-process.js as a child process (separate terminal window or detached),
// then pushes state updates via IPC — so blessed NEVER touches the CLI terminal.

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
      // `fork` gives us IPC for free (process.send / process.on('message'))
      // stdio: 'inherit' would share the terminal — we use 'ignore' + a new console
      // instead we open a new terminal window so blessed gets its own TTY
      this.child = fork(dashboardPath, [], {
        detached: false,
        // Give the child process its own stdio so blessed can own that TTY.
        // We try to open a new terminal window; if that fails, fall back to piped.
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
        // Surface blessed errors without polluting CLI stdout
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

  // Called by Kernel on its interval — collects state and sends to child
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
      // IPC failed — child probably died
      console.error(chalk.yellow('[Dashboard.render]'), err.message)
      this.ready = false
    }
  }

  // Send a log message to the dashboard log panel
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
