const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

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

  // Add/update user state
  updateUser(userId, data) {
    if(!this.state.users[userId]) this.state.users[userId] = {};
    Object.assign(this.state.users[userId], data);
    this.saveWorld();
  }

  getUser(userId) {
    return this.state.users[userId] || {};
  }

  // Add/update project state
  updateProject(projectName, data) {
    if(!this.state.projects[projectName]) this.state.projects[projectName] = {};
    Object.assign(this.state.projects[projectName], data);
    this.saveWorld();
  }

  getProject(projectName) {
    return this.state.projects[projectName] || {};
  }
}

module.exports = World;
