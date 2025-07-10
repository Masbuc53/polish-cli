import chalk from 'chalk';
import * as fs from 'fs/promises';
import { ProfileManager } from '../../services/ProfileManager.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(readFileSync(join(__dirname, '../../../package.json'), 'utf-8'));
const version = packageJson.version;

interface StatusOptions {
  profile?: string;
}

export async function statusCommand(options: StatusOptions = {}) {
  console.log(chalk.bold('\n✨ Polish Status\n'));
  console.log(chalk.cyan('Version:'), version);
  console.log(chalk.cyan('Node:'), process.version);
  console.log(chalk.cyan('Platform:'), process.platform);

  try {
    const profileManager = new ProfileManager();
    await profileManager.initialize();
    
    const profiles = await profileManager.listProfiles();
    const activeProfileName = await profileManager.getActiveProfile();
    
    console.log(chalk.bold('\n👤 Profiles:'));
    console.log(chalk.cyan('Active:'), activeProfileName || 'None');
    console.log(chalk.cyan('Total:'), profiles.length);
    
    if (options.profile) {
      const profile = await profileManager.getProfile(options.profile);
      if (!profile) {
        console.log(chalk.red(`\n⚠️  Profile '${options.profile}' not found`));
        return;
      }
      await showProfileStatus(profile.config, profile.name);
    } else if (activeProfileName) {
      const config = await profileManager.getActiveConfig();
      await showProfileStatus(config, activeProfileName);
    } else {
      console.log(chalk.yellow('\n⚠️  No active profile'));
      console.log(chalk.gray('Run'), chalk.cyan('polish profile create'), chalk.gray('to create a profile'));
      return;
    }
    
    if (profiles.length > 1) {
      console.log(chalk.bold('\n📋 All Profiles:'));
      profiles.forEach(profile => {
        const indicator = profile.isActive ? chalk.green('●') : chalk.gray('○');
        console.log(`${indicator} ${profile.name}${profile.description ? ` - ${profile.description}` : ''}`);
      });
    }

  } catch (error) {
    console.log(chalk.red('\n⚠️  No profiles found'));
    console.log(chalk.gray('Run'), chalk.cyan('polish profile create'), chalk.gray('to create a profile'));
  }
}

async function showProfileStatus(config: any, profileName: string) {
  console.log(chalk.bold(`\n📁 Profile: ${profileName}`));
  console.log(chalk.gray('Vault:'), config.vault.path, await checkPath(config.vault.path));
  console.log(chalk.gray('Originals:'), config.originals.path, await checkPath(config.originals.path));

  console.log(chalk.bold('\n📂 Sources:'));
  for (const source of config.sources) {
    console.log(chalk.gray('-'), source.path, await checkPath(source.path));
  }

  console.log(chalk.bold('\n⚙️  Settings:'));
  console.log(chalk.gray('Mode:'), config.api.mode);
  console.log(chalk.gray('Organization style:'), config.originals.organizationStyle);
  console.log(chalk.gray('Max tags:'), config.tagging.maxTags);
  console.log(chalk.gray('Supported formats:'), config.processing.supportedFormats.length, 'types');

  if (config.api.mode === 'api' || config.api.mode === 'hybrid') {
    const hasApiKey = !!config.api.apiKey && config.api.apiKey !== 'env:ANTHROPIC_API_KEY';
    console.log(chalk.gray('API key:'), hasApiKey ? chalk.green('✓ Configured') : chalk.yellow('⚠ Not set'));
  }
}

async function checkPath(path: string): Promise<string> {
  try {
    await fs.access(path);
    return chalk.green('✓');
  } catch {
    return chalk.yellow('✗');
  }
}