import { exec } from 'child_process';
import { promisify } from 'util';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

class GitManager {
  constructor(kernel) {
    this.kernel = kernel;
  }

  _isGitRepo() {
    return fs.existsSync(path.join(process.cwd(), '.git'));
  }

  async run(args) {
    if (!this._isGitRepo()) {
      console.log(chalk.red('❌ Folder ini bukan repositori Git.'));
      console.log(chalk.gray('   Init dulu: git init'));
      return;
    }
    try {
      const { stdout, stderr } = await execAsync(`git ${args}`, { cwd: process.cwd() });
      if (stdout) console.log(chalk.white(stdout.trimEnd()));
      if (stderr) console.log(chalk.gray(stderr.trimEnd()));
    } catch (err) {
      const msg = err.stderr || err.message || String(err);
      console.log(chalk.red(`❌ git ${args.split(' ')[0]} gagal:\n  ${msg.trim()}`));
      if (this.kernel?.ai) this.kernel.ai.trackError(msg);
    }
  }

  async status() {
    console.log(chalk.blue.bold('\n── Git Status ───────────────────────────'));
    await this.run('status -sb');
    console.log(chalk.blue('────────────────────────────────────────\n'));
  }

  async log(n = 5) {
    console.log(chalk.blue.bold('\n── Git Log ──────────────────────────────'));
    await this.run(`log --oneline -${n}`);
    console.log(chalk.blue('────────────────────────────────────────\n'));
  }

  async add(target = '.') {
    await this.run(`add ${target}`);
    console.log(chalk.green(`✅ git add ${target}`));
  }

  async commit(message) {
    if (!message) {
      const ts = new Date().toISOString().replace('T', ' ').slice(0, 16);
      message = `chore: auto-commit by AURA [${ts}]`;
    }
    await this.run(`commit -m "${message.replace(/"/g, '\\"')}"`);
  }

  async push(remote = 'origin', branch = '') {
    const br = branch || await this._currentBranch();
    console.log(chalk.cyan(`🚀 Pushing ke ${remote}/${br}...`));
    await this.run(`push ${remote} ${br}`);
  }

  async pull(remote = 'origin', branch = '') {
    const br = branch || await this._currentBranch();
    console.log(chalk.cyan(`⬇️  Pulling dari ${remote}/${br}...`));
    await this.run(`pull ${remote} ${br}`);
  }

  async _currentBranch() {
    try {
      const { stdout } = await execAsync('git rev-parse --abbrev-ref HEAD', { cwd: process.cwd() });
      return stdout.trim();
    } catch {
      return 'main';
    }
  }

  async autopush(message) {
    if (!this._isGitRepo()) {
      console.log(chalk.red('❌ Bukan repositori Git.'));
      return;
    }
    console.log(chalk.cyan('🔄 Auto-push: add → commit → push...'));
    await this.add('.');
    await this.commit(message);
    await this.push();
    console.log(chalk.green('✅ Auto-push selesai!'));
  }
}

export default GitManager;
