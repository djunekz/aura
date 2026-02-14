#!/usr/bin/env node
import Kernel from './core/kernel.js';
import chalk from 'chalk';

console.log(chalk.cyan.bold("🔥 Welcome to AURA 🔥"));

const kernel = new Kernel();
kernel.startCLI();
