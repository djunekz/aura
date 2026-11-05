# Contributing to AURA

Thanks for helping improve AURA. This guide gets you from idea to merged pull request.

## Ways to contribute

- Report a bug with the [bug report form](https://github.com/djunekz/aura/issues/new?template=bug_report.yml)
- Suggest an improvement with the [feature request form](https://github.com/djunekz/aura/issues/new?template=feature_request.yml)
- Submit a plugin with the [plugin submission form](https://github.com/djunekz/aura/issues/new?template=plugin_submission.yml)
- Improve the documentation in `docs/`
- Fix an open issue

For a large change, open an issue first so the approach can be agreed before you invest time.

## Development setup

```bash
git clone https://github.com/YOUR-USERNAME/aura
cd aura
npm install
npm run check
```

Run AURA against a temporary state directory so your own data is not touched:

```bash
AURA_HOME=$(mktemp -d) npm start
```

More detail is in the [development guide](docs/development.md).

## Pull request checklist

1. Branch from `main` with a descriptive name such as `fix/watcher-ignore` or `feat/scheduler-persist`.
2. Keep the change focused. Unrelated cleanups belong in a separate pull request.
3. Add or update tests in `test/`.
4. Run `npm run check`. It runs lint, tests and marketplace validation.
5. Add an entry under `[Unreleased]` in [CHANGELOG.md](CHANGELOG.md).
6. Update the documentation when behavior changes.
7. Use [Conventional Commits](https://www.conventionalcommits.org) for commit messages and the pull request title.

Pull requests that only change documentation or tooling can use the `skip-changelog` label.

## Code style

- ES modules, no semicolons, two-space indentation. `.editorconfig` and ESLint enforce the details.
- The project does not use code comments or docstrings. Use clear names and small functions.
- Never build shell command strings from user input. Pass argument arrays to `execFile` or `spawn`.
- Validate any user-controlled key before using it as an object property. See `core/safe.js`.

## Plugins and the marketplace

Read the [plugin guide](docs/plugins.md). Marketplace entries are reviewed by hand because plugins run with full access to the user's system. Run `npm run validate:marketplace` before opening the pull request.

## Code of conduct

Everyone taking part is expected to follow the [Code of Conduct](CODE_OF_CONDUCT.md).
