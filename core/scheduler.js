const chalk = require('chalk');

class Scheduler {
  constructor(kernel) {
    this.kernel = kernel;
    this.tasks = [];
  }

  addTask(name, intervalSeconds, action) {
    if (!this.kernel || !this.kernel.dashboard) {
      console.error(chalk.red(`[Scheduler] Cannot schedule task "${name}" because dashboard is not ready.`));
      return;
    }

    const task = setInterval(async () => {
      try {
        await action();
        this.kernel.dashboard.log(`⏱ [Scheduler] Task "${name}" executed.`);
      } catch (e) {
        this.kernel.dashboard.log(`❌ [Scheduler] Task "${name}" failed: ${e.message}`);
      }
    }, intervalSeconds * 1000);

    this.tasks.push({ name, task });
    this.kernel.dashboard.log(`⏱ [Scheduler] Task "${name}" scheduled every ${intervalSeconds}s`);
  }

  stopAll() {
    this.tasks.forEach(t => clearInterval(t.task));
    this.tasks = [];

    if (this.kernel && this.kernel.dashboard) {
      this.kernel.dashboard.log("⏱ [Scheduler] All tasks stopped.");
    } else {
      console.log(chalk.yellow("[Scheduler] All tasks stopped, but dashboard not ready."));
    }
  }
}

module.exports = Scheduler;
