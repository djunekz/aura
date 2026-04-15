import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

export default {
  name: 'AutoBackup',
  version: '1.0.1',
  description: 'Backup otomatis file yang berubah ke folder aura_backups/',

  init(kernel) {
    console.log(chalk.green('💾 AutoBackup plugin initialized!'));

    const backupDir = path.join(process.cwd(), 'aura_backups');
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

    const oldHandler = kernel.watcher.handleEvent.bind(kernel.watcher);

    kernel.watcher.handleEvent = (event, filepath) => {
      if (event === 'change' && fs.existsSync(filepath)) {
        try {
          const filename = path.basename(filepath);
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const dest = path.join(backupDir, `${filename}.${timestamp}.bak`);
          fs.copyFileSync(filepath, dest);

          const msg = `💾 AutoBackup: ${filename} → ${path.basename(dest)}`;
          if (kernel?.dashboard?.log) {
            kernel.dashboard.log(msg);
          } else {
            console.log(chalk.green(msg));
          }
        } catch (err) {
          console.log(chalk.red(`❌ AutoBackup error: ${err.message}`));
        }
      }
      oldHandler(event, filepath);
    };
  }
};
