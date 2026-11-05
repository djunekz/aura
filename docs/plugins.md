# Plugins

A plugin is a single ES module that default-exports an object.

```js
export default {
  name: 'ChangeLogger',
  version: '1.0.0',
  description: 'Writes every file change to the AURA log',

  init(kernel) {
    const previous = kernel.watcher.handleEvent.bind(kernel.watcher)

    kernel.watcher.handleEvent = (event, filepath) => {
      if (event === 'change') kernel.logger.info(`changed: ${filepath}`)
      previous(event, filepath)
    }
  },
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `name` | yes | Unique identifier. Used by `plugin update` and the marketplace |
| `version` | yes | Semantic version |
| `description` | recommended | One line shown by `plugin list` |
| `init(kernel)` | yes | Called once at startup with the kernel instance |

## Lifecycle

1. At startup AURA loads every `.js` file from `~/.aura/plugins` (it creates a `package.json` with `"type": "module"` there so ES modules work on every supported Node version), then from the bundled `core/plugins` folder.
2. If two plugins share a `name`, the first one loaded wins. A plugin you installed therefore replaces a bundled plugin of the same name.
3. `init(kernel)` runs once. Console output during startup is suppressed, so use `kernel.logger` for diagnostics.
4. A plugin that throws while loading is skipped and a warning is written to `aura.log`. Check it with `logs`.

## What a plugin can use

| Object | Useful members |
|--------|----------------|
| `kernel.watcher` | `handleEvent(event, filepath)` is called for every file event. Wrap it to react to changes |
| `kernel.networkWatcher` | `online` is `true` or `false` |
| `kernel.scheduler` | `addTask(name, seconds, fn)` runs `fn` periodically |
| `kernel.memory` | `get`, `set`, `delete` |
| `kernel.world` | `getUser`, `updateUser`, `getProject`, `updateProject` |
| `kernel.logger` | `info`, `warn`, `error` |
| `kernel.ai` | `trackError(message)` and `trackFile(path)` feed the assistant |
| `kernel.aiHelper(question)` | Ask the assistant a question |
| `kernel.config` | `get(key)` |

The kernel is not a stable public API yet. Pin your plugin to a tested AURA version in its documentation.

## Test a plugin safely

Use a throwaway state directory and an empty folder:

```bash
mkdir /tmp/aura-lab && cd /tmp/aura-lab
AURA_HOME=$(mktemp -d) aura
```

Then inside the shell:

```text
plugin install ./change-logger.js
exit
```

Start AURA again with the same `AURA_HOME`, run `plugin list`, then `watch on` and edit a file.

## Install a plugin

| Source | Command |
|--------|---------|
| Local file | `plugin install <path>` |
| URL | `plugin install-url <url>` |
| Marketplace | `marketplace install <name>` |

URLs must use `https` and point to a file ending in `.js`. Downloads are limited to 1 MB.

## Trust model

Plugins are not sandboxed. They run with the same permissions as AURA, which means they can read your files, run commands and use the network. AURA does not verify signatures or checksums.

- Read a plugin's source before installing it.
- Prefer plugins from the official marketplace and from authors you trust.
- Report a malicious or vulnerable plugin through the [security policy](../SECURITY.md).

## Publish to the marketplace

The marketplace index is [`marketplace/plugins.json`](../marketplace/plugins.json), an array of entries:

```json
{
  "name": "ChangeLogger",
  "version": "1.0.0",
  "url": "https://raw.githubusercontent.com/you/aura-change-logger/main/plugin.js",
  "description": "Writes every file change to the AURA log"
}
```

Requirements:

- The plugin is one readable, non-obfuscated file served over `https`
- `name` is unique and matches the `name` exported by the plugin
- `version` is a semantic version
- The plugin has no hidden network calls or telemetry
- You describe, in the submission, every file, host and process it touches

Open a [plugin submission issue](https://github.com/djunekz/aura/issues/new?template=plugin_submission.yml) first, then a pull request that adds the entry. Run `npm run validate:marketplace` before submitting. For plugins hosted in this repository the check also confirms that the index version matches the file.
