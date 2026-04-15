import { spawn } from 'child_process';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

class Runner {
  constructor(kernel) {
    this.kernel = kernel;
    this._activeProcess = null;
  }

  listAvailable() {
    const cwd = process.cwd();
    const pkgPath = path.join(cwd, 'package.json');

    console.log(chalk.blue.bold('\n── Available Scripts ───────────────────'));

    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
        const scripts = pkg.scripts || {};
        const names = Object.keys(scripts);
        if (names.length > 0) {
          console.log(chalk.yellow('  npm scripts:'));
          names.forEach(s => {
            console.log(chalk.green(`    npm run ${s}`) + chalk.gray(` → ${scripts[s]}`));
          });
        }
      } catch {}
    }

    if (fs.existsSync(path.join(cwd, 'Makefile'))) {
      console.log(chalk.yellow('  Makefile ditemukan — gunakan: run make <target>'));
    }

    if (fs.existsSync(path.join(cwd, 'requirements.txt')) ||
        fs.existsSync(path.join(cwd, 'pyproject.toml'))) {
      console.log(chalk.yellow('  Python project — gunakan: run python <file>'));
    }

    console.log(chalk.blue('────────────────────────────────────────\n'));
  }

  execute(commandStr) {
    if (!commandStr) {
      this.listAvailable();
      return;
    }

    const parts = commandStr.trim().split(/\s+/);
    const cmd = parts[0];
    const args = parts.slice(1);

    console.log(chalk.cyan(`▶ Menjalankan: ${commandStr}`));
    console.log(chalk.gray('─'.repeat(42)));

    const child = spawn(cmd, args, {
      cwd: process.cwd(),
      stdio: 'inherit',
      shell: true,
    });

    this._activeProcess = child;

    child.on('close', (code) => {
      this._activeProcess = null;
      if (code === 0) {
        console.log(chalk.green(`\n✅ Selesai (exit code 0)`));
      } else {
        console.log(chalk.red(`\n❌ Keluar dengan kode: ${code}`));
        if (this.kernel?.ai) this.kernel.ai.trackError(`Process exited with code ${code}: ${commandStr}`);
      }
      // Kembalikan prompt setelah proses selesai
      this.kernel?._rl?.prompt();
    });

    child.on('error', (err) => {
      console.log(chalk.red(`❌ Gagal menjalankan "${cmd}": ${err.message}`));
      this._activeProcess = null;
    });
  }

  kill() {
    if (this._activeProcess) {
      this._activeProcess.kill('SIGTERM');
      console.log(chalk.yellow(' Proses dihentikan.'));
      this._activeProcess = null;
    } else {
      console.log(chalk.gray('Tidak ada proses aktif.'));
    }
  }
}

export default Runner;
