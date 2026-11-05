import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'

const SEMVER = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/
const UNRELEASED = '## [Unreleased]'
const LINK_SUFFIX = '...HEAD'

function assertVersion(version) {
  if (typeof version !== 'string' || !SEMVER.test(version)) {
    throw new Error(`Versi tidak valid: ${String(version)}`)
  }
  return version
}

function isSectionStart(line) {
  return line.startsWith('## [')
}

function isLinkReference(line) {
  return line.startsWith('[') && line.includes(']: http')
}

function findHeading(lines, matches) {
  return lines.findIndex(line => matches(line.trimEnd()))
}

function bodyAfter(lines, headingIndex) {
  const body = []
  for (let i = headingIndex + 1; i < lines.length; i++) {
    if (isSectionStart(lines[i]) || isLinkReference(lines[i])) break
    body.push(lines[i])
  }
  return body.join('\n').trim()
}

export function sectionBody(text, label) {
  const lines = text.split('\n')
  const heading = label === 'Unreleased' ? UNRELEASED : `## [${label}]`
  const index = findHeading(lines, line =>
    label === 'Unreleased' ? line === heading : line.startsWith(heading)
  )
  return index === -1 ? null : bodyAfter(lines, index)
}

export function promote(text, version, date) {
  assertVersion(version)
  const lines = text.split('\n')

  const unreleasedIndex = findHeading(lines, line => line === UNRELEASED)
  if (unreleasedIndex === -1) {
    throw new Error('Section "## [Unreleased]" tidak ditemukan di CHANGELOG.md')
  }

  if (!bodyAfter(lines, unreleasedIndex)) {
    throw new Error('Section [Unreleased] kosong. Tulis catatan perubahan sebelum rilis.')
  }

  const versionHeading = `## [${version}]`
  if (lines.some(line => line.startsWith(versionHeading))) {
    throw new Error(`Versi ${version} sudah ada di CHANGELOG.md`)
  }

  lines.splice(unreleasedIndex + 1, 0, '', `${versionHeading} - ${date}`)

  const linkIndex = lines.findIndex(line => line.startsWith('[Unreleased]: '))
  if (linkIndex !== -1) {
    const line = lines[linkIndex].trimEnd()
    const marker = '/compare/'
    const markerAt = line.indexOf(marker)
    if (markerAt !== -1 && line.endsWith(LINK_SUFFIX)) {
      const base = line.slice('[Unreleased]: '.length, markerAt)
      const previous = line.slice(markerAt + marker.length, line.length - LINK_SUFFIX.length)
      if (previous.startsWith('v')) {
        lines.splice(
          linkIndex,
          1,
          `[Unreleased]: ${base}/compare/v${version}${LINK_SUFFIX}`,
          `[${version}]: ${base}/compare/${previous}...v${version}`
        )
      }
    }
  }

  return lines.join('\n')
}

export function notesFor(text, version) {
  assertVersion(version)
  const body = sectionBody(text, version)
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
