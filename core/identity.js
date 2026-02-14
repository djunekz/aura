import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

export default Identity;
