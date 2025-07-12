import chalk from 'chalk';
import inquirer from 'inquirer';
import { ProfileManager } from '../../services/ProfileManager.js';
import { Config } from '../../types/index.js';
import * as path from 'path';
import * as os from 'os';

export async function configCommand(action: string, key?: string, value?: string) {
  const profileManager = new ProfileManager();
  await profileManager.initialize();

  try {
    switch (action) {
      case 'init':
        await initializeConfig(profileManager);
        break;

      case 'show':
        await showConfig(profileManager);
        break;

      case 'get':
        if (!key) {
          console.log(chalk.red('Error: Key is required for get command'));
          console.log(chalk.gray('Usage: polish config get <key>'));
          return;
        }
        await getConfigValue(profileManager, key);
        break;

      case 'set':
        if (!key || !value) {
          console.log(chalk.red('Error: Key and value are required for set command'));
          console.log(chalk.gray('Usage: polish config set <key> <value>'));
          return;
        }
        await setConfigValue(profileManager, key, value);
        break;

      case 'edit':
        await editConfig(profileManager);
        break;

      default:
        console.log(chalk.yellow('Unknown config action. Available actions:'));
        console.log(chalk.gray('  show   - Show full configuration'));
        console.log(chalk.gray('  get    - Get configuration value'));
        console.log(chalk.gray('  set    - Set configuration value'));
        console.log(chalk.gray('  init   - Initialize configuration'));
        console.log(chalk.gray('  edit   - Edit configuration interactively'));
    }
  } catch (error) {
    console.error(chalk.red('Config command failed:'), error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

async function showConfig(profileManager: ProfileManager) {
  const config = await profileManager.getActiveConfig();
  const activeProfileName = await profileManager.getActiveProfile();
  
  console.log(chalk.bold('\nCurrent Configuration:\n'));
  console.log(chalk.gray(`Active Profile: ${activeProfileName || 'default'}\n`));
  console.log(JSON.stringify(config, null, 2));
}

async function getConfigValue(profileManager: ProfileManager, key: string) {
  const config = await profileManager.getActiveConfig();
  const value = getNestedValue(config, key);
  if (value !== undefined) {
    console.log(chalk.green(`${key}:`), value);
  } else {
    console.log(chalk.red(`Configuration key not found: ${key}`));
  }
}

async function setConfigValue(profileManager: ProfileManager, key: string, value: string) {
  const activeProfileName = await profileManager.getActiveProfile();
  if (!activeProfileName) {
    console.log(chalk.red('No active profile found. Please create a profile first.'));
    return;
  }
  
  const activeProfile = await profileManager.getProfile(activeProfileName);
  if (!activeProfile) {
    console.log(chalk.red('Active profile not found. Please create a profile first.'));
    return;
  }
  
  setNestedValue(activeProfile.config, key, value);
  await profileManager.updateProfile(activeProfileName, { config: activeProfile.config });
  console.log(chalk.green(`✓ Set ${key} = ${value} in profile '${activeProfile.name}'`));
}

async function editConfig(profileManager: ProfileManager) {
  console.log(chalk.bold('\n🔧 Edit Configuration\n'));
  
  const activeProfileName = await profileManager.getActiveProfile();
  if (!activeProfileName) {
    console.log(chalk.red('No active profile found. Please create a profile first.'));
    return;
  }
  
  const activeProfile = await profileManager.getProfile(activeProfileName);
  if (!activeProfile) {
    console.log(chalk.red('Active profile not found. Please create a profile first.'));
    return;
  }
  
  const config = activeProfile.config;
  
  const answers = await inquirer.prompt([
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
      type: 'list',
      name: 'organizationStyle',
      message: 'How should original files be organized?',
      default: config.originals.organizationStyle,
      choices: [
        { name: 'By file type', value: 'type-based' },
        { name: 'By project/context', value: 'project-based' },
        { name: 'By date', value: 'date-based' },
      ],
    },
    {
      type: 'list',
      name: 'mode',
      message: 'Default processing mode:',
      default: config.api.mode,
      choices: [
        { name: 'Claude Code (no API key needed)', value: 'claude-code' },
        { name: 'Claude API (requires API key)', value: 'api' },
        { name: 'Hybrid (API with local fallback)', value: 'hybrid' },
        { name: 'Local only (no AI)', value: 'local' },
      ],
    },
  ]);

  // Update config with new values
  config.vault.path = answers.vaultPath;
  config.originals.path = answers.originalsPath;
  config.originals.organizationStyle = answers.organizationStyle;
  config.api.mode = answers.mode;

  await profileManager.updateProfile(activeProfileName, { config });
  console.log(chalk.green(`\n✓ Profile '${activeProfile.name}' updated successfully!`));
}

async function initializeConfig(profileManager: ProfileManager) {
  console.log(chalk.bold('\n🎯 Polish Configuration Setup\n'));

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'vaultPath',
      message: 'Obsidian vault path:',
      default: path.join(os.homedir(), 'ObsidianVault'),
      validate: (input: string) => input.length > 0 || 'Vault path is required',
    },
    {
      type: 'input',
      name: 'originalsPath',
      message: 'Original files organization path:',
      default: path.join(os.homedir(), 'OrganizedFiles'),
    },
    {
      type: 'checkbox',
      name: 'sources',
      message: 'Select default source folders to monitor:',
      choices: [
        { name: 'Desktop', value: path.join(os.homedir(), 'Desktop') },
        { name: 'Downloads', value: path.join(os.homedir(), 'Downloads') },
        { name: 'Documents', value: path.join(os.homedir(), 'Documents') },
      ],
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
    },
  ]);

  let apiKey: string | undefined;
  if (answers.mode === 'api' || answers.mode === 'hybrid') {
    const apiAnswer = await inquirer.prompt([
      {
        type: 'password',
        name: 'apiKey',
        message: 'Anthropic API key:',
        validate: (input: string) => input.length > 0 || 'API key is required for API mode',
      },
    ]);
    apiKey = apiAnswer.apiKey;
  }

  const config: Config = {
    vault: {
      path: answers.vaultPath,
      structure: {
        documents: 'Documents',
        media: 'Media',
        code: 'Code',
        references: 'References',
      },
    },
    originals: {
      path: answers.originalsPath,
      organizationStyle: answers.organizationStyle,
      createYearFolders: true,
    },
    sources: answers.sources.map((src: string) => ({
      path: src,
      includeSubfolders: false,
    })),
    processing: {
      extractText: true,
      maxFileSize: '50MB',
      supportedFormats: ['pdf', 'docx', 'txt', 'md', 'png', 'jpg', 'py', 'js'],
    },
    tagging: {
      maxTags: 10,
      autoGenerateTypeTags: true,
      autoGenerateDateTags: true,
      customTagPatterns: {},
    },
    api: {
      mode: answers.mode,
      apiKey: apiKey || 'env:ANTHROPIC_API_KEY',
      model: 'claude-3-opus-20240229',
      maxTokens: 4096,
      temperature: 0.3,
    },
  };

  const profileName = 'default';
  await profileManager.createProfile(profileName, config, 'Default configuration profile');
  await profileManager.setActiveProfile(profileName);
  
  console.log(chalk.green('\n✓ Configuration saved successfully!'));
  console.log(chalk.gray('Created profile:'), chalk.cyan(profileName));
  console.log(chalk.gray('You can now run'), chalk.cyan('polish organize'), chalk.gray('to start organizing files'));
}

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((curr, key) => curr?.[key], obj);
}

function setNestedValue(obj: any, path: string, value: any): void {
  const keys = path.split('.');
  const lastKey = keys.pop()!;
  const target = keys.reduce((curr, key) => {
    if (!curr[key]) curr[key] = {};
    return curr[key];
  }, obj);
  
  target[lastKey] = value.toLowerCase() === 'true' ? true :
                     value.toLowerCase() === 'false' ? false :
                     isNaN(Number(value)) ? value : Number(value);
}