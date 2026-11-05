import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'

const SEMVER = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/
const SELF_RAW_PREFIX = 'https://raw.githubusercontent.com/djunekz/aura/main/'

export async function validateMarketplace(root) {
  const errors = []
  const indexPath = path.join(root, 'marketplace', 'plugins.json')

  let entries
  try {
    entries = JSON.parse(fs.readFileSync(indexPath, 'utf-8'))
  } catch (err) {
    return [`marketplace/plugins.json tidak bisa dibaca: ${err.message}`]
  }

  if (!Array.isArray(entries)) {
    return ['marketplace/plugins.json harus berupa array']
  }

  const seen = new Set()

  for (const [i, entry] of entries.entries()) {
    const label = entry && entry.name ? entry.name : `entri #${i}`

    for (const field of ['name', 'version', 'url', 'description']) {
      if (typeof entry?.[field] !== 'string' || entry[field].trim() === '') {
        errors.push(`${label}: field "${field}" wajib berupa string tidak kosong`)
      }
    }

    if (!entry || typeof entry.name !== 'string') continue

    if (seen.has(entry.name)) errors.push(`${label}: nama duplikat`)
    seen.add(entry.name)

    if (typeof entry.version === 'string' && !SEMVER.test(entry.version)) {
      errors.push(`${label}: versi "${entry.version}" bukan semver`)
    }

    if (typeof entry.url !== 'string') continue

    if (!entry.url.startsWith('https://')) {
      errors.push(`${label}: url harus https`)
      continue
    }

    if (!entry.url.startsWith(SELF_RAW_PREFIX)) continue

    const relative = entry.url.slice(SELF_RAW_PREFIX.length)
    const localFile = path.join(root, relative)

    if (!fs.existsSync(localFile)) {
      errors.push(`${label}: file ${relative} tidak ditemukan di repo`)
      continue
    }

    try {
      const mod = await import(pathToFileURL(localFile).href)
      const plugin = mod.default
      if (!plugin) {
        errors.push(`${label}: ${relative} tidak punya default export`)
        continue
      }
      if (plugin.name !== entry.name) {
        errors.push(`${label}: nama plugin di ${relative} adalah "${plugin.name}"`)
      }
      if (plugin.version !== entry.version) {
        errors.push(`${label}: versi marketplace ${entry.version} berbeda dari ${relative} (${plugin.version})`)
      }
    } catch (err) {
      errors.push(`${label}: gagal memuat ${relative}: ${err.message}`)
    }
  }

  return errors
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href

if (isMain) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
  const errors = await validateMarketplace(root)
  if (errors.length > 0) {
    errors.forEach(e => console.error(`x ${e}`))
    process.exit(1)
  }
  console.log('marketplace/plugins.json valid')
}
