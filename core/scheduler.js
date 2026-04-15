import chalk from 'chalk';

class Scheduler {
  constructor(kernel) {
    this.kernel = kernel;
    this.tasks = [];
    this._nextId = 1;
  }

  addTask(nameOrDef, intervalSeconds, action) {
    let name, interval, fn;

    if (typeof intervalSeconds === 'undefined') {
      const parts = String(nameOrDef).trim().split(/\s+/);
      name = parts[0];
      interval = parseInt(parts[1], 10);
      fn = null;
    } else {
      name = nameOrDef;
      interval = intervalSeconds;
      fn = action || null;
    }

    if (!name) {
      console.log(chalk.red('Usage: scheduler add <nama> <interval_detik>'));
      return;
    }

    if (!interval || isNaN(interval) || interval <= 0) {
      console.log(chalk.red(`❌ Interval tidak valid untuk task "${name}". Gunakan angka detik positif.`));
      return;
    }

    const id = this._nextId++;
    const log = (msg) => {
      if (this.kernel?.dashboard?.log) {
        this.kernel.dashboard.log(msg);
      } else {
        console.log(chalk.gray(msg));
      }
    };

    const timer = setInterval(async () => {
      try {
        if (typeof fn === 'function') await fn();
        else log(`⏱ [Scheduler] Task "${name}" tick.`);
      } catch (e) {
        log(`❌ [Scheduler] Task "${name}" error: ${e.message}`);
      }
    }, interval * 1000);

    this.tasks.push({ id, name, interval, timer });
    console.log(chalk.green(`✅ Scheduler: "${name}" aktif setiap ${interval}s (ID: ${id})`));
  }

  stopTask(idOrName) {
    const target = this.tasks.find(
      t => String(t.id) === String(idOrName) || t.name === idOrName
    );

    if (!target) {
      console.log(chalk.red(`❌ Task "${idOrName}" tidak ditemukan.`));
      console.log(chalk.gray(`   Task aktif: ${this.tasks.map(t => `${t.id}:${t.name}`).join(', ') || 'tidak ada'}`));
      return;
    }

    clearInterval(target.timer);
    this.tasks = this.tasks.filter(t => t.id !== target.id);
    console.log(chalk.green(`✅ Task "${target.name}" (ID: ${target.id}) dihentikan.`));
  }

  listTasks() {
    if (this.tasks.length === 0) {
      console.log(chalk.yellow('Tidak ada task scheduler aktif.'));
      return;
    }
    console.log(chalk.blue.bold('\n── Scheduler Tasks ─────────────────────'));
    this.tasks.forEach(t => {
      console.log(chalk.green(`  [${t.id}] ${t.name}`) + chalk.gray(` — setiap ${t.interval}s`));
    });
    console.log(chalk.blue('────────────────────────────────────────\n'));
  }

  stopAll() {
    this.tasks.forEach(t => clearInterval(t.timer));
    this.tasks = [];
    if (this.kernel?.dashboard?.log) {
      this.kernel.dashboard.log('⏱ [Scheduler] All tasks stopped.');
    } else {
      console.log(chalk.yellow('[Scheduler] All tasks stopped.'));
    }
  }
}

export default Scheduler;
