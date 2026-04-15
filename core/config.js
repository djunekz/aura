import fs from 'fs';
import path from 'path';
import chalk from 'chalk';


const DEFAULTS = {
  autoWatch: false,
  autoScheduler: [],
  identity: null,
  theme: 'default',
};

class Config {
  constructor() {
    this.configPath = path.join(process.cwd(), 'aura.config.json');
    this.data = { ...DEFAULTS };
    this.load();
  }

  load() {
    if (!fs.existsSync(this.configPath)) return;
    try {
      const raw = JSON.parse(fs.readFileSync(this.configPath, 'utf-8'));
      this.data = { ...DEFAULTS, ...raw };
      console.log(chalk.gray(`📋 Config dimuat: ${this.configPath}`));
    } catch (err) {
      console.log(chalk.yellow(`⚠️  aura.config.json tidak valid: ${err.message}`));
    }
  }

  get(key) {
    return this.data[key];
  }

  save() {
    try {
      fs.writeFileSync(this.configPath, JSON.stringify(this.data, null, 2));
      console.log(chalk.green(`✅ Config disimpan: ${this.configPath}`));
    } catch (err) {
      console.log(chalk.red(`❌ Gagal simpan config: ${err.message}`));
    }
  }

  set(key, value) {
    this.data[key] = value;
    this.save();
  }

  show() {
    console.log(chalk.blue.bold('\n── AURA Config ─────────────────────────'));
    console.log(chalk.gray(`  File: ${this.configPath}`));
    Object.entries(this.data).forEach(([k, v]) => {
      console.log(chalk.yellow(`  ${k}: `) + chalk.white(JSON.stringify(v)));
    });
    console.log(chalk.blue('────────────────────────────────────────\n'));
  }

  init() {
    if (fs.existsSync(this.configPath)) {
      console.log(chalk.yellow(`⚠️  aura.config.json sudah ada.`));
      return;
    }
    const template = {
      autoWatch: false,
      autoScheduler: [
        { name: "AutoBackup", interval: 300 },
      ],
      identity: "Your Name",
      theme: "default",
    };
    fs.writeFileSync(this.configPath, JSON.stringify(template, null, 2));
    console.log(chalk.green(`✅ aura.config.json dibuat di: ${this.configPath}`));
    console.log(chalk.gray('   Edit sesuai kebutuhan, lalu jalankan aura lagi.'));
  }
}

export default Config;
