#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { config } from 'dotenv';
import { organizeCommand } from './commands/organize.js';
import { configCommand } from './commands/config.js';
import { analyzeCommand } from './commands/analyze.js';
import { statusCommand } from './commands/status.js';
import { profileCommand } from './commands/profile.js';

config();

const program = new Command();

program
  .name('polish')
  .description('AI-powered file organization for Obsidian with automatic markdown conversion')
  .version('0.1.0');

program
  .command('organize [source]')
  .description('Organize files from source directory (defaults to configured sources)')
  .option('-p, --profile <name>', 'Use specific profile')
  .option('-v, --vault <path>', 'Obsidian vault path (overrides profile)')
  .option('-o, --originals <path>', 'Original files organization path (overrides profile)')
  .option('-d, --dry-run', 'Preview changes without executing')
  .option('-t, --types <types>', 'Comma-separated list of file types to process')
  .option('-m, --mode <mode>', 'Processing mode: claude-code, api, hybrid, or local', 'claude-code')
  .option('-b, --batch <size>', 'Batch size for API mode', '10')
  .option('-c, --copy', 'Copy files instead of moving them')
  .action(organizeCommand);

// Config management commands
program
  .command('config')
  .argument('<action>', 'Config action: show, get, set, init, edit')
  .argument('[key]', 'Configuration key (required for get/set)')
  .argument('[value]', 'Configuration value (required for set)')
  .description('Configure Polish settings')
  .action(configCommand);

program
  .command('analyze [source]')
  .description('Analyze files without organizing them')
  .option('-t, --types <types>', 'Comma-separated list of file types to analyze')
  .option('-r, --report <path>', 'Save analysis report to file')
  .action(analyzeCommand);

program
  .command('status')
  .description('Show Polish status and configuration')
  .option('-p, --profile <name>', 'Show specific profile status')
  .action(statusCommand);

// Profile management commands
program
  .command('profile')
  .argument('<action>', 'Profile action: create, list, switch, delete, current, clone, rename, export, import, add-source, remove-source, list-sources')
  .argument('[name]', 'Profile name or source path (required for some actions)')
  .option('-d, --description <desc>', 'Profile description')
  .option('-v, --vault <path>', 'Vault path')
  .option('-o, --originals <path>', 'Originals path')
  .option('-f, --force', 'Force action without confirmation')
  .action(profileCommand);

program
  .command('list-supported')
  .description('List supported file types')
  .action(() => {
    console.log(chalk.bold('\nSupported File Types:\n'));
    const supported = {
      Documents: ['pdf', 'docx', 'doc', 'txt', 'rtf', 'odt'],
      Images: ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'svg', 'webp'],
      Code: ['js', 'ts', 'py', 'java', 'cpp', 'c', 'go', 'rs', 'rb', 'php'],
      Data: ['json', 'csv', 'xml', 'yaml', 'yml'],
      Archives: ['zip', 'tar', 'gz', 'rar', '7z'],
      Markdown: ['md', 'markdown'],
    };
    
    Object.entries(supported).forEach(([category, types]) => {
      console.log(chalk.cyan(`${category}:`), types.join(', '));
    });
    console.log();
  });

program.parse(process.argv);