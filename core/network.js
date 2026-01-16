const isOnline = require('is-online');
const chalk = require('chalk');

class NetworkWatcher {
  constructor(kernel) {
    this.kernel = kernel;
    this.online = false;
    this.interval = null;
  }

  start(intervalMs = 5000) {
    console.log(chalk.cyan('🌐 Network watcher started'));
    this.check();
    this.interval = setInterval(() => this.check(), intervalMs);
  }

  stop() {
    clearInterval(this.interval);
    console.log(chalk.yellow('Network watcher stopped'));
  }

  async check() {
    const status = await isOnline();
    if (status !== this.online) {
      this.online = status;
      if (status) {
        console.log(chalk.green('✅ Internet is ONLINE'));
        this.kernel.suggestCommand('online');
      } else {
        console.log(chalk.red('❌ Internet is OFFLINE'));
        this.kernel.suggestCommand('offline');
      }
    }
  }
}

module.exports = NetworkWatcher;
