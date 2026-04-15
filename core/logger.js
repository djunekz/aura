import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOG_FILE = path.join(__dirname, 'aura.log');
const MAX_LINES = 500;

class Logger {
  constructor() {
    this._buffer = [];
  }

  log(level, message) {
    const ts = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const entry = `[${ts}] [${level.toUpperCase()}] ${message}`;
    this._buffer.push(entry);

    try {
      fs.appendFileSync(LOG_FILE, entry + '\n');
    } catch {}

    this._trimIfNeeded();
  }

  cmd(msg)   { this.log('CMD',   msg); }
  info(msg)  { this.log('info',  msg); }
  warn(msg)  { this.log('warn',  msg); }
  error(msg) { this.log('error', msg); }

  showLogs(n = 20) {
    console.log(chalk.blue.bold(`\n── AURA Logs (terakhir ${n}) ────────────`));

    if (!fs.existsSync(LOG_FILE)) {
      console.log(chalk.gray('  (belum ada log)'));
      console.log(chalk.blue('────────────────────────────────────────\n'));
      return;
    }

    try {
      const lines = fs.readFileSync(LOG_FILE, 'utf-8').trim().split('\n');
      const recent = lines.slice(-n);

      if (recent.length === 0 || (recent.length === 1 && !recent[0])) {
        console.log(chalk.gray('  (belum ada log)'));
      } else {
        recent.forEach(line => {
          if (line.includes('[ERROR]')) {
            console.log(chalk.red(`  ${line}`));
          } else if (line.includes('[WARN]')) {
            console.log(chalk.yellow(`  ${line}`));
          } else {
            console.log(chalk.gray(`  ${line}`));
          }
        });
      }
    } catch (err) {
      console.log(chalk.red(`  Gagal membaca log: ${err.message}`));
    }

    console.log(chalk.blue('────────────────────────────────────────\n'));
  }

  clearLogs() {
    try {
      fs.writeFileSync(LOG_FILE, '');
      this._buffer = [];
      console.log(chalk.green('✅ Log dikosongkan.'));
    } catch (err) {
      console.log(chalk.red(`❌ Gagal menghapus log: ${err.message}`));
    }
  }

  _trimIfNeeded() {
    try {
      const content = fs.readFileSync(LOG_FILE, 'utf-8');
      const lines = content.split('\n');
      if (lines.length > MAX_LINES * 1.2) {
        const trimmed = lines.slice(-MAX_LINES).join('\n');
        fs.writeFileSync(LOG_FILE, trimmed + '\n');
      }
    } catch {}
  }
}

export default Logger;
