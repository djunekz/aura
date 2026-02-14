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

class Kernel {
  constructor() {
    this.context = new Context()
    this.memory = new Memory()
    this.identity = new Identity()
    this.watcher = new Watcher(this)
    this.networkWatcher = new NetworkWatcher(this)
    this.pluginManager = new PluginManager(this)
    this.world = new World()
    this.scheduler = new Scheduler(this)
    this.ai = new AIEngine(this)

    this.commandHistory = []
    this._rl = null

    this.commands = [
      'status', 'context', 'memory', 'memory set', 'memory get', 'memory delete', 'memory clear',
      'identity', 'identity set',
      'exit', 'help',
      'watch on', 'watch off',
      'network on', 'network off',
      'ask',
      'plugin list', 'plugin install', 'plugin install-url', 'plugin update',
      'world status', 'world update',
      'scheduler add', 'scheduler stop',
      'marketplace list', 'marketplace install'
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
  }

  startCLI() {
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
      if (this.ai) this.ai.trackCommand(input)

      try {
        await this.handleCommand(input)
      } catch (e) {
        console.log(chalk.red('❌ Command failed: ' + e.message))
        // AI catat error untuk analisis
        if (this.ai) this.ai.trackError(e.message)
      }

      rl.prompt()
    })

    rl.on('close', () => { this.shutdown() })
  }

  async handleCommand(input) {
    const cmd = input.trim().toLowerCase()

    // ── AI ────────────────────────────────────────────────────────────────
    if (cmd.startsWith('ask ')) {
      await this.aiHelper(input.slice(4))
      return
    }

    // ── Identity ──────────────────────────────────────────────────────────
    if (cmd.startsWith('identity set ')) {
      const name = input.slice(13).trim()
      if (!name) { console.log(chalk.red('Usage: identity set <nama>')); return }
      this.identity.setName(name)
      console.log(chalk.green(`✅ Identity set to: ${name}`))
      return
    }

    // ── Memory ────────────────────────────────────────────────────────────
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

    // ── Plugin ────────────────────────────────────────────────────────────
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

    // ── Scheduler ─────────────────────────────────────────────────────────
    if (cmd.startsWith('scheduler add ')) {
      const taskDef = input.slice(14).trim()
      if (this.scheduler) this.scheduler.addTask(taskDef)
      return
    }

    if (cmd.startsWith('scheduler stop ')) {
      const taskId = input.slice(15).trim()
      if (this.scheduler) this.scheduler.stopTask(taskId)
      return
    }

    // ── World ─────────────────────────────────────────────────────────────
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

    // ── Marketplace ───────────────────────────────────────────────────────
    if (cmd.startsWith('marketplace install ')) {
      const pkgName = input.slice(20).trim()
      if (this.pluginManager) await this.pluginManager.marketplaceInstall(pkgName)
      return
    }

    // ── Switch ────────────────────────────────────────────────────────────
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
        if (this.watcher) this.watcher.stop?.()
        console.log(chalk.yellow('Watcher stopped.'))
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
        if (users.length === 0) {
          console.log(chalk.gray('    (kosong)'))
        } else {
          users.forEach(u => console.log(chalk.white(`    ${u}: `) + chalk.cyan(JSON.stringify(w.users[u]))))
        }
        console.log(chalk.yellow('  Projects:'))
        const projects = Object.keys(w.projects || {})
        if (projects.length === 0) {
          console.log(chalk.gray('    (kosong)'))
        } else {
          projects.forEach(p => console.log(chalk.white(`    ${p}: `) + chalk.cyan(JSON.stringify(w.projects[p]))))
        }
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

      case 'help':
        this.showHelp()
        break

      case 'exit':
        console.log(chalk.yellow('Goodbye!'))
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
    console.log(chalk.white('  Memory keys:'), this.memory ? Object.keys(this.memory.data || {}).join(', ') || '(empty)' : '(none)')
    console.log(chalk.white('  Project    :'), this.context?.projectType || 'Unknown')
    console.log(chalk.white('  Network    :'), this.networkWatcher?.online ? chalk.green('Online') : chalk.red('Offline'))
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
      'Watcher':     ['watch on', 'watch off'],
      'Network':     ['network on', 'network off'],
      'AI':          ['ask <question>'],
      'Plugins':     ['plugin list', 'plugin install <path>', 'plugin install-url <url>', 'plugin update <nama>'],
      'Marketplace': ['marketplace list', 'marketplace install <nama>'],
      'World':       ['world status', 'world update'],
      'Scheduler':   ['scheduler add <task>', 'scheduler stop <id>'],
    }
    for (const [group, cmds] of Object.entries(groups)) {
      console.log(chalk.yellow(`\n  ${group}:`))
      cmds.forEach(c => console.log(chalk.white(`    ${c}`)))
    }
    console.log(chalk.blue('\n────────────────────────────────────────\n'))
  }

  async aiHelper(question) {
    if (this.ai) {
      await this.ai.answer(question)
    }
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
  }

  setupAutoActions() {}
  setupAutoTasks() {}
}

export default Kernel
