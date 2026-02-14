import chokidar from 'chokidar';
import chalk from 'chalk';

class Watcher {
  constructor(kernel) {
    this.kernel = kernel;
    this.watchers = [];
  }

  watchFolder(folder = process.cwd()) {
    console.log(chalk.cyan(`🔍 Watching folder: ${folder}`));

    const watcher = chokidar.watch(folder, {
      ignored: /node_modules|\.git/,
      persistent: true
    });

    watcher
      .on('add', filepath => this.handleEvent('add', filepath))
      .on('change', filepath => this.handleEvent('change', filepath))
      .on('unlink', filepath => this.handleEvent('unlink', filepath));

    this.watchers.push(watcher);
  }

  handleEvent(event, filepath) {
    console.log(chalk.yellow(`[EVENT] ${event.toUpperCase()}: ${filepath}`));

    if (event === 'change' && filepath.endsWith('.js')) {
      console.log(chalk.green('💡 JS file changed!'));
      if(this.kernel && this.kernel.suggestCommand) {
        this.kernel.suggestCommand('run-test');
      }
    }
  }
}

export default Watcher;
