import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'

const UNRELEASED_HEADING = /^## \[Unreleased\][ \t]*$/m
const NEXT_HEADING = /^## \[/m
const UNRELEASED_LINK = /^\[Unreleased\]: (.+)\/compare\/(v[\w.-]+)\.\.\.HEAD[ \t]*$/m

export function sectionBody(text, heading) {
  const start = text.search(heading)
  if (start === -1) return null
  const afterHeading = text.indexOf('\n', start) + 1
  const rest = text.slice(afterHeading)
  const next = rest.search(NEXT_HEADING)
  const body = next === -1 ? rest : rest.slice(0, next)
  const linkStart = body.search(/^\[[^\]]+\]: https?:\/\//m)
  return (linkStart === -1 ? body : body.slice(0, linkStart)).trim()
}

export function promote(text, version, date) {
  if (!UNRELEASED_HEADING.test(text)) {
    throw new Error('Section "## [Unreleased]" tidak ditemukan di CHANGELOG.md')
  }

  const body = sectionBody(text, UNRELEASED_HEADING)
  if (!body) {
    throw new Error('Section [Unreleased] kosong. Tulis catatan perubahan sebelum rilis.')
  }

  if (new RegExp(`^## \\[${version.replace(/\./g, '\\.')}\\]`, 'm').test(text)) {
    throw new Error(`Versi ${version} sudah ada di CHANGELOG.md`)
  }

  let result = text.replace(
    UNRELEASED_HEADING,
    `## [Unreleased]\n\n## [${version}] - ${date}`
  )

  const link = result.match(UNRELEASED_LINK)
  if (link) {
    const [line, base, previous] = link
    result = result.replace(
      line,
      `[Unreleased]: ${base}/compare/v${version}...HEAD\n[${version}]: ${base}/compare/${previous}...v${version}`
    )
  }

  return result
}

export function notesFor(text, version) {
  const heading = new RegExp(`^## \\[${version.replace(/\./g, '\\.')}\\].*$`, 'm')
  const body = sectionBody(text, heading)
  if (!body) throw new Error(`Versi ${version} tidak ditemukan di CHANGELOG.md`)
  return body
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href

if (isMain) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
  const file = path.join(root, 'CHANGELOG.md')
  const [command, versionArg] = process.argv.slice(2)

  try {
    const text = fs.readFileSync(file, 'utf-8')

    if (command === 'promote') {
      const version = versionArg || process.env.npm_package_version
      if (!version) throw new Error('Versi tidak diberikan')
      const date = new Date().toISOString().slice(0, 10)
      fs.writeFileSync(file, promote(text, version, date))
      console.log(`CHANGELOG.md: [Unreleased] dipromosikan ke ${version}`)
    } else if (command === 'notes') {
      if (!versionArg) throw new Error('Gunakan: node scripts/changelog.js notes <versi>')
      process.stdout.write(notesFor(text, versionArg) + '\n')
    } else {
      throw new Error('Perintah: promote [versi] | notes <versi>')
    }
  } catch (err) {
    console.error(`x ${err.message}`)
    process.exit(1)
  }
}
