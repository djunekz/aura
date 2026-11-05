# Getting started

## Requirements

- Node.js 18 or newer
- Git, only if you want to use the `git` commands

On Termux:

```bash
pkg update
pkg install nodejs git
```

## Install

From npm:

```bash
npm install -g aura-terminal
```

From source:

```bash
git clone https://github.com/djunekz/aura
cd aura
npm install
npm start
```

To make a source checkout available as the `aura` command:

```bash
npm link
```

## Start the shell

```bash
aura
```

You should see the banner followed by the `aura>` prompt. Type `help` to list every command and `exit` to leave.

Command line options:

| Option | Effect |
|--------|--------|
| `-v`, `--version` | Print the installed version and exit |
| `-h`, `--help` | Print usage and exit |

## A first session

```text
identity set Ada
context
memory set project my-app
git status
scheduler add Heartbeat 60
scheduler list
ask deploy
exit
```

- `identity set` stores your display name.
- `context` reports the project type detected in the current folder.
- `memory set` keeps a key/value pair that survives restarts.
- `scheduler add` starts a periodic task that prints a tick every 60 seconds.
- `ask` analyzes the current state and suggests the next command.

AURA works on the folder you start it in. Run it from the root of the project you want to manage.

## Where AURA stores data

AURA keeps its state in `~/.aura` (on Termux this is inside the Termux home directory). Set the `AURA_HOME` environment variable to use another location:

```bash
AURA_HOME=/tmp/aura-sandbox aura
```

| File | Content |
|------|---------|
| `memory.json` | Key/value pairs from the `memory` commands |
| `identity.json` | Your display name |
| `world.json` | Users and projects from the `world` commands |
| `history.json` | The last 200 commands |
| `aura.log` | Activity log, shown with `logs` |
| `plugins/` | Plugins you installed |

Per-project settings live in `aura.config.json` in the folder where you start AURA. See [Configuration](configuration.md).

## Next steps

- Browse the [command reference](commands.md)
- Automate a recurring task with the [scheduler and config file](configuration.md)
- Extend AURA with [plugins](plugins.md)
