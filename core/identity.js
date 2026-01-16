const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

class Identity {
  constructor() {
    this.filePath = path.join(__dirname, 'identity.json');
    this.name = 'Unknown User';
    this.loadIdentity();
  }

  loadIdentity() {
    if (fs.existsSync(this.filePath)) {
      const data = JSON.parse(fs.readFileSync(this.filePath, 'utf-8'));
      this.name = data.name || 'Unknown User';
    }
  }

  showIdentity() {
    console.log(chalk.cyan(`User Identity: ${this.name}`));
  }

  getName() {
    return this.name;
  }

  setName(name) {
    this.name = name;
    fs.writeFileSync(this.filePath, JSON.stringify({name: this.name}, null, 2));
  }
}

module.exports = Identity;
