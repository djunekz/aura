import fs from 'fs';
import path from 'path';

export default {
  name: "AutoBackup",
  init: function(kernel){
    console.log("💾 AutoBackup plugin initialized!");

    const backupDir = path.join(process.cwd(), 'aura_backups');
    if(!fs.existsSync(backupDir)) fs.mkdirSync(backupDir);

    const oldHandler = kernel.watcher.handleEvent;
    kernel.watcher.handleEvent = (event, filepath) => {
      if(event === 'change' && fs.existsSync(filepath)){
        const filename = path.basename(filepath);
        const dest = path.join(backupDir, filename + '.bak');
        fs.copyFileSync(filepath, dest);
        kernel.dashboard.log(`💾 AutoBackup: ${filename} backed up!`);
      }
      if(oldHandler) oldHandler(event, filepath);
    };
  }
};
