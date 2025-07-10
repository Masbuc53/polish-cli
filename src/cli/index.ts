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

program
  .command('config')
  .description('Configure Polish settings')
  .option('set <key> <value>', 'Set a configuration value')
  .option('get [key]', 'Get configuration value(s)')
  .option('show', 'Show full configuration')
  .option('init', 'Initialize configuration interactively')
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
const profileCmd = program
  .command('profile <action> [name]')
  .description('Manage profiles for different vault configurations');

profileCmd
  .command('create [name]')
  .description('Create a new profile')
  .option('-d, --description <desc>', 'Profile description')
  .option('-v, --vault <path>', 'Vault path')
  .option('-o, --originals <path>', 'Originals path')
  .action((name, options) => profileCommand('create', name, options));

profileCmd
  .command('list')
  .description('List all profiles')
  .action(() => profileCommand('list'));

profileCmd
  .command('switch [name]')
  .description('Switch to a different profile')
  .action((name) => profileCommand('switch', name));

profileCmd
  .command('delete [name]')
  .description('Delete a profile')
  .option('-f, --force', 'Force delete without confirmation')
  .action((name, options) => profileCommand('delete', name, options));

profileCmd
  .command('current')
  .description('Show current active profile')
  .action(() => profileCommand('current'));

profileCmd
  .command('clone <source> <target>')
  .description('Clone an existing profile')
  .option('-d, --description <desc>', 'New profile description')
  .action((source, target, options) => profileCommand('clone', source, { ...options, targetName: target }));

profileCmd
  .command('rename [name]')
  .description('Rename a profile')
  .action((name) => profileCommand('rename', name));

profileCmd
  .command('export [file]')
  .description('Export profiles to a file')
  .action((file) => profileCommand('export', file));

profileCmd
  .command('import [file]')
  .description('Import profiles from a file')
  .option('-f, --force', 'Overwrite existing profiles')
  .action((file, options) => profileCommand('import', file, options));

// Alternative profile commands for easier access
program
  .command('profile')
  .argument('<action>', 'Profile action: create, list, switch, delete, current, clone, rename, export, import')
  .argument('[name]', 'Profile name (required for some actions)')
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