const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const axios = require('axios');

class PluginManager {
  constructor(kernel) {
    this.kernel = kernel;
    this.plugins = [];
    this.pluginDir = path.join(__dirname, 'plugins');
    if(!fs.existsSync(this.pluginDir)) fs.mkdirSync(this.pluginDir);
  }

  // Load semua plugin lokal
  loadPlugins() {
    const files = fs.readdirSync(this.pluginDir).filter(f => f.endsWith('.js'));
    files.forEach(file => {
      try {
        const plugin = require(path.join(this.pluginDir, file));
        if(plugin.init) plugin.init(this.kernel);
        this.plugins.push(plugin);
        console.log(chalk.green(`🔌 Loaded plugin: ${file}`));
      } catch (err) {
        console.log(chalk.red(`❌ Failed to load plugin ${file}: ${err.message}`));
      }
    });
  }

  // Install plugin dari file lokal
  installPlugin(pluginPath) {
    try {
      const dest = path.join(this.pluginDir, path.basename(pluginPath));
      fs.copyFileSync(pluginPath, dest);
      console.log(chalk.cyan(`Plugin installed: ${path.basename(pluginPath)}`));
      this.loadPlugins();
    } catch (err) {
      console.log(chalk.red(`❌ Failed to install plugin: ${err.message}`));
    }
  }

  // Install plugin dari URL (Online Marketplace)
  async installPluginFromURL(url) {
    try {
      const name = path.basename(url);
      const dest = path.join(this.pluginDir, name);
      const response = await axios.get(url);
      fs.writeFileSync(dest, response.data);
      console.log(chalk.green(`Plugin ${name} installed from URL`));
      this.loadPlugins();
    } catch (err) {
      console.log(chalk.red(`❌ Failed to install plugin from URL: ${err.message}`));
    }
  }

  // Update plugin (re-download / reload)
  async updatePlugin(name, url=null) {
    try {
      const pluginPath = path.join(this.pluginDir, name);
      if(url){
        const response = await axios.get(url);
        fs.writeFileSync(pluginPath, response.data);
        console.log(chalk.green(`Plugin ${name} updated from URL`));
      }
      delete require.cache[require.resolve(pluginPath)];
      const plugin = require(pluginPath);
      if(plugin.init) plugin.init(this.kernel);
      console.log(chalk.green(`Plugin ${name} reloaded successfully`));
    } catch (err) {
      console.log(chalk.red(`❌ Failed to update plugin ${name}: ${err.message}`));
    }
  }

  // List plugin
  listPlugins() {
    console.log(chalk.yellow('🔌 Installed Plugins:'));
    this.plugins.forEach(p => console.log(`- ${p.name || 'Unnamed Plugin'}`));
  }
}

module.exports = PluginManager;
