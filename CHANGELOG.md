# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `aura --version` and `aura --help` command line options.
- `AURA_HOME` environment variable to choose where state is stored.
- `plugin update <name>` now works: it compares the installed version with the marketplace and reinstalls when they differ.
- Plugins installed by the user are loaded from `~/.aura/plugins`. A user plugin overrides a bundled plugin with the same name.
- Plugin load failures are written to `aura.log` instead of being ignored silently.
- Every command typed in the shell is recorded in `aura.log`.
- Test suite built on the Node test runner, covering the kernel, memory, world, identity, config, scheduler, context, assistant, watcher, plugins, git, marketplace validation, changelog tooling and the CLI.
- ESLint configuration and `npm run lint`.
- `npm run check`, which runs lint, tests and marketplace validation, and runs automatically before `npm publish`.
- `scripts/validate-marketplace.js` to validate `marketplace/plugins.json` and detect version drift against bundled plugins.
- `scripts/changelog.js` to promote `[Unreleased]` into a dated version and to extract release notes.
- GitHub Actions workflows: CI (Node 18, 20, 22 and 24, lint, package check, changelog check), CodeQL and dependency review.
- Dependabot configuration for npm packages and GitHub Actions.
- Issue forms for bug reports, feature requests and marketplace plugin submissions, an issue chooser configuration, and a pull request template.
- `CODEOWNERS`, `SECURITY.md`, `CONTRIBUTING.md` and `CODE_OF_CONDUCT.md`.
- Documentation in `docs/`: getting started, command reference, configuration, plugins, architecture, troubleshooting and development.
- Logo at `assets/logo.svg` showing the AURA banner and main menu.
- `.editorconfig`, `.gitattributes`, `.nvmrc` and `aura.config.example.json`.

### Changed

- State files (`memory.json`, `identity.json`, `world.json`, `history.json`, `aura.log`) and user plugins moved from the installed package folder to `~/.aura`. Existing data is not migrated automatically. See the upgrade note in `docs/troubleshooting.md`.
- Git commands run through `execFile` with an argument array instead of a shell command string.
- `plugin install-url` and `marketplace install` accept only `https` URLs that end in `.js`, apply a 10 second timeout and a 1 MB size limit, and warn that plugins run with full system access.
- `plugin install <path>` accepts only simple `.js` file names.
- The release workflow now runs the full check, promotes the changelog, publishes to npm with provenance, pushes the commit and tag only after publishing, and creates a GitHub release from the changelog.
- `README.md` rewritten in English with badges and the new logo. It no longer lists a real-time dashboard or the unused `GITHUB_TOKEN` variable.
- Package description translated to English. `homepage`, `bugs` and `CHANGELOG.md` added to `package.json`.
- Code comments removed from the source.
- `aura.config.json` in the repository was renamed to `aura.config.example.json` and the real file is now ignored by Git.

### Fixed

- The file watcher ignored `.github/`, `.gitignore` and any path containing `.git` as a substring. Only real `node_modules`, `.git` and `aura_backups` folders are ignored now.
- `world user` and `world project` could modify `Object.prototype` when given `__proto__` as an id. Unsafe keys are now rejected in `memory` and `world`.
- A command could start while another `run` process was still active, losing track of the first one.
- `network on` started a second polling timer when one was already running, and the watcher no longer holds the process open.
- A corrupted `identity.json` or `world.json` crashed startup. Both now recover with defaults.
- `marketplace list` printed an install hint that was not a valid shell command.
- The logger re-read the whole log file on every write. It now checks the size every 50 writes.
- Unused imports and variables removed from several modules.

- Plugins installed in `~/.aura/plugins` failed to load on Node.js versions before 22.7 because the folder was not marked as ES modules. AURA now creates a `package.json` with `"type": "module"` there.

### Removed

- Unused dependencies `form-data`, `fs-extra`, `inquirer` and `xml2js`.
- Development state files (`memory.json`, `history.json`, `identity.json`, `world.json`) that were committed to the repository and published to npm.

### Security

- Updated `axios` and its transitive dependencies `follow-redirects` and `form-data` to patched versions, which resolves the advisories reported by `npm audit`.
- Added an `overrides` entry that pins `minimatch` to a patched release inside the ESLint toolchain, so Dependabot security updates no longer fail on the `eslint` downgrade path.
- Prevented shell injection through `git commit`, `git add` and the other git commands.
- Prevented prototype pollution through user-controlled keys.
- `scripts/changelog.js` no longer builds regular expressions from command line input. It parses lines with plain string comparison and validates versions as semantic versions, which resolves the CodeQL `js/regex-injection` and `js/incomplete-sanitization` alerts.
- Development history and memory data are no longer shipped inside the npm package.

[Unreleased]: https://github.com/djunekz/aura/compare/v0.10.0...HEAD
