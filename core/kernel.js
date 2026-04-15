import { fileURLToPath } from 'url'
import { createRequire } from 'module'
import path from 'path'
import fs from 'fs'
import readline from 'readline'
import chalk from 'chalk'
import fuzzy from 'fuzzy'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const require = createRequire(import.meta.url)

import Context from './context.js'
import Memory from './memory.js'
import Identity from './identity.js'
import Watcher from './watcher.js'
import NetworkWatcher from './network.js'
import PluginManager from './plugin.js'
import World from './world.js'
import Scheduler from './scheduler.js'
import AIEngine from './ai.js'
import GitManager from './git.js'
import Runner from './runner.js'
import Logger from './logger.js'
import Config from './config.js'

class Kernel {
  constructor() {
    this.config = new Config()
    this.logger = new Logger()
    this.context = new Context()
    this.memory = new Memory()
    this.identity = new Identity()
    this.watcher = new Watcher(this)
    this.networkWatcher = new NetworkWatcher(this)
    this.pluginManager = new PluginManager(this)
    this.world = new World()
    this.scheduler = new Scheduler(this)
    this.ai = new AIEngine(this)
    this.git = new GitManager(this)
    this.runner = new Runner(this)

    this.commandHistory = []
    this._historyFile = path.join(__dirname, 'history.json')
    this._rl = null

    this._loadHistory()

    this.commands = [
      'status', 'context', 'memory', 'memory set', 'memory get', 'memory delete', 'memory clear',
      'identity', 'identity set',
      'exit', 'help',
      'watch on', 'watch off',
      'network on', 'network off',
      'ask',
      'plugin list', 'plugin install', 'plugin install-url', 'plugin update',
      'world status', 'world update', 'world user', 'world project',
      'scheduler add', 'scheduler stop', 'scheduler list',
      'marketplace list', 'marketplace install',
      'git status', 'git log', 'git add', 'git commit', 'git push', 'git pull', 'git autopush',
      'run', 'kill',
      'logs', 'logs clear',
      'history',
      'config', 'config init', 'config set',
    ]
  }

  async init() {
    const _log = console.log
    const _warn = console.warn
    const _info = console.info
    console.log = () => {}
    console.warn = () => {}
    console.info = () => {}
    try {
      await this.pluginManager.loadPlugins()
      await this.networkWatcher.start()
      this.setupAutoActions()
      this.setupAutoTasks()
    } finally {
      console.log = _log
      console.warn = _warn
      console.info = _info
    }

    if (this.config.get('autoWatch')) {
      this.watcher.watchFolder()
    }

    const cfgIdentity = this.config.get('identity')
    if (cfgIdentity && cfgIdentity !== 'Your Name') {
      this.identity.setName(cfgIdentity)
    }

    const tasks = this.config.get('autoScheduler') || []
    for (const t of tasks) {
      if (t.name && t.interval) {
        this.scheduler.addTask(`${t.name} ${t.interval}`)
      }
    }

    this.logger.info('AURA kernel started')
  }

