const blessed = require('blessed');
const contrib = require('blessed-contrib');
const chalk = require('chalk');

class Dashboard {
  constructor(kernel) {
    this.kernel = kernel;

    try {
      // Setup screen
      this.screen = blessed.screen({ smartCSR: true, title: 'AURA Dashboard' });

      // Grid layout
      this.grid = contrib.grid({ rows: 12, cols: 12, screen: this.screen });

      // Components
      this.logBox = this.grid.set(
        6, 0, 6, 12,
        blessed.log,
        {
          label: 'Logs',
          border: 'line',
          scrollbar: { ch: ' ', track: { bg: 'yellow' }, style: { inverse: true } },
          tags: true
        }
      );

      this.userBox = this.grid.set(0, 0, 6, 4, blessed.box, { label: 'User', border: 'line' });
      this.memoryBox = this.grid.set(0, 4, 6, 4, blessed.box, { label: 'Memory', border: 'line' });
      this.networkBox = this.grid.set(0, 8, 6, 4, blessed.box, { label: 'Network', border: 'line' });

      // Key bindings
      this.screen.key(['q', 'C-c'], () => process.exit(0));

      // Delay initial render supaya semua box siap
      process.nextTick(() => this.render());

    } catch (err) {
      console.error(chalk.yellow('[Dashboard.constructor] Blessed not supported, fallback to console-only'));

      // Fallback safe objects supaya tidak crash
      this.screen = null;
      this.grid = null;
      this.logBox = { log: console.log }; // fallback log
      this.userBox = { setContent: () => {} };
      this.memoryBox = { setContent: () => {} };
      this.networkBox = { setContent: () => {} };
    }
  }

  render() {
    try {
      const user = this.kernel && this.kernel.identity ? this.kernel.identity.getName() : 'Unknown';
      const memKeys = this.kernel && this.kernel.memory ? Object.keys(this.kernel.memory.data).join(', ') : 'empty';
      const networkStatus = this.kernel && this.kernel.networkWatcher && this.kernel.networkWatcher.online
        ? chalk.green('ONLINE')
        : chalk.red('OFFLINE');

      if (this.userBox) this.userBox.setContent(`Name: ${user}\nCommands: ${this.kernel ? this.kernel.commandHistory.length : 0}`);
      if (this.memoryBox) this.memoryBox.setContent(`Keys: ${memKeys}`);
      if (this.networkBox) this.networkBox.setContent(`Status: ${networkStatus}`);

      if (this.screen) this.screen.render();
    } catch (err) {
      console.error(chalk.red('[Dashboard.render] Error:'), err);
    }
  }

  log(message) {
    try {
      if (!this.logBox) {
        // fallback ke console supaya tidak crash
        console.log(chalk.yellow('[Dashboard.log] logBox not initialized:'), message);
        return;
      }

      // Convert non-string messages to string
      const msgStr = typeof message === 'string' ? message : JSON.stringify(message, null, 2);
      this.logBox.log(msgStr);

      if (this.screen) this.screen.render();
    } catch (err) {
      console.error(chalk.red('[Dashboard.log] Error:'), err);
    }
  }

  // Optional helper: force refresh semua box
  refreshAll() {
    this.render();
  }
}

module.exports = Dashboard;
