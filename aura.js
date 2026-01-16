#!/usr/bin/env node
const Kernel = require('./core/kernel');
const chalk = require('chalk');

console.log(chalk.cyan.bold("🔥 Welcome to AURA 🔥"));

const kernel = new Kernel();
kernel.startCLI();
