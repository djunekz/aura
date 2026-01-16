const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

class Context {
  constructor() {
    this.projectType = null;
    this.detectProject();
  }

  detectProject() {
    const cwd = process.cwd();
    if (fs.existsSync(path.join(cwd, 'package.json'))) {
      this.projectType = 'Node.js Project';
    } else if (fs.existsSync(path.join(cwd, 'requirements.txt'))) {
      this.projectType = 'Python Project';
    } else {
      this.projectType = 'Unknown';
    }
  }

  showContext() {
    this.detectProject();
    console.log(chalk.magenta(`Current Project Type: ${this.projectType}`));
    console.log(chalk.magenta(`Current Folder: ${process.cwd()}`));
  }
}

module.exports = Context;
