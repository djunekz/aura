import isOnline from 'is-online'
import chalk from 'chalk'

class NetworkWatcher {
  constructor(kernel) {
    this.kernel = kernel
    this.online = false
    this.interval = null
  }

  start(intervalMs = 5000) {
    if (this.interval) {
      console.log(chalk.yellow('Network watcher sudah aktif.'))
      return
    }
    console.log(chalk.cyan('🌐 Network watcher started'))
    this.check()
    this.interval = setInterval(() => this.check(), intervalMs)
    this.interval.unref?.()
  }

  stop() {
    if (!this.interval) return
    clearInterval(this.interval)
    this.interval = null
    console.log(chalk.yellow('Network watcher stopped'))
  }

  async check() {
    let status
    try {
      status = await isOnline()
    } catch {
      status = false
    }
    if (status !== this.online) {
      this.online = status
      if (status) {
        console.log(chalk.green('✅ Internet is ONLINE'))
        this.kernel?.suggestCommand?.('online')
      } else {
        console.log(chalk.red('❌ Internet is OFFLINE'))
        this.kernel?.suggestCommand?.('offline')
      }
    }
  }
}

export default NetworkWatcher
