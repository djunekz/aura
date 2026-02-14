import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class World {
  constructor() {
    this.filePath = path.join(__dirname, 'world.json');
    this.state = {};
    this.loadWorld();
  }

  loadWorld() {
    if(fs.existsSync(this.filePath)){
      this.state = JSON.parse(fs.readFileSync(this.filePath,'utf-8'));
    } else {
      this.state = { users: {}, projects: {} };
      this.saveWorld();
    }
  }

  saveWorld() {
    fs.writeFileSync(this.filePath, JSON.stringify(this.state, null, 2));
  }

  updateUser(userId, data) {
    if(!this.state.users[userId]) this.state.users[userId] = {};
    Object.assign(this.state.users[userId], data);
    this.saveWorld();
  }

  getUser(userId) {
    return this.state.users[userId] || {};
  }

  updateProject(projectName, data) {
    if(!this.state.projects[projectName]) this.state.projects[projectName] = {};
    Object.assign(this.state.projects[projectName], data);
    this.saveWorld();
  }

  getProject(projectName) {
    return this.state.projects[projectName] || {};
  }
}

export default World;