  async startCLI() {
    await this.init()

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: chalk.green('aura> '),
      completer: this.autoComplete.bind(this)
    })

    this._rl = rl
    rl.prompt()

    rl.on('line', async (line) => {
      const input = line.trim()
      if (!input) { rl.prompt(); return }

      this.commandHistory.push(input)
      this._saveHistory()
      if (this.ai) this.ai.trackCommand(input)

      try {
        await this.handleCommand(input)
      } catch (e) {
        console.log(chalk.red('❌ Command failed: ' + e.message))
        if (this.ai) this.ai.trackError(e.message)
        this.logger.error(e.message)
      }

      rl.prompt()
    })

    rl.on('close', () => { this.shutdown() })
  }


  async handleCommand(input) {
    const cmd = input.trim().toLowerCase()

    if (cmd.startsWith('ask ')) {
      await this.aiHelper(input.slice(4))
      return
    }

    if (cmd.startsWith('identity set ')) {
      const name = input.slice(13).trim()
      if (!name) { console.log(chalk.red('Usage: identity set <nama>')); return }
      this.identity.setName(name)
      console.log(chalk.green(`✅ Identity set to: ${name}`))
      return
    }

    if (cmd.startsWith('memory set ')) {
      const parts = input.slice(11).trim().split(' ')
      const key = parts[0]
      const value = parts.slice(1).join(' ')
      if (!key || !value) { console.log(chalk.red('Usage: memory set <key> <value>')); return }
      this.memory.set(key, value)
      console.log(chalk.green(`✅ ${key} = ${value}`))
      return
    }

    if (cmd.startsWith('memory get ')) {
      const key = input.slice(11).trim()
      const val = this.memory.get(key)
      if (val === undefined) {
        console.log(chalk.yellow(`Key "${key}" tidak ditemukan.`))
      } else {
        console.log(chalk.green(`${key}`) + chalk.white(' = ') + chalk.cyan(JSON.stringify(val)))
      }
      return
    }

    if (cmd.startsWith('memory delete ')) {
      const key = input.slice(14).trim()
      const ok = this.memory.delete(key)
      console.log(ok
        ? chalk.green(`✅ Key "${key}" dihapus.`)
        : chalk.red(`Key "${key}" tidak ditemukan.`))
      return
    }

    if (cmd.startsWith('plugin install-url ')) {
      const url = input.slice(19).trim()
      if (this.pluginManager) await this.pluginManager.installPluginFromURL(url)
      return
    }

    if (cmd.startsWith('plugin install ')) {
      const pluginPath = input.slice(15).trim()
      if (this.pluginManager) this.pluginManager.installPlugin(pluginPath)
      return
    }

    if (cmd.startsWith('plugin update ')) {
      const pluginName = input.slice(14).trim()
      if (this.pluginManager) this.pluginManager.updatePlugin(pluginName)
      return
    }

    if (cmd.startsWith('scheduler add ')) {
      const taskDef = input.slice(14).trim()
      if (this.scheduler) this.scheduler.addTask(taskDef)
      return
    }

    if (cmd === 'scheduler stop') {
      if (this.scheduler) this.scheduler.stopAll()
      return
    }

    if (cmd.startsWith('scheduler stop ')) {
      const taskId = input.slice(15).trim()
      if (this.scheduler) this.scheduler.stopTask(taskId)
      return
    }

    if (cmd.startsWith('world user ')) {
      const parts = input.slice(11).trim().split(' ')
      const userId = parts[0], key = parts[1], value = parts.slice(2).join(' ')
      if (!userId || !key || !value) { console.log(chalk.red('Usage: world user <id> <key> <value>')); return }
      this.world.updateUser(userId, { [key]: value })
      console.log(chalk.green(`✅ User "${userId}" → ${key} = ${value}`))
      return
    }

    if (cmd.startsWith('world project ')) {
      const parts = input.slice(14).trim().split(' ')
      const projName = parts[0], key = parts[1], value = parts.slice(2).join(' ')
      if (!projName || !key || !value) { console.log(chalk.red('Usage: world project <nama> <key> <value>')); return }
      this.world.updateProject(projName, { [key]: value })
      console.log(chalk.green(`✅ Project "${projName}" → ${key} = ${value}`))
      return
    }

    if (cmd.startsWith('marketplace install ')) {
      const pkgName = input.slice(20).trim()
      if (this.pluginManager) await this.pluginManager.marketplaceInstall(pkgName)
      return
    }

    if (cmd === 'git status')        { await this.git.status(); return }
    if (cmd === 'git log')           { await this.git.log(); return }
    if (cmd.startsWith('git log '))  { await this.git.log(parseInt(input.slice(8)) || 5); return }
    if (cmd.startsWith('git add '))  { await this.git.add(input.slice(8).trim()); return }
    if (cmd === 'git add')           { await this.git.add('.'); return }
    if (cmd.startsWith('git commit ')){ await this.git.commit(input.slice(11).trim()); return }
    if (cmd === 'git commit')        { await this.git.commit(); return }
    if (cmd.startsWith('git push ')) { const parts = input.slice(9).trim().split(' '); await this.git.push(parts[0], parts[1]); return }
    if (cmd === 'git push')          { await this.git.push(); return }
    if (cmd.startsWith('git pull ')) { const parts = input.slice(9).trim().split(' '); await this.git.pull(parts[0], parts[1]); return }
    if (cmd === 'git pull')          { await this.git.pull(); return }
    if (cmd.startsWith('git autopush ')){ await this.git.autopush(input.slice(13).trim()); return }
    if (cmd === 'git autopush')      { await this.git.autopush(); return }

    if (cmd === 'run')               { this.runner.listAvailable(); return }
    if (cmd.startsWith('run '))      { this.runner.execute(input.slice(4).trim()); return }
    if (cmd === 'kill')              { this.runner.kill(); return }

    if (cmd === 'logs clear')        { this.logger.clearLogs(); return }
    if (cmd.startsWith('logs '))     { this.logger.showLogs(parseInt(input.slice(5)) || 20); return }

    if (cmd === 'config init')       { this.config.init(); return }
    if (cmd.startsWith('config set ')) {
      const parts = input.slice(11).trim().split(' ')
      const key = parts[0], value = parts.slice(1).join(' ')
      if (!key || !value) { console.log(chalk.red('Usage: config set <key> <value>')); return }
      try { this.config.set(key, JSON.parse(value)) }
      catch { this.config.set(key, value) }
      return
    }

    switch (cmd) {
      case 'status':
        this.showStatus()
        break

      case 'context':
        if (this.context) this.context.showContext()
        break

      case 'memory':
        if (this.memory) this.memory.showMemory()
        break

      case 'memory clear':
        this.memory.clear()
        console.log(chalk.green('✅ Memory dikosongkan.'))
        break

      case 'identity':
        if (this.identity) {
          this.identity.showIdentity()
          console.log(chalk.gray('  Tip: "identity set <nama>" untuk mengubah nama'))
        }
        break

      case 'watch on':
        if (this.watcher) this.watcher.watchFolder()
        break

      case 'watch off':
        if (this.watcher) this.watcher.stop()
        break

      case 'network on':
        if (this.networkWatcher) this.networkWatcher.start()
        break

      case 'network off':
        if (this.networkWatcher) this.networkWatcher.stop()
        break

      case 'world status': {
        const w = this.world.state
        console.log(chalk.blue.bold('\n── World Status ────────────────────────'))
        console.log(chalk.yellow('  Users:'))
        const users = Object.keys(w.users || {})
        if (users.length === 0) console.log(chalk.gray('    (kosong)'))
        else users.forEach(u => console.log(chalk.white(`    ${u}: `) + chalk.cyan(JSON.stringify(w.users[u]))))
        console.log(chalk.yellow('  Projects:'))
        const projects = Object.keys(w.projects || {})
        if (projects.length === 0) console.log(chalk.gray('    (kosong)'))
        else projects.forEach(p => console.log(chalk.white(`    ${p}: `) + chalk.cyan(JSON.stringify(w.projects[p]))))
        console.log(chalk.blue('────────────────────────────────────────\n'))
        break
      }

      case 'world update':
        console.log(chalk.yellow('Usage:'))
        console.log(chalk.white('  world user <id> <key> <value>'))
        console.log(chalk.white('  world project <nama> <key> <value>'))
        break

      case 'plugin list':
        if (this.pluginManager) this.pluginManager.listPlugins()
        break

      case 'marketplace list':
        if (this.pluginManager) await this.pluginManager.marketplaceList()
        break

      case 'scheduler list':
        if (this.scheduler) this.scheduler.listTasks()
        break

      case 'logs':
        this.logger.showLogs(20)
        break

      case 'history':
        this._showHistory()
        break

      case 'config':
        this.config.show()
        break

      case 'help':
        this.showHelp()
        break

      case 'exit':
        console.log(chalk.yellow('Goodbye!'))
        this.logger.info('AURA kernel stopped')
        this.shutdown()
        process.exit(0)
        break

      default: {
        const suggestions = fuzzy
          .filter(cmd, this.commands)
          .slice(0, 3)
          .map(el => el.string)

        if (suggestions.length > 0) {
          console.log(
            chalk.red('Unknown command.') +
            chalk.yellow(` Did you mean: ${suggestions.join(', ')}?`) +
            chalk.gray(' (type "help")')
          )
        } else {
          console.log(chalk.red('Unknown command. Type "help".'))
        }
      }
    }
  }


  showStatus() {
    console.log(chalk.blue.bold('\n── AURA Kernel Status ──────────────────'))
    console.log(chalk.white('  Identity   :'), this.identity?.getName() || 'Unknown')
    console.log(chalk.white('  Folder     :'), process.cwd())
    console.log(chalk.white('  Project    :'), chalk.cyan(this.context?.projectType || 'Unknown'))
    console.log(chalk.white('  Network    :'), this.networkWatcher?.online ? chalk.green('Online') : chalk.red('Offline'))
    console.log(chalk.white('  Watcher    :'), this.watcher?.active ? chalk.green('Active') : chalk.gray('Inactive'))
    console.log(chalk.white('  Plugins    :'), chalk.cyan(this.pluginManager?.plugins?.length || 0))
    console.log(chalk.white('  Tasks      :'), chalk.cyan(this.scheduler?.tasks?.length || 0))
    console.log(chalk.white('  Memory keys:'), chalk.cyan(this.memory ? Object.keys(this.memory.data || {}).join(', ') || '(empty)' : '(none)'))
    console.log(chalk.blue('────────────────────────────────────────\n'))
  }

  showHelp() {
    console.log(chalk.blue.bold('\n── Available Commands ──────────────────'))
    const groups = {
      'System': [
        'status', 'context', 'identity', 'identity set <nama>', 'help', 'exit'
      ],
      'Memory': [
        'memory                  (lihat semua)',
        'memory set <key> <val>  (simpan)',
        'memory get <key>        (ambil)',
        'memory delete <key>     (hapus)',
        'memory clear            (kosongkan semua)',
      ],
      'Git': [
        'git status', 'git log [n]',
        'git add [path]', 'git commit [pesan]',
        'git push [remote] [branch]', 'git pull [remote] [branch]',
        'git autopush [pesan]       (add+commit+push sekaligus)',
      ],
      'Runner': [
        'run                    (lihat script tersedia)',
        'run <perintah>         (contoh: run npm run build)',
        'kill                   (hentikan proses aktif)',
      ],
      'Watcher':     ['watch on', 'watch off'],
      'Network':     ['network on', 'network off'],
      'AI':          ['ask <pertanyaan>'],
      'Plugins':     ['plugin list', 'plugin install <path>', 'plugin install-url <url>', 'plugin update <nama>'],
      'Marketplace': ['marketplace list', 'marketplace install <nama>'],
      'World':       ['world status', 'world user <id> <key> <val>', 'world project <nama> <key> <val>'],
      'Scheduler':   ['scheduler list', 'scheduler add <nama> <detik>', 'scheduler stop (semua)', 'scheduler stop <id|nama>'],
      'Logs':        ['logs [n]', 'logs clear'],
      'Config':      ['config', 'config init', 'config set <key> <val>'],
      'History':     ['history'],
    }
    for (const [group, cmds] of Object.entries(groups)) {
      console.log(chalk.yellow(`\n  ${group}:`))
      cmds.forEach(c => console.log(chalk.white(`    ${c}`)))
    }
    console.log(chalk.blue('\n────────────────────────────────────────\n'))
  }


  _loadHistory() {
    if (fs.existsSync(this._historyFile)) {
      try {
        const data = JSON.parse(fs.readFileSync(this._historyFile, 'utf-8'))
        this.commandHistory = Array.isArray(data) ? data.slice(-200) : []
      } catch {
        this.commandHistory = []
      }
    }
  }

  _saveHistory() {
    try {
      const recent = this.commandHistory.slice(-200)
      fs.writeFileSync(this._historyFile, JSON.stringify(recent, null, 2))
    } catch {}
  }

  _showHistory() {
    const hist = this.commandHistory.slice(-30)
    console.log(chalk.blue.bold('\n── Command History (terakhir 30) ────────'))
    if (hist.length === 0) {
      console.log(chalk.gray('  (kosong)'))
    } else {
      hist.forEach((cmd, i) => {
        console.log(chalk.gray(`  ${String(i + 1).padStart(3)}.`) + chalk.white(` ${cmd}`))
      })
    }
    console.log(chalk.blue('────────────────────────────────────────\n'))
  }


  async aiHelper(question) {
    if (this.ai) await this.ai.answer(question)
  }

  autoComplete(line) {
    const hits = fuzzy.filter(line, this.commands).map(el => el.string)
    return [hits.length ? hits : this.commands, line]
  }

  shutdown() {
    if (this.ai) this.ai.destroy()
    if (this.scheduler) this.scheduler.stopAll?.()
    if (this.networkWatcher) this.networkWatcher.stop?.()
    if (this.watcher) this.watcher.stop?.()
    if (this.runner) this.runner.kill?.()
  }

  setupAutoActions() {}
  setupAutoTasks() {}
}

export default Kernel
