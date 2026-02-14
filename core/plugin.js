import fs from 'fs'
import path from 'path'
import chalk from 'chalk'
import { fileURLToPath, pathToFileURL } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const MARKETPLACE_URL = 'https://raw.githubusercontent.com/djunekz/aura/main/marketplace/plugins.json'

class PluginManager {
  constructor(kernel) {
    this.kernel = kernel
    this.plugins = []
    this.pluginsDir = path.join(__dirname, 'plugins')
  }

  async loadPlugins() {
    if (!fs.existsSync(this.pluginsDir)) {
      fs.mkdirSync(this.pluginsDir, { recursive: true })
      return
    }

    const files = fs.readdirSync(this.pluginsDir).filter(f => f.endsWith('.js'))

    for (const file of files) {
      try {
        const filePath = path.join(this.pluginsDir, file)
        const mod = await import(pathToFileURL(filePath).href)
        const plugin = mod.default
        if (!plugin) continue

        plugin._filename = file
        if (typeof plugin.init === 'function') plugin.init(this.kernel)
        this.plugins.push(plugin)
      } catch (err) {
        // silent — init phase
      }
    }
  }

  listPlugins() {
    if (this.plugins.length === 0) {
      console.log(chalk.yellow('Tidak ada plugin yang terinstall.'))
      return
    }
    console.log(chalk.blue.bold('\n── Installed Plugins ───────────────────'))
    this.plugins.forEach(p => {
      const name = p.name || p._filename || 'Unknown'
      const desc = p.description || ''
      const ver  = p.version ? chalk.gray(`v${p.version}`) : ''
      console.log(chalk.green(`  ✓ ${name} ${ver}`) + (desc ? chalk.gray(`\n    ${desc}`) : ''))
    })
    console.log(chalk.blue('────────────────────────────────────────\n'))
  }

  installPlugin(pluginPath) {
    try {
      if (!fs.existsSync(pluginPath)) {
        console.log(chalk.red(`❌ File tidak ditemukan: ${pluginPath}`))
        return
      }
      const dest = path.join(this.pluginsDir, path.basename(pluginPath))
      fs.copyFileSync(pluginPath, dest)
      console.log(chalk.green(`✅ Plugin installed: ${path.basename(pluginPath)}`))
      console.log(chalk.gray('   Restart aura untuk memuat plugin baru.'))
    } catch (err) {
      console.log(chalk.red(`❌ Install failed: ${err.message}`))
    }
  }

  async installPluginFromURL(url) {
    try {
      console.log(chalk.cyan(`⬇️  Downloading: ${url}`))
      const { default: axios } = await import('axios')
      const res = await axios.get(url, { responseType: 'text' })
      const filename = path.basename(new URL(url).pathname) || 'plugin-remote.js'
      const dest = path.join(this.pluginsDir, filename)
      fs.mkdirSync(this.pluginsDir, { recursive: true })
      fs.writeFileSync(dest, res.data)
      console.log(chalk.green(`✅ Plugin disimpan: ${filename}`))
      console.log(chalk.gray('   Restart aura untuk memuat plugin baru.'))
    } catch (err) {
      console.log(chalk.red(`❌ Download failed: ${err.message}`))
    }
  }

  updatePlugin(name) {
    const plugin = this.plugins.find(p => (p.name || p._filename) === name)
    if (!plugin) {
      console.log(chalk.red(`Plugin "${name}" tidak ditemukan.`))
      return
    }
    console.log(chalk.yellow(`🔄 Update "${name}" belum diimplementasi.`))
  }

  async marketplaceList() {
    try {
      console.log(chalk.cyan('🛒 Mengambil daftar plugin dari marketplace...\n'))
      const { default: axios } = await import('axios')
      const res = await axios.get(MARKETPLACE_URL, { timeout: 5000 })
      const plugins = Array.isArray(res.data) ? res.data : (res.data.plugins || [])

      if (plugins.length === 0) {
        console.log(chalk.yellow('Marketplace kosong.'))
        return
      }

      const installed = this.plugins.map(p => p.name || p._filename)

      console.log(chalk.blue.bold('── Marketplace ─────────────────────────'))
      plugins.forEach(p => {
        const isInstalled = installed.includes(p.name)
        const status = isInstalled ? chalk.green(' [installed]') : ''
        console.log(chalk.yellow(`  ${p.name}`) + chalk.gray(` v${p.version}`) + status)
        console.log(chalk.white(`    ${p.description}`))
        console.log(chalk.gray(`    Install: aura plugin install-url ${p.url}\n`))
      })
      console.log(chalk.blue('────────────────────────────────────────\n'))
    } catch (err) {
      // Fallback ke index lokal jika tidak ada internet
      const localIndex = path.resolve(__dirname, '..', 'marketplace', 'plugins.json')
      if (fs.existsSync(localIndex)) {
        try {
          const data = JSON.parse(fs.readFileSync(localIndex, 'utf-8'))
          const plugins = Array.isArray(data) ? data : (data.plugins || [])
          console.log(chalk.yellow('⚠️  Offline — menampilkan marketplace lokal:\n'))
          console.log(chalk.blue.bold('── Marketplace (lokal) ─────────────────'))
          plugins.forEach(p => {
            console.log(chalk.yellow(`  ${p.name}`) + chalk.gray(` v${p.version}`))
            console.log(chalk.white(`    ${p.description}\n`))
          })
          console.log(chalk.blue('────────────────────────────────────────\n'))
          return
        } catch {}
      }
      console.log(chalk.red(`❌ Marketplace tidak tersedia: ${err.message}`))
    }
  }

  async marketplaceInstall(name) {
    try {
      console.log(chalk.cyan(`🛒 Mencari "${name}" di marketplace...`))
      const { default: axios } = await import('axios')
      const res = await axios.get(MARKETPLACE_URL, { timeout: 5000 })
      const plugins = Array.isArray(res.data) ? res.data : (res.data.plugins || [])
      const found = plugins.find(p => p.name === name)

      if (!found) {
        console.log(chalk.red(`❌ Plugin "${name}" tidak ditemukan di marketplace.`))
        console.log(chalk.gray('   Cek daftar plugin: marketplace list'))
        return
      }

      await this.installPluginFromURL(found.url)
    } catch (err) {
      console.log(chalk.red(`❌ Marketplace install gagal: ${err.message}`))
    }
  }
}

export default PluginManager
