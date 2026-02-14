import chalk from 'chalk'
import fs from 'fs'
import path from 'path'

// ── Knowledge base lokal ───────────────────────────────────────────────────
// Pola pertanyaan → handler. Tidak butuh API, semua analisis dari state kernel.

const ERROR_PATTERNS = [
  { pattern: /cannot find module/i,       fix: 'Jalankan: npm install' },
  { pattern: /enoent/i,                   fix: 'File tidak ditemukan. Cek path-nya.' },
  { pattern: /eacces|permission denied/i, fix: 'Coba jalankan dengan sudo atau cek permission file.' },
  { pattern: /syntax error/i,             fix: 'Ada syntax error di kode. Cek baris yang disebutkan.' },
  { pattern: /network|econnrefused/i,     fix: 'Koneksi gagal. Cek network dengan: network on' },
  { pattern: /port.*in use|eaddrinuse/i,  fix: 'Port sudah dipakai. Ganti port atau kill prosesnya.' },
  { pattern: /heap out of memory/i,       fix: 'Memory habis. Jalankan: node --max-old-space-size=4096' },
  { pattern: /unexpected token/i,         fix: 'Syntax tidak valid. Cek tanda kurung/koma yang hilang.' },
  { pattern: /is not a function/i,        fix: 'Method tidak ada. Cek nama fungsi dan apakah module-nya ter-import.' },
  { pattern: /undefined.*property/i,     fix: 'Mengakses property dari nilai undefined. Tambahkan null check (?.).' },
]

const COMMAND_SUGGESTIONS = {
  deploy:      ['network on', 'watch on', 'status'],
  backup:      ['watch on', 'plugin install-url <url>'],
  memory:      ['memory set <key> <val>', 'memory get <key>', 'memory clear'],
  plugin:      ['plugin list', 'marketplace list', 'plugin install <path>'],
  error:       ['status', 'context', 'memory'],
  project:     ['context', 'world status', 'status'],
  network:     ['network on', 'network off', 'status'],
  scheduler:   ['scheduler add <task>', 'scheduler stop <id>'],
}

class AIEngine {
  constructor(kernel) {
    this.kernel = kernel
    this.usageStats = {}      // command → count
    this.fileStats = {}       // file → count
    this.errorLog = []        // { time, message, fix }
    this.sessionStart = Date.now()
    this._suggestionInterval = null

    // Auto-saran setiap 5 menit
    this._suggestionInterval = setInterval(() => {
      this._autoSuggest()
    }, 5 * 60 * 1000)
  }

  // ── Tracking ───────────────────────────────────────────────────────────

  trackCommand(command) {
    if (!this.usageStats[command]) this.usageStats[command] = 0
    this.usageStats[command]++
  }

  trackFile(file) {
    if (!this.fileStats[file]) this.fileStats[file] = 0
    this.fileStats[file]++
  }

  trackError(errorMessage) {
    const match = ERROR_PATTERNS.find(p => p.pattern.test(errorMessage))
    const entry = {
      time: new Date().toLocaleTimeString(),
      message: errorMessage.slice(0, 120),
      fix: match?.fix || 'Tidak ada saran spesifik. Cek log lebih lanjut.'
    }
    this.errorLog.push(entry)
    if (this.errorLog.length > 50) this.errorLog.shift()
    return entry.fix
  }

  // ── Main: jawab pertanyaan bebas ───────────────────────────────────────

