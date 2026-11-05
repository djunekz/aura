# Development

## Setup

```bash
git clone https://github.com/djunekz/aura
cd aura
npm install
npm start
```

Use Node.js 22 for development. The `.nvmrc` file pins it.

Run AURA against a throwaway state directory so your real data is untouched:

```bash
AURA_HOME=$(mktemp -d) npm start
```

## Scripts

| Script | Purpose |
|--------|---------|
| `npm start` | Start the shell |
| `npm test` | Run the test suite with the built-in Node test runner |
| `npm run lint` | Run ESLint |
| `npm run validate:marketplace` | Check `marketplace/plugins.json` |
| `npm run check` | Lint, test and validate in one go. Also runs before every publish |

## Tests

Tests live in `test/` and use `node:test`. Every test file sets `AURA_HOME` to a temporary directory through `test/helpers.js`, so tests never touch `~/.aura`. Import `helpers.js` first in new test files.

Guidelines:

- Test behavior through the public methods of each module
- Create folders with `tempDir()` and change directory into them when a module reads the working folder
- Use `capture()` to assert on console output

## Code style

- ES modules, no semicolons, two-space indentation (see `.editorconfig`)
- The project does not use code comments or docstrings. Prefer descriptive names and small functions
- ESLint is the source of truth: `npm run lint`

## Commit messages

Use [Conventional Commits](https://www.conventionalcommits.org): `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`, `ci:`. Dependabot uses `chore(deps)` and `ci(deps)`.

## Changelog

[`CHANGELOG.md`](../CHANGELOG.md) follows [Keep a Changelog](https://keepachangelog.com). Add an entry under `[Unreleased]` in every pull request that changes behavior. Use the sections Added, Changed, Deprecated, Removed, Fixed and Security. Pull requests without a changelog change fail the `Changelog entry` check unless they carry the `skip-changelog` label.

## Continuous integration

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `ci.yml` | Push to `main`, pull requests | Tests on Node 18, 20, 22 and 24, lint, marketplace validation, package dry run, changelog check |
| `codeql.yml` | Push, pull requests, weekly | Static security analysis |
| `dependency-review.yml` | Pull requests | Blocks dependency changes with high severity advisories |
| `release.yml` | Manual | Version bump, npm publish, tag and GitHub release |

Dependabot opens weekly updates for npm packages and GitHub Actions.

## Releasing

Prerequisites: the `NPM_TOKEN` repository secret, and permission for the workflow to push to `main`.

1. Make sure `[Unreleased]` in `CHANGELOG.md` describes everything that changed.
2. Open **Actions**, choose **Release**, pick `patch`, `minor` or `major` and run it on `main`.

The workflow then:

1. Runs `npm run check`
2. Runs `npm version`, which bumps `package.json`, moves `[Unreleased]` into a dated version section with updated compare links, commits and tags
3. Publishes to npm with provenance
4. Pushes the commit and tag
5. Creates a GitHub release whose notes are the new changelog section

If the changelog section is empty, `npm version` fails and nothing is published. If branch protection blocks the push to `main`, allow the workflow to bypass it or release manually.
