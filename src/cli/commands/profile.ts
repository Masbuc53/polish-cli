import chalk from 'chalk';
import inquirer from 'inquirer';
import * as path from 'path';
import { ProfileManager } from '../../services/ProfileManager.js';
import { ConfigService } from '../../services/ConfigService.js';

interface ProfileOptions {
  description?: string;
  vault?: string;
  originals?: string;
  copy?: boolean;
  force?: boolean;
}

export async function profileCommand(action: string, name?: string, options: ProfileOptions = {}) {
  const profileManager = new ProfileManager();
  await profileManager.initialize();

  switch (action) {
    case 'create':
      await createProfile(profileManager, name, options);
      break;
    case 'list':
      await listProfiles(profileManager);
      break;
    case 'switch':
      await switchProfile(profileManager, name);
      break;
    case 'delete':
      await deleteProfile(profileManager, name, options.force);
      break;
    case 'current':
      await showCurrentProfile(profileManager);
      break;
    case 'clone':
      await cloneProfile(profileManager, name, options);
      break;
    case 'rename':
      await renameProfile(profileManager, name);
      break;
    case 'export':
      await exportProfiles(profileManager, name, options);
      break;
    case 'import':
      await importProfiles(profileManager, name, options);
      break;
    case 'init':
      await initializeProfile(profileManager, name, options);
      break;
    default:
      console.log(chalk.yellow(`Unknown profile action: ${action}`));
      console.log(chalk.gray('Available actions: create, list, switch, delete, current, clone, rename, export, import, init'));
  }
}

async function createProfile(profileManager: ProfileManager, name: string | undefined, options: ProfileOptions) {
  if (!name) {
    const answer = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Profile name:',
        validate: (input: string) => input.length > 0 || 'Profile name is required',
      },
    ]);
    name = answer.name;
  }

  console.log(chalk.bold(`\n🎯 Creating profile: ${name}\n`));

  // Get configuration for the new profile
  const configService = new ConfigService();
  let config = configService.getDefaultConfig();

  if (options.vault) {
    config.vault.path = options.vault;
  }

  if (options.originals) {
    config.originals.path = options.originals;
  }

  // Interactive configuration
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'description',
      message: 'Description (optional):',
      default: options.description || '',
    },
    {
      type: 'input',
      name: 'vaultPath',
      message: 'Obsidian vault path:',
      default: config.vault.path,
      validate: (input: string) => input.length > 0 || 'Vault path is required',
    },
    {
      type: 'input',
      name: 'originalsPath',
      message: 'Original files organization path:',
      default: config.originals.path,
    },
    {
      type: 'checkbox',
      name: 'sources',
      message: 'Select source folders to monitor:',
      choices: [
        { name: 'Desktop', value: path.join(process.env.HOME || '', 'Desktop') },
        { name: 'Downloads', value: path.join(process.env.HOME || '', 'Downloads') },
        { name: 'Documents', value: path.join(process.env.HOME || '', 'Documents') },
      ],
      default: config.sources.map(s => s.path),
    },
    {
      type: 'list',
      name: 'organizationStyle',
      message: 'How should original files be organized?',
      choices: [
        { name: 'By file type', value: 'type-based' },
        { name: 'By project/context', value: 'project-based' },
        { name: 'By date', value: 'date-based' },
      ],
      default: config.originals.organizationStyle,
    },
    {
      type: 'list',
      name: 'mode',
      message: 'Default processing mode:',
      choices: [
        { name: 'Claude Code (no API key needed)', value: 'claude-code' },
        { name: 'Claude API (requires API key)', value: 'api' },
        { name: 'Hybrid (API with local fallback)', value: 'hybrid' },
        { name: 'Local only (no AI)', value: 'local' },
      ],
      default: config.api.mode,
    },
  ]);

  // Update config with answers
  config.vault.path = answers.vaultPath;
  config.originals.path = answers.originalsPath;
  config.originals.organizationStyle = answers.organizationStyle;
  config.sources = answers.sources.map((src: string) => ({
    path: src,
    includeSubfolders: false,
  }));
  config.api.mode = answers.mode;

  try {
    const profile = await profileManager.createProfile(name!, config, answers.description || undefined);
    console.log(chalk.green(`\n✓ Profile '${profile.name}' created successfully!`));
    
    // Ask if they want to switch to this profile
    const switchAnswer = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'switch',
        message: 'Switch to this profile now?',
        default: true,
      },
    ]);

    if (switchAnswer.switch) {
      await profileManager.setActiveProfile(profile.name);
      console.log(chalk.cyan(`→ Switched to profile '${profile.name}'`));
    }
  } catch (error) {
    console.error(chalk.red('Failed to create profile:'), error instanceof Error ? error.message : error);
  }
}

