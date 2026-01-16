const chokidar = require('chokidar');
const chalk = require('chalk');

class Watcher {
  constructor(kernel) {
    this.kernel = kernel; // Reference to main kernel
    this.watchers = [];
  }

  watchFolder(folder = process.cwd()) {
    console.log(chalk.cyan(`🔍 Watching folder: ${folder}`));

    const watcher = chokidar.watch(folder, {
      ignored: /node_modules|\.git/,
      persistent: true
    });

    watcher
      .on('add', path => this.handleEvent('add', path))
      .on('change', path => this.handleEvent('change', path))
      .on('unlink', path => this.handleEvent('unlink', path));

    this.watchers.push(watcher);
  }

  handleEvent(event, path) {
    console.log(chalk.yellow(`[EVENT] ${event.toUpperCase()}: ${path}`));
    
    // Trigger actions
    if (event === 'change' && path.endsWith('.js')) {
      console.log(chalk.green('💡 JS file changed! Suggest running test or lint...'));
      this.kernel.suggestCommand('run-test');
    }
  }
}

module.exports = Watcher;
