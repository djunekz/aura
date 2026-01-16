// core/kernel.js
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const chalk = require('chalk');
const fuzzy = require('fuzzy');
const { exec } = require('child_process');

const Context = require('./context');
const Memory = require('./memory');
const Identity = require('./identity');
const Watcher = require('./watcher');
const NetworkWatcher = require('./network');
const PluginManager = require('./plugin');
const World = require('./world');
const Dashboard = require('./dashboard');
const Scheduler = require('./scheduler');
const AIEngine = require('./ai');

class Kernel {
  constructor() {
    // Core components
    this.context = new Context();
    this.memory = new Memory();
    this.identity = new Identity();
    this.watcher = new Watcher(this);
    this.networkWatcher = new NetworkWatcher(this);
    this.pluginManager = new PluginManager(this);
    this.pluginManager.loadPlugins();
    this.world = new World();
    this.dashboard = new Dashboard(this);

    // Automation & AI
    this.scheduler = new Scheduler(this);
    this.ai = new AIEngine(this);

    // Command system
    this.commandHistory = [];
    this.commands = [
      'status','context','memory','identity','exit','help',
      'watch on','watch off','network on','network off',
      'ask','plugin install','plugin install-url','plugin update',
      'plugin list','world status','world update',
      'scheduler add','scheduler stop','marketplace list','marketplace install'
    ];

    // Dashboard auto-refresh
    setInterval(()=>{
      try { this.dashboard.render(); }
      catch(err){ console.error(chalk.red('[Dashboard.render]'), err); }
    }, 2000);

    // Setup event-driven automation
    this.setupAutoActions();

    // Setup scheduled tasks
    this.setupAutoTasks();
  }

