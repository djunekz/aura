# Command reference

Type commands at the `aura>` prompt. Press Tab to complete a command. A mistyped command prints the closest matches.

Arguments in `<angle brackets>` are required and arguments in `[square brackets]` are optional.

## System

| Command | Description |
|---------|-------------|
| `status` | Identity, folder, project type, network and watcher state, plugin and task counts, memory keys |
| `context` | The project type detected in the current folder |
| `identity` | Show your display name |
| `identity set <name>` | Change your display name |
| `help` | List all commands |
| `exit` | Stop running tasks and watchers, then quit |

Detected project types: Node.js, Deno, Bun, Python (requirements, pyproject, Pipenv), Go, Rust, PHP, Ruby, Java (Maven, Gradle), Flutter/Dart, .NET, C/C++ (CMake). Anything else is reported as `Unknown / Generic`.

## Memory

| Command | Description |
|---------|-------------|
| `memory` | Show every stored pair |
| `memory set <key> <value>` | Store a value. The key is the first word and the value is the rest of the line |
| `memory get <key>` | Read a value |
| `memory delete <key>` | Remove a key |
| `memory clear` | Remove everything |

The keys `__proto__`, `constructor` and `prototype` are rejected.

## Git

AURA runs `git` directly in the current folder, without a shell, so special characters in commit messages are never interpreted.

| Command | Description |
|---------|-------------|
| `git status` | Short status with branch information |
| `git log [n]` | The last `n` commits, one line each. Defaults to 5 |
| `git add [paths]` | Stage space-separated paths. Defaults to `.` |
| `git commit [message]` | Commit. Without a message, a timestamped `chore: auto-commit by AURA` message is used |
| `git push [remote] [branch]` | Defaults to `origin` and the current branch |
| `git pull [remote] [branch]` | Defaults to `origin` and the current branch |
| `git autopush [message]` | `add .`, then `commit`, then `push`. Stops at the first step that fails |

Paths that contain spaces are not supported by `git add`. The folder must contain a `.git` directory.

## Runner

| Command | Description |
|---------|-------------|
| `run` | List npm scripts, and mention a Makefile or Python project if present |
| `run <command>` | Run a command through the system shell in the current folder with its output attached to your terminal |
| `kill` | Send SIGTERM to the running process |

Only one process can run at a time. Starting another prints a hint to use `kill`. A command that exits with a non-zero code is recorded so that `ask error` can explain it.

## Watcher and network

| Command | Description |
|---------|-------------|
| `watch on` | Watch the current folder recursively and print file events |
| `watch off` | Stop watching |
| `network on` | Start the connectivity check, which runs every 5 seconds |
| `network off` | Stop the connectivity check |

The watcher ignores any path that has a `node_modules`, `.git` or `aura_backups` folder segment. Hidden folders such as `.github` are watched. The network watcher starts automatically with AURA.

## AI assistant

| Command | Description |
|---------|-------------|
| `ask <question>` | Analyze the current state and suggest commands |

The assistant is rule-based and runs entirely on your machine with no external API. It recognizes these topics by keyword, checked in this order: error, deploy, backup, memory, network, project (also `status`, `info`), plugin. Anything else prints the list of topics.

Every 5 minutes it may print suggestions, for example when files change often and AutoBackup is not loaded.

## Plugins

| Command | Description |
|---------|-------------|
| `plugin list` | Show loaded plugins |
| `plugin install <path>` | Copy a local `.js` plugin into `~/.aura/plugins` |
| `plugin install-url <url>` | Download a plugin from an `https` URL that ends in `.js` (1 MB limit, 10 second timeout) |
| `plugin update <name>` | Compare with the marketplace and reinstall when the version differs |

Plugins are loaded when AURA starts, so restart after installing or updating one. Plugins are arbitrary code. See [Plugins](plugins.md) for the trust model.

## Marketplace

| Command | Description |
|---------|-------------|
| `marketplace list` | Show plugins from the official index, marking installed ones. Falls back to the bundled index when offline |
| `marketplace install <name>` | Install a plugin by name |

## Scheduler

| Command | Description |
|---------|-------------|
| `scheduler list` | Show active tasks with their IDs |
| `scheduler add <name> <seconds>` | Start a periodic task |
| `scheduler stop` | Stop every task |
| `scheduler stop <id or name>` | Stop one task |

Tasks started from the shell print a tick message. To run real work on a schedule, register a function from a plugin with `kernel.scheduler.addTask(name, seconds, fn)`.

## Logs

| Command | Description |
|---------|-------------|
| `logs` | Show the last 20 entries |
| `logs <n>` | Show the last `n` entries |
| `logs clear` | Empty the log |

Every command you run and every command that fails is recorded in `~/.aura/aura.log`. The file is trimmed to roughly the latest 500 lines.

## Config

| Command | Description |
|---------|-------------|
| `config` | Show the active settings |
| `config init` | Create an `aura.config.json` template in the current folder |
| `config set <key> <value>` | Change a setting. The value is parsed as JSON when possible, otherwise stored as text |

## World

| Command | Description |
|---------|-------------|
| `world status` | Show stored users and projects |
| `world user <id> <key> <value>` | Set a field on a user |
| `world project <name> <key> <value>` | Set a field on a project |

## History

| Command | Description |
|---------|-------------|
| `history` | Show the last 30 commands. The last 200 are kept between sessions |