  async answer(question) {
    const q = question.toLowerCase().trim()
    const kernel = this.kernel

    console.log(chalk.cyan(`\n🤖 AURA AI menganalisis: "${question}"`))
    console.log(chalk.gray('─'.repeat(42)))

    // ── Error detection ──────────────────────────────────────────────────
    if (q.includes('error') || q.includes('gagal') || q.includes('failed')) {
      const lastErrors = this.errorLog.slice(-3)
      if (lastErrors.length > 0) {
        console.log(chalk.yellow('🔍 Error terakhir yang terdeteksi:'))
        lastErrors.forEach(e => {
          console.log(chalk.red(`  [${e.time}] ${e.message}`))
          console.log(chalk.green(`  💡 Solusi: ${e.fix}\n`))
        })
      } else {
        // Coba deteksi dari pesan pertanyaan langsung
        const fix = this.trackError(question)
        console.log(chalk.green(`💡 Kemungkinan solusi: ${fix}`))
      }
      return
    }

    // ── Deploy ───────────────────────────────────────────────────────────
    if (q.includes('deploy') || q.includes('publish') || q.includes('upload')) {
      const online = kernel?.networkWatcher?.online
      console.log(chalk.yellow('🚀 Analisis deploy:'))
      console.log(online
        ? chalk.green('  ✓ Network: ONLINE — siap deploy')
        : chalk.red('  ✗ Network: OFFLINE — tidak bisa deploy sekarang'))

      const ctx = kernel?.context?.projectType
      if (ctx) console.log(chalk.white(`  ✓ Project type: ${ctx}`))

      const hasAutoDeploy = kernel?.pluginManager?.plugins?.find(p => p.name === 'AutoDeploy')
      console.log(hasAutoDeploy
        ? chalk.green('  ✓ Plugin AutoDeploy: aktif')
        : chalk.yellow('  ! Plugin AutoDeploy: tidak aktif (marketplace install AutoDeploy)'))

      this._printSuggestions('deploy')
      return
    }

    // ── Backup ───────────────────────────────────────────────────────────
    if (q.includes('backup') || q.includes('simpan') || q.includes('save')) {
      console.log(chalk.yellow('💾 Analisis backup:'))
      const hasBackup = kernel?.pluginManager?.plugins?.find(p => p.name === 'AutoBackup')
      console.log(hasBackup
        ? chalk.green('  ✓ Plugin AutoBackup: aktif')
        : chalk.yellow('  ! Plugin AutoBackup: tidak aktif'))

      const topFiles = this._topFiles(3)
      if (topFiles.length > 0) {
        console.log(chalk.white('  File paling sering diakses:'))
        topFiles.forEach(f => console.log(chalk.cyan(`    - ${f.name} (${f.count}x)`)))
      }

      this._printSuggestions('backup')
      return
    }

    // ── Memory ───────────────────────────────────────────────────────────
    if (q.includes('memory') || q.includes('ingat') || q.includes('simpan data')) {
      console.log(chalk.yellow('🧠 Status memory:'))
      if (kernel?.memory) {
        const keys = Object.keys(kernel.memory.data || {})
        if (keys.length === 0) {
          console.log(chalk.gray('  Memory kosong.'))
        } else {
          keys.forEach(k => console.log(chalk.white(`  ${k}: `) + chalk.cyan(JSON.stringify(kernel.memory.data[k]))))
        }
      }
      this._printSuggestions('memory')
      return
    }

    // ── Network ──────────────────────────────────────────────────────────
    if (q.includes('network') || q.includes('internet') || q.includes('online') || q.includes('koneksi')) {
      const online = kernel?.networkWatcher?.online
      console.log(online
        ? chalk.green('🌐 Internet: ONLINE')
        : chalk.red('🌐 Internet: OFFLINE'))
      this._printSuggestions('network')
      return
    }

    // ── Status project ───────────────────────────────────────────────────
    if (q.includes('project') || q.includes('status') || q.includes('apa') || q.includes('info')) {
      console.log(chalk.yellow('📁 Info project saat ini:'))
      console.log(chalk.white('  Folder  : ') + chalk.cyan(process.cwd()))
      console.log(chalk.white('  Type    : ') + chalk.cyan(kernel?.context?.projectType || 'Unknown'))
      console.log(chalk.white('  Network : ') + (kernel?.networkWatcher?.online ? chalk.green('Online') : chalk.red('Offline')))
      console.log(chalk.white('  Plugins : ') + chalk.cyan(kernel?.pluginManager?.plugins?.length || 0))
      console.log(chalk.white('  Commands: ') + chalk.cyan(kernel?.commandHistory?.length || 0) + chalk.gray(' sejak start'))

      // Top commands
      const topCmds = this._topCommands(3)
      if (topCmds.length > 0) {
        console.log(chalk.white('  Command favorit:'))
        topCmds.forEach(c => console.log(chalk.gray(`    ${c.name} (${c.count}x)`)))
      }
      return
    }

    // ── Plugin ───────────────────────────────────────────────────────────
    if (q.includes('plugin')) {
      const plugins = kernel?.pluginManager?.plugins || []
      console.log(chalk.yellow(`🔌 ${plugins.length} plugin aktif:`))
      if (plugins.length === 0) {
        console.log(chalk.gray('  Tidak ada plugin. Coba: marketplace list'))
      } else {
        plugins.forEach(p => console.log(chalk.white(`  - ${p.name || p._filename}`)))
      }
      this._printSuggestions('plugin')
      return
    }

    // ── Saran umum ────────────────────────────────────────────────────────
    console.log(chalk.yellow('💡 Tidak ada analisis spesifik untuk pertanyaan itu.'))
    console.log(chalk.white('\nTopik yang bisa saya analisis:'))
    const topics = ['deploy', 'backup', 'error', 'memory', 'network', 'project', 'plugin']
    topics.forEach(t => console.log(chalk.cyan(`  ask ${t}`)))

    // Saran berdasarkan history
    const topCmds = this._topCommands(2)
    if (topCmds.length > 0) {
      console.log(chalk.gray(`\nBerdasarkan history kamu, coba: ${topCmds.map(c => c.name).join(', ')}`))
    }

    console.log('')
  }

