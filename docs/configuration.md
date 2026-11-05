# Configuration

## aura.config.json

AURA looks for `aura.config.json` in the folder where it is started and loads it automatically. Create a template with `config init` or copy [`aura.config.example.json`](../aura.config.example.json).

```json
{
  "autoWatch": false,
  "autoScheduler": [
    { "name": "Heartbeat", "interval": 300 }
  ],
  "identity": "Ada",
  "theme": "default"
}
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `autoWatch` | boolean | `false` | Start the file watcher on launch |
| `autoScheduler` | array | `[]` | Tasks started on launch. Each entry needs a `name` and an `interval` in seconds |
| `identity` | string | `null` | Display name applied on launch. The placeholder `Your Name` is ignored |
| `theme` | string | `"default"` | Reserved for future use |

Rules:

- The file is read once at startup. Restart AURA after editing it by hand. `config set` writes the file immediately.
- If the file is not valid JSON, AURA prints a warning and uses the defaults.
- Settings are per folder. Different projects can have different files.
- Keep the file out of version control if it contains personal values. The repository ignores `aura.config.json` for this reason.

## Environment variables

| Variable | Description |
|----------|-------------|
| `AURA_HOME` | Directory for AURA state. Defaults to `~/.aura` |

## State files

All state is stored under `AURA_HOME`:

| Path | Created by |
|------|-----------|
| `memory.json` | `memory set` |
| `identity.json` | `identity set` or the `identity` config key |
| `world.json` | `world user`, `world project` |
| `history.json` | Every command |
| `aura.log` | Every command and error |
| `plugins/` | `plugin install`, `plugin install-url`, `marketplace install` |

Delete a file to reset that part of AURA. Delete the whole directory to reset everything.

## Per-project files created in the working folder

| Path | Created by |
|------|-----------|
| `aura.config.json` | `config init`, `config set` |
| `aura_backups/` | The bundled AutoBackup plugin, when the watcher is on |
