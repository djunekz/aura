# Troubleshooting

## npm prints "Unsupported engine" warnings

AURA and its dependencies require Node.js 22.22 or newer. Check your version with `node --version` and upgrade if it is older. On Termux:

```bash
pkg upgrade nodejs
```

## The `aura` command is not found after installing

npm installed the binary in a folder that is not on your `PATH`. Find it:

```bash
npm config get prefix
```

The `bin` folder inside that prefix must be on your `PATH`. On Termux the prefix is already on the path, so restart the session after installing.

## EACCES when installing globally on Linux or macOS

Do not use `sudo`. Point npm at a folder you own:

```bash
npm config set prefix "$HOME/.npm-global"
export PATH="$HOME/.npm-global/bin:$PATH"
npm install -g aura-terminal
```

## Network shows Offline right after start

The first connectivity check runs in the background, so `status` can briefly report Offline. Run `status` again after a few seconds. If you work offline on purpose, `network off` stops the check.

## `marketplace list` says Offline

AURA could not reach `raw.githubusercontent.com` and fell back to the index bundled with your installed version, which may be older than the online one.

## File events do not appear

- Run `watch on` first. The watcher is off by default unless `autoWatch` is set.
- Paths inside `node_modules`, `.git` or `aura_backups` are ignored on purpose.
- On Android the system can limit the number of watched files. Start AURA in the project folder instead of your whole home directory.

## A plugin does not load

Plugins are loaded only at startup. Restart AURA, then run `logs 20`. A plugin that throws while loading is skipped with a warning that names the file. Make sure the file default-exports an object with a `name` and an `init` function, as described in [Plugins](plugins.md).

## `plugin install-url` is rejected

Only `https` URLs that end in `.js` are accepted, and the file must be under 1 MB.

## Git commands say the folder is not a repository

AURA checks for a `.git` folder in the directory where you started it. Start AURA from the repository root or run `git init`.

## A `run` command seems stuck

Type `kill` at the prompt. The shell that runs your command receives SIGTERM. If a child process keeps running, stop it from another terminal.

## aura.config.json is ignored

A parse error prints a warning at startup and AURA falls back to defaults. Validate the file with any JSON linter. The file is read from the folder where you start AURA, not from the folder of the installed package.

## Reset AURA

Delete one state file, or the whole directory to start fresh:

```bash
rm -rf ~/.aura
```

## Upgrading from 0.10.0 or older

Earlier versions stored `memory.json`, `identity.json`, `world.json`, `history.json` and `aura.log` inside the installed package, and plugins in its `core/plugins` folder. Those files were replaced on every upgrade and are no longer read. If you want to keep old data, copy the files from the old package folder into `~/.aura` and plugins into `~/.aura/plugins` before upgrading.

## Still stuck

Open a [bug report](https://github.com/djunekz/aura/issues/new?template=bug_report.yml) and include the output of `aura --version`, `node --version`, your platform and `logs 50`. Remove tokens and personal data first.