  // ── Auto-suggest (background) ──────────────────────────────────────────

  _autoSuggest() {
    const kernel = this.kernel
    const suggestions = []

    // Cek file yang sering diakses tapi belum di-backup
    const topFiles = this._topFiles(3)
    const hasBackup = kernel?.pluginManager?.plugins?.find(p => p.name === 'AutoBackup')
    if (topFiles.length > 0 && !hasBackup) {
      suggestions.push(`💾 File aktif terdeteksi (${topFiles[0]?.name}). Pertimbangkan aktifkan AutoBackup.`)
    }

    // Cek network tapi AutoDeploy belum aktif
    const online = kernel?.networkWatcher?.online
    const hasAutoDeploy = kernel?.pluginManager?.plugins?.find(p => p.name === 'AutoDeploy')
    if (online && !hasAutoDeploy) {
      suggestions.push('🚀 Network online. AutoDeploy belum aktif — ketik: marketplace install AutoDeploy')
    }

    // Cek memory kosong padahal sudah banyak command
    const cmdCount = kernel?.commandHistory?.length || 0
    const memKeys = Object.keys(kernel?.memory?.data || {}).length
    if (cmdCount > 20 && memKeys === 0) {
      suggestions.push('🧠 Sudah banyak aktivitas tapi memory kosong. Simpan info penting dengan: memory set <key> <val>')
    }

    if (suggestions.length > 0) {
      console.log(chalk.magenta('\n🤖 AURA AI Suggestion:'))
      suggestions.forEach(s => console.log(chalk.yellow(`  → ${s}`)))
      console.log('')
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────

  _topCommands(n = 3) {
    return Object.entries(this.usageStats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([name, count]) => ({ name, count }))
  }

  _topFiles(n = 3) {
    return Object.entries(this.fileStats)
      .filter(([k]) => /\.(js|ts|py|json|txt|md)$/.test(k))
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([name, count]) => ({ name, count }))
  }

  _printSuggestions(topic) {
    const cmds = COMMAND_SUGGESTIONS[topic]
    if (!cmds) return
    console.log(chalk.gray('\n  Command yang relevan:'))
    cmds.forEach(c => console.log(chalk.cyan(`    ${c}`)))
    console.log('')
  }

  destroy() {
    if (this._suggestionInterval) clearInterval(this._suggestionInterval)
  }
}

export default AIEngine
