#!/usr/bin/env node
import fs from 'fs'
import chalk from 'chalk'
import Kernel from './core/kernel.js'

const pkg = JSON.parse(fs.readFileSync(new URL('./package.json', import.meta.url), 'utf-8'))
const args = process.argv.slice(2)

if (args.includes('--version') || args.includes('-v')) {
  console.log(pkg.version)
  process.exit(0)
}

if (args.includes('--help') || args.includes('-h')) {
  console.log([
    `aura ${pkg.version}`,
    '',
    'Usage: aura [options]',
    '',
    'Options:',
    '  -v, --version  Print the installed version',
    '  -h, --help     Show this help',
    '',
    'Run without options to start the interactive shell.',
  ].join('\n'))
  process.exit(0)
}

console.log(chalk.cyan.bold('🔥 Welcome to AURA 🔥'))

const kernel = new Kernel()
kernel.startCLI().catch(err => {
  console.error(chalk.red(`Failed to start AURA: ${err.message}`))
  process.exit(1)
})
