const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

class Memory {
  constructor() {
    this.filePath = path.join(__dirname, 'memory.json');
    this.data = {};

    this.loadMemory();
  }

  loadMemory() {
    if (fs.existsSync(this.filePath)) {
      this.data = JSON.parse(fs.readFileSync(this.filePath, 'utf-8'));
    }
  }

  saveMemory() {
    fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2));
  }

  showMemory() {
    console.log(chalk.yellow("Memory:"));
    console.log(this.data);
  }

  set(key, value) {
    this.data[key] = value;
    this.saveMemory();
  }

  get(key) {
    return this.data[key];
  }
}

module.exports = Memory;
