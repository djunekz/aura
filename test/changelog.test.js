import './helpers.js'
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { promote, notesFor, sectionBody } from '../scripts/changelog.js'

const sample = [
  '# Changelog',
  '',
  '## [Unreleased]',
  '',
  '### Added',
  '',
  '- New thing',
  '',
  '## [0.10.0] - 2026-01-01',
  '',
  '### Fixed',
  '',
  '- Old fix',
  '',
  '[Unreleased]: https://github.com/djunekz/aura/compare/v0.10.0...HEAD',
  '',
].join('\n')

describe('changelog tooling', () => {
  it('promotes Unreleased to a dated version and updates links', () => {
    const result = promote(sample, '0.11.0', '2026-12-01')
    assert.match(result, /## \[Unreleased\]\n\n## \[0\.11\.0\] - 2026-12-01\n\n### Added\n\n- New thing/)
    assert.match(result, /\[Unreleased\]: https:\/\/github\.com\/djunekz\/aura\/compare\/v0\.11\.0\.\.\.HEAD/)
    assert.match(result, /\[0\.11\.0\]: https:\/\/github\.com\/djunekz\/aura\/compare\/v0\.10\.0\.\.\.v0\.11\.0/)
  })

  it('refuses to promote an empty Unreleased section', () => {
    const empty = sample.replace('### Added\n\n- New thing\n\n', '')
    assert.throws(() => promote(empty, '0.11.0', '2026-12-01'), /kosong/)
  })

  it('refuses to promote when the version already exists', () => {
    assert.throws(() => promote(sample, '0.10.0', '2026-12-01'), /sudah ada/)
  })

  it('refuses to promote without an Unreleased heading', () => {
    assert.throws(() => promote('# Changelog\n', '1.0.0', '2026-12-01'), /tidak ditemukan/)
  })

  it('extracts release notes for a version', () => {
    const notes = notesFor(sample, '0.10.0')
    assert.match(notes, /Old fix/)
    assert.doesNotMatch(notes, /New thing/)
    assert.doesNotMatch(notes, /compare/)
  })

  it('throws for unknown versions', () => {
    assert.throws(() => notesFor(sample, '9.9.9'), /tidak ditemukan/)
  })

  it('reads the Unreleased body', () => {
    assert.match(sectionBody(sample, /^## \[Unreleased\][ \t]*$/m), /New thing/)
  })
})
