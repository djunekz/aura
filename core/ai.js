const chalk = require('chalk');

class AIEngine {
  constructor(kernel){
    this.kernel = kernel;
    this.memory = kernel.memory;
    this.usageStats = {}; // track commands & file usage
  }

  trackCommand(command){
    if(!this.usageStats[command]) this.usageStats[command] = 0;
    this.usageStats[command]++;
  }

  trackFile(file){
    if(!this.usageStats[file]) this.usageStats[file] = 0;
    this.usageStats[file]++;
  }

  suggestAction(){
    const frequentFiles = Object.entries(this.usageStats)
      .filter(([k,v]) => k.endsWith('.js') || k.endsWith('.txt'))
      .sort((a,b)=>b[1]-a[1])
      .map(f=>f[0])
      .slice(0,3);

    if(frequentFiles.length){
      this.kernel.dashboard.log(chalk.magenta(`🤖 AI Suggestion: Consider backup/deploy for frequently edited files: ${frequentFiles.join(', ')}`));
    }
  }
}

module.exports = AIEngine;
