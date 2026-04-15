import chalk from 'chalk';

export default {
  name: 'AutoDeploy',
  version: '1.0.1',
  description: 'Saran deploy otomatis ketika file JS berubah dan network online',

  init(kernel) {
    console.log(chalk.green('🚀 AutoDeploy plugin initialized!'));

    const oldHandler = kernel.watcher.handleEvent.bind(kernel.watcher);

    kernel.watcher.handleEvent = (event, filepath) => {
      if (event === 'change' && filepath.endsWith('.js')) {
        if (kernel?.networkWatcher?.online) {
          const msg = `🚀 AutoDeploy: file berubah → ${filepath}. Pertimbangkan deploy.`;
          if (kernel?.dashboard?.log) {
            kernel.dashboard.log(msg);
          } else {
            console.log(chalk.cyan(msg));
          }

          kernel.aiHelper?.(`deploy ${filepath}`);
        }
      }
      oldHandler(event, filepath);
    };
  }
};