  // ===== CLI Interface =====
  startCLI() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: chalk.green('aura> '),
      completer: this.autoComplete.bind(this)
    });

    rl.prompt();

    rl.on('line', async (line) => {
      const input = line.trim();
      this.commandHistory.push(input);
      if(this.ai) this.ai.trackCommand(input);

      try {
        await this.handleCommand(input);
      } catch(e) {
        console.log(chalk.red('❌ Command failed: '+e.message));
      }

      rl.prompt();
    });
  }

  // ===== Handle Commands =====
  async handleCommand(input) {
    if(input.startsWith('ask ')){
      const question = input.slice(4);
      await this.aiHelper(question);
    }
    else if(input.startsWith('plugin install ')){
      const pluginPath = input.slice(15).trim();
      if(this.pluginManager) this.pluginManager.installPlugin(pluginPath);
    }
    else if(input.startsWith('plugin install-url ')){
      const url = input.slice(20).trim();
      if(this.pluginManager) await this.pluginManager.installPluginFromURL(url);
    }
    else if(input.startsWith('plugin update ')){
      const args = input.slice(14).split(' ');
      const name = args[0];
      const url = args[1] || null;
      if(this.pluginManager) await this.pluginManager.updatePlugin(name,url);
    }
    else if(input === 'marketplace list'){
      const plugins = require('../marketplace/plugins.json');
      plugins.forEach(p => console.log(`- ${p.name}: ${p.description} (URL: ${p.url})`));
    }
    else if(input.startsWith('marketplace install ')){
      const name = input.slice(20).trim();
      const plugins = require('../marketplace/plugins.json');
      const plugin = plugins.find(p => p.name.toLowerCase()===name.toLowerCase());
      if(plugin && this.pluginManager) await this.pluginManager.installPluginFromURL(plugin.url);
      else console.log(chalk.red('Plugin not found in marketplace!'));
    }
    else if(input.startsWith('world update ')){
      const args = input.slice(13).split(' ');
      const type = args[0];
      const key = args[1];
      const value = args.slice(2).join(' ');
      if(this.world){
        if(type==='user') this.world.updateUser(key,{lastAction:value});
        else if(type==='project') this.world.updateProject(key,{lastAction:value});
      }
      console.log(chalk.green(`World updated: ${type} ${key} -> ${value}`));
    }
    else if(input.startsWith('scheduler add ')){
      const args = input.slice(14).split(' ');
      const name = args[0];
      const interval = parseInt(args[1]);
      if(this.scheduler) this.scheduler.addTask(name, interval, async ()=>console.log(`Task ${name} executed.`));
    }
    else if(input==='scheduler stop'){
      if(this.scheduler) this.scheduler.stopAll();
    }
    else {
      switch(input){
        case 'status': this.showStatus(); break;
        case 'context': if(this.context) this.context.showContext(); break;
        case 'memory': if(this.memory) this.memory.showMemory(); break;
        case 'identity': if(this.identity) this.identity.showIdentity(); break;
        case 'watch on': if(this.watcher) this.watcher.watchFolder(); break;
        case 'watch off': console.log(chalk.yellow('Watcher stopped.')); break;
        case 'network on': if(this.networkWatcher) this.networkWatcher.start(); break;
        case 'network off': if(this.networkWatcher) this.networkWatcher.stop(); break;
        case 'world status': if(this.world) console.log(this.world.state); break;
        case 'help': console.log('Available commands:', this.commands.join(', ')); break;
        case 'exit': console.log(chalk.yellow('Goodbye!')); process.exit(0);
        default: console.log(chalk.red('Unknown command. Type "help"')); break;
      }
    }
  }

  // ===== Status & AI Helper =====
  showStatus() {
    console.log(chalk.blue.bold("AURA Kernel Status:"));
    console.log("Identity:", this.identity ? this.identity.getName() : 'Unknown');
    console.log("Current folder:", process.cwd());
    console.log("Memory keys:", this.memory ? Object.keys(this.memory.data) : []);
    console.log("Project type:", this.context ? this.context.projectType : 'Unknown');
    console.log("World users:", this.world ? Object.keys(this.world.state.users) : []);
    console.log("World projects:", this.world ? Object.keys(this.world.state.projects) : []);
  }

  async aiHelper(question){
    question = question.toLowerCase();
    console.log(chalk.cyan(`🤖 AI Helper analyzing: "${question}"`));

    if(question.includes('deploy')){
      if(this.networkWatcher && this.networkWatcher.online) console.log(chalk.green('💡 Suggestion: Network online. Running deployment...'));
      else console.log(chalk.yellow('💡 Network offline. Cannot deploy now.'));
    } else if(question.includes('backup')){
      console.log(chalk.green('💡 Suggestion: Run backup task or use AutoBackup plugin.'));
    } else {
      console.log(chalk.yellow('💡 AI Helper: I am not sure. Try context, memory, or world.'));
    }
  }

  // ===== Autocomplete =====
  autoComplete(line){
    const hits = fuzzy.filter(line, this.commands).map(el => el.string);
    return [hits.length ? hits : this.commands, line];
  }

  // ===== Event-driven Automation =====
  setupAutoActions(){
    if(!this.watcher) return;

    const oldHandler = this.watcher.handleEvent;
    this.watcher.handleEvent = (event, filepath)=>{
      if(this.dashboard) this.dashboard.log(`[EVENT] ${event.toUpperCase()}: ${filepath}`);
      if(this.ai) this.ai.trackFile(filepath);

      if(event==='change' && this.networkWatcher && this.networkWatcher.online){
        if(this.dashboard) this.dashboard.log(`💡 AutoDeploy suggestion for ${filepath}`);
        this.aiHelper(`deploy ${filepath}`);
      }

      if(oldHandler) oldHandler(event, filepath);
    };
  }

  // ===== Scheduled Tasks =====
  setupAutoTasks(){
    if(!this.scheduler) return;

    // Backup every 5 minutes
    this.scheduler.addTask("AutoBackup", 300, async ()=>{
      const backupPlugin = this.pluginManager ? this.pluginManager.plugins.find(p=>p.name==="AutoBackup") : null;
      if(backupPlugin && this.dashboard) this.dashboard.log("💾 AutoBackup executed by scheduler");
    });

    // AI suggestion every 3 minutes
    this.scheduler.addTask("AISuggestion", 180, async ()=>{
      if(this.ai) this.ai.suggestAction();
    });

    // Auto Git push every 10 minutes
    this.scheduler.addTask("AutoPush", 600, async ()=>{
      if(this.networkWatcher && this.networkWatcher.online){
        if(this.dashboard) this.dashboard.log("🚀 AutoPush: Pushing to GitHub...");
        await this.autoGitPush();
      }
    });
  }

  // ===== Auto Git Push =====
  async autoGitPush(){
    return new Promise((resolve,reject)=>{
      exec(`git add . && git commit -m "AutoDeploy: update files" && git push origin main`,
        (err, stdout, stderr)=>{
          if(err){
            if(this.dashboard) this.dashboard.log("❌ AutoPush failed: "+stderr);
            reject(err);
          } else {
            if(this.dashboard) this.dashboard.log("✅ AutoPush success");
            resolve(stdout);
          }
        });
    });
  }
}

module.exports = Kernel;
