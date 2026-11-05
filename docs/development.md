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
| `release.yml` | Push of a `vX.X.X` tag | Verifies the tag, publishes to npm and creates the GitHub release |

Dependabot opens weekly updates for npm packages and GitHub Actions.

## Releasing

Releases are triggered by pushing a version tag. Prerequisite: the `NPM_TOKEN` repository secret.

1. Make sure `[Unreleased]` in `CHANGELOG.md` describes everything that changed.
2. On an up-to-date `main`, run one of:

```bash
npm version patch -m "chore(release): %s"
npm version minor -m "chore(release): %s"
npm version major -m "chore(release): %s"
```

3. Push the commit and the tag:

```bash
git push origin main --follow-tags
```

`npm version` bumps `package.json`, moves `[Unreleased]` into a `[x.x.x] - date` section with updated compare links, commits the result and creates the tag `vx.x.x`. It fails if `[Unreleased]` is empty.

Pushing the tag starts the `Release` workflow, which:

1. Checks that the tag matches the `package.json` version and points to a commit on `main`
2. Runs `npm run check`
3. Reads the `[x.x.x]` section of `CHANGELOG.md` as the release notes
4. Publishes to npm with provenance, unless that version is already published
5. Creates a GitHub release titled `Aura vx.x.x` with those notes, or updates it if it already exists

Tags with a suffix such as `v0.11.0-beta.1` are published to npm under the `next` tag and marked as pre-releases on GitHub.

If a run fails, fix the cause and re-run the workflow from the Actions tab. It is safe to re-run because already published versions and existing releases are detected.