async function listProfiles(profileManager: ProfileManager) {
  const profiles = await profileManager.listProfiles();

  if (profiles.length === 0) {
    console.log(chalk.yellow('\nNo profiles found. Run'), chalk.cyan('polish profile create'), chalk.yellow('to create one.'));
    return;
  }

  console.log(chalk.bold('\n📋 Profiles:\n'));

  profiles.forEach(profile => {
    const activeIndicator = profile.isActive ? chalk.green('●') : chalk.gray('○');
    const lastUsed = new Date(profile.lastUsed);
    const timeAgo = formatTimeAgo(lastUsed);

    console.log(`${activeIndicator} ${chalk.bold(profile.name)}`);
    if (profile.description) {
      console.log(`   ${chalk.gray(profile.description)}`);
    }
    console.log(`   ${chalk.cyan('Vault:')} ${profile.vaultPath}`);
    console.log(`   ${chalk.cyan('Originals:')} ${profile.originalsPath}`);
    console.log(`   ${chalk.cyan('Sources:')} ${profile.sourceCount} folder${profile.sourceCount !== 1 ? 's' : ''}`);
    console.log(`   ${chalk.gray('Last used:')} ${timeAgo}`);
    console.log();
  });
}

async function switchProfile(profileManager: ProfileManager, name: string | undefined) {
  if (!name) {
    const profiles = await profileManager.listProfiles();
    if (profiles.length === 0) {
      console.log(chalk.yellow('No profiles available.'));
      return;
    }

    const activeProfile = profiles.find(p => p.isActive)?.name;
    const choices = profiles
      .filter(p => !p.isActive)
      .map(p => ({ name: `${p.name} - ${p.description || 'No description'}`, value: p.name }));

    if (choices.length === 0) {
      console.log(chalk.yellow('No other profiles to switch to.'));
      return;
    }

    const answer = await inquirer.prompt([
      {
        type: 'list',
        name: 'profile',
        message: `Switch from '${activeProfile}' to:`,
        choices,
      },
    ]);
    name = answer.profile;
  }

  try {
    await profileManager.setActiveProfile(name!);
    console.log(chalk.green(`✓ Switched to profile '${name}'`));
  } catch (error) {
    console.error(chalk.red('Failed to switch profile:'), error instanceof Error ? error.message : error);
  }
}

async function deleteProfile(profileManager: ProfileManager, name: string | undefined, force = false) {
  if (!name) {
    const profiles = await profileManager.listProfiles();
    const choices = profiles
      .filter(p => p.name !== 'default')
      .map(p => ({ name: `${p.name} - ${p.description || 'No description'}`, value: p.name }));

    if (choices.length === 0) {
      console.log(chalk.yellow('No profiles available to delete (cannot delete default profile).'));
      return;
    }

    const answer = await inquirer.prompt([
      {
        type: 'list',
        name: 'profile',
        message: 'Select profile to delete:',
        choices,
      },
    ]);
    name = answer.profile;
  }

  if (!force) {
    const confirmation = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: chalk.red(`Are you sure you want to delete profile '${name}'?`),
        default: false,
      },
    ]);

    if (!confirmation.confirm) {
      console.log(chalk.gray('Delete cancelled.'));
      return;
    }
  }

  try {
    await profileManager.deleteProfile(name!);
    console.log(chalk.green(`✓ Profile '${name}' deleted successfully`));
  } catch (error) {
    console.error(chalk.red('Failed to delete profile:'), error instanceof Error ? error.message : error);
  }
}

async function showCurrentProfile(profileManager: ProfileManager) {
  try {
    const activeProfileName = await profileManager.getActiveProfile();
    if (!activeProfileName) {
      console.log(chalk.yellow('No active profile set.'));
      return;
    }

    const profile = await profileManager.getProfile(activeProfileName);
    if (!profile) {
      console.log(chalk.red('Active profile not found.'));
      return;
    }

    console.log(chalk.bold(`\n📌 Current Profile: ${profile.name}\n`));
    
    if (profile.description) {
      console.log(chalk.gray(`Description: ${profile.description}`));
    }
    
    console.log(chalk.cyan('Vault path:'), profile.config.vault.path);
    console.log(chalk.cyan('Originals path:'), profile.config.originals.path);
    console.log(chalk.cyan('Organization style:'), profile.config.originals.organizationStyle);
    console.log(chalk.cyan('Processing mode:'), profile.config.api.mode);
    console.log(chalk.cyan('Source folders:'));
    
    profile.config.sources.forEach(source => {
      console.log(`  - ${source.path}${source.includeSubfolders ? ' (including subfolders)' : ''}`);
    });
    
    const lastUsed = new Date(profile.lastUsed);
    console.log(chalk.gray(`\nLast used: ${formatTimeAgo(lastUsed)}`));
  } catch (error) {
    console.error(chalk.red('Failed to show current profile:'), error instanceof Error ? error.message : error);
  }
}

