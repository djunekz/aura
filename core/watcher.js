import chokidar from 'chokidar'
import chalk from 'chalk'

const IGNORED_SEGMENTS = new Set(['node_modules', '.git', 'aura_backups'])

export function shouldIgnore(filepath) {
  return String(filepath).split(/[\\/]/).some(segment => IGNORED_SEGMENTS.has(segment))
}

class Watcher {
  constructor(kernel) {
    this.kernel = kernel
    this.watchers = []
    this._active = false
  }

  watchFolder(folder = process.cwd()) {
    if (this._active) {
      console.log(chalk.yellow('Watcher sudah aktif.'))
      return
    }

    console.log(chalk.cyan(`🔍 Watching folder: ${folder}`))

    const watcher = chokidar.watch(folder, {
      ignored: shouldIgnore,
      persistent: true,
      ignoreInitial: true,
    })

    watcher
      .on('add',    filepath => this.handleEvent('add', filepath))
      .on('change', filepath => this.handleEvent('change', filepath))
      .on('unlink', filepath => this.handleEvent('unlink', filepath))

    this.watchers.push(watcher)
    this._active = true
  }

  handleEvent(event, filepath) {
    console.log(chalk.yellow(`[EVENT] ${event.toUpperCase()}: ${filepath}`))

    if (this.kernel?.ai) {
      this.kernel.ai.trackFile(filepath)
    }

    if (event === 'change' && filepath.endsWith('.js')) {
      console.log(chalk.green('💡 JS file changed — pertimbangkan run test.'))
      this.kernel?.suggestCommand?.('run-test')
    }
  }

  stop() {
    if (!this._active) {
      console.log(chalk.yellow('Watcher tidak aktif.'))
      return
    }
    this.watchers.forEach(w => w.close())
    this.watchers = []
    this._active = false
    console.log(chalk.yellow('👁 Watcher stopped.'))
  }

  get active() {
    return this._active
  }
}

export default Watcher
