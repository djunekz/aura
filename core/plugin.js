import fs from 'fs'
import path from 'path'
import chalk from 'chalk'
import { fileURLToPath, pathToFileURL } from 'url'
import { dataPath } from './paths.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const MARKETPLACE_URL = 'https://raw.githubusercontent.com/djunekz/aura/main/marketplace/plugins.json'
const MAX_PLUGIN_BYTES = 1024 * 1024
const PLUGIN_FILENAME = /^[\w.-]+\.js$/

export function assertInstallableUrl(value) {
  let parsed
  try {
    parsed = new URL(value)
  } catch {
    throw new Error('URL tidak valid.')
  }
  if (parsed.protocol !== 'https:') {
    throw new Error('Hanya URL https yang diizinkan.')
  }
  const filename = path.basename(parsed.pathname)
  if (!PLUGIN_FILENAME.test(filename)) {
    throw new Error('URL harus mengarah ke file plugin berakhiran .js.')
  }
  return filename
}

class PluginManager {
  constructor(kernel) {
    this.kernel = kernel
    this.plugins = []
    this.builtinDir = path.join(__dirname, 'plugins')
    this.pluginsDir = dataPath('plugins')
  }

  async loadPlugins() {
    fs.mkdirSync(this.pluginsDir, { recursive: true })

    for (const dir of [this.pluginsDir, this.builtinDir]) {
      if (!fs.existsSync(dir)) continue
      const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'))

      for (const file of files) {
        try {
          const filePath = path.join(dir, file)
          const mod = await import(pathToFileURL(filePath).href)
          const plugin = mod.default
          if (!plugin) continue

          const id = plugin.name || file
          if (this.plugins.some(p => (p.name || p._filename) === id)) continue

          plugin._filename = file
          if (typeof plugin.init === 'function') plugin.init(this.kernel)
          this.plugins.push(plugin)
        } catch (err) {
          this.kernel?.logger?.warn(`Plugin ${file} gagal dimuat: ${err.message}`)
        }
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
      const filename = path.basename(pluginPath)
      if (!PLUGIN_FILENAME.test(filename)) {
        console.log(chalk.red('❌ File plugin harus berakhiran .js dan bernama sederhana.'))
        return
      }
      fs.mkdirSync(this.pluginsDir, { recursive: true })
      fs.copyFileSync(pluginPath, path.join(this.pluginsDir, filename))
      console.log(chalk.green(`✅ Plugin installed: ${filename}`))
      console.log(chalk.gray('   Restart aura untuk memuat plugin baru.'))
    } catch (err) {
      console.log(chalk.red(`❌ Install failed: ${err.message}`))
    }
  }

  async installPluginFromURL(url) {
    try {
      const filename = assertInstallableUrl(url)
      console.log(chalk.yellow('⚠️  Plugin berjalan dengan akses penuh ke sistem kamu. Install hanya dari sumber tepercaya.'))
      console.log(chalk.cyan(`⬇️  Downloading: ${url}`))
      const { default: axios } = await import('axios')
      const res = await axios.get(url, {
        responseType: 'text',
        timeout: 10000,
        maxContentLength: MAX_PLUGIN_BYTES,
        maxBodyLength: MAX_PLUGIN_BYTES,
      })
      fs.mkdirSync(this.pluginsDir, { recursive: true })
      fs.writeFileSync(path.join(this.pluginsDir, filename), res.data)
      console.log(chalk.green(`✅ Plugin disimpan: ${filename}`))
      console.log(chalk.gray('   Restart aura untuk memuat plugin baru.'))
    } catch (err) {
      console.log(chalk.red(`❌ Download failed: ${err.message}`))
    }
  }

  async _fetchMarketplace() {
    const { default: axios } = await import('axios')
    const res = await axios.get(MARKETPLACE_URL, { timeout: 5000 })
    return Array.isArray(res.data) ? res.data : (res.data.plugins || [])
  }

  async updatePlugin(name) {
    const plugin = this.plugins.find(p => (p.name || p._filename) === name)
    if (!plugin) {
      console.log(chalk.red(`Plugin "${name}" tidak ditemukan.`))
      return
    }

    try {
      const remote = (await this._fetchMarketplace()).find(p => p.name === plugin.name)
      if (!remote) {
        console.log(chalk.yellow(`Plugin "${name}" tidak ada di marketplace.`))
        return
      }
      if (remote.version === plugin.version) {
        console.log(chalk.green(`✅ "${name}" sudah versi terbaru (v${plugin.version}).`))
        return
      }
      console.log(chalk.cyan(`🔄 Update "${name}": v${plugin.version} → v${remote.version}`))
      await this.installPluginFromURL(remote.url)
    } catch (err) {
      console.log(chalk.red(`❌ Update gagal: ${err.message}`))
    }
  }

  async marketplaceList() {
    try {
      console.log(chalk.cyan('🛒 Mengambil daftar plugin dari marketplace...\n'))
      const plugins = await this._fetchMarketplace()

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
        console.log(chalk.gray(`    Install: marketplace install ${p.name}\n`))
      })
      console.log(chalk.blue('────────────────────────────────────────\n'))
    } catch (err) {
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
      const found = (await this._fetchMarketplace()).find(p => p.name === name)

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