async function cloneProfile(profileManager: ProfileManager, sourceName: string | undefined, options: ProfileOptions & { targetName?: string }) {
  if (!sourceName) {
    const profiles = await profileManager.listProfiles();
    const choices = profiles.map(p => ({ name: `${p.name} - ${p.description || 'No description'}`, value: p.name }));

    const answer = await inquirer.prompt([
      {
        type: 'list',
        name: 'source',
        message: 'Select profile to clone:',
        choices,
      },
    ]);
    sourceName = answer.source;
  }

  let targetName = options.targetName;
  if (!targetName) {
    const targetAnswer = await inquirer.prompt([
      {
        type: 'input',
        name: 'target',
        message: 'New profile name:',
        validate: (input: string) => input.length > 0 || 'Profile name is required',
      },
    ]);
    targetName = targetAnswer.target;
  }

  const descriptionAnswer = await inquirer.prompt([
    {
      type: 'input',
      name: 'description',
      message: 'Description (optional):',
      default: options.description || '',
    },
  ]);

  try {
    const profile = await profileManager.cloneProfile(sourceName!, targetName!, descriptionAnswer.description || undefined);
    console.log(chalk.green(`✓ Profile '${profile.name}' cloned from '${sourceName}'`));
  } catch (error) {
    console.error(chalk.red('Failed to clone profile:'), error instanceof Error ? error.message : error);
  }
}

async function renameProfile(profileManager: ProfileManager, oldName: string | undefined) {
  if (!oldName) {
    const profiles = await profileManager.listProfiles();
    const choices = profiles
      .filter(p => p.name !== 'default')
      .map(p => ({ name: `${p.name} - ${p.description || 'No description'}`, value: p.name }));

    const answer = await inquirer.prompt([
      {
        type: 'list',
        name: 'profile',
        message: 'Select profile to rename:',
        choices,
      },
    ]);
    oldName = answer.profile;
  }

  const newNameAnswer = await inquirer.prompt([
    {
      type: 'input',
      name: 'newName',
      message: `New name for '${oldName}':`,
      validate: (input: string) => input.length > 0 || 'Profile name is required',
    },
  ]);

  try {
    await profileManager.renameProfile(oldName!, newNameAnswer.newName);
    console.log(chalk.green(`✓ Profile renamed from '${oldName}' to '${newNameAnswer.newName}'`));
  } catch (error) {
    console.error(chalk.red('Failed to rename profile:'), error instanceof Error ? error.message : error);
  }
}

async function exportProfiles(profileManager: ProfileManager, filePath: string | undefined, _options: ProfileOptions) {
  if (!filePath) {
    const answer = await inquirer.prompt([
      {
        type: 'input',
        name: 'filePath',
        message: 'Export file path:',
        default: './polish-profiles.json',
      },
    ]);
    filePath = answer.filePath;
  }

  try {
    await profileManager.exportProfiles(filePath!);
    console.log(chalk.green(`✓ Profiles exported to ${filePath}`));
  } catch (error) {
    console.error(chalk.red('Failed to export profiles:'), error instanceof Error ? error.message : error);
  }
}

async function importProfiles(profileManager: ProfileManager, filePath: string | undefined, options: ProfileOptions) {
  if (!filePath) {
    const answer = await inquirer.prompt([
      {
        type: 'input',
        name: 'filePath',
        message: 'Import file path:',
        validate: (input: string) => input.length > 0 || 'File path is required',
      },
    ]);
    filePath = answer.filePath;
  }

  try {
    const imported = await profileManager.importProfiles(filePath!, options.force);
    if (imported.length > 0) {
      console.log(chalk.green(`✓ Imported ${imported.length} profile(s):`));
      imported.forEach(name => console.log(`  - ${name}`));
    } else {
      console.log(chalk.yellow('No new profiles imported (use --force to overwrite existing profiles)'));
    }
  } catch (error) {
    console.error(chalk.red('Failed to import profiles:'), error instanceof Error ? error.message : error);
  }
}

async function initializeProfile(profileManager: ProfileManager, name: string | undefined, options: ProfileOptions) {
  console.log(chalk.bold('\n🎯 Polish Profile Initialization\n'));
  
  const profiles = await profileManager.listProfiles();
  if (profiles.length > 0) {
    console.log(chalk.yellow('Profiles already exist. Use'), chalk.cyan('polish profile create'), chalk.yellow('to create a new profile.'));
    return;
  }

  // Initialize with default profile
  await createProfile(profileManager, name || 'default', options);
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}