import chalk from 'chalk';
import ora from 'ora';
import { ProfileManager } from '../../services/ProfileManager.js';
import { FileScanner } from '../../modules/FileScanner.js';
import { FileProcessor } from '../../modules/FileProcessor.js';
import { ClaudeService } from '../../services/ClaudeService.js';
import { formatDuration } from '../../utils/formatting.js';

interface OrganizeOptions {
  profile?: string;
  vault?: string;
  originals?: string;
  dryRun?: boolean;
  types?: string;
  mode?: string;
  batch?: string;
  copy?: boolean;
}

export async function organizeCommand(source: string | undefined, options: OrganizeOptions) {
  const startTime = Date.now();
  const spinner = ora('Loading configuration...').start();

  try {
    const profileManager = new ProfileManager();
    await profileManager.initialize();
    
    let config;
    if (options.profile) {
      const profile = await profileManager.getProfile(options.profile);
      if (!profile) {
        spinner.fail(`Profile '${options.profile}' not found`);
        console.log(chalk.gray('Available profiles:'));
        const profiles = await profileManager.listProfiles();
        profiles.forEach(p => console.log(chalk.gray(`  - ${p.name}`)));
        return;
      }
      config = profile.config;
      console.log(chalk.gray(`Using profile: ${profile.name}`));
    } else {
      config = await profileManager.getActiveConfig();
    }

    // Apply command-line overrides
    if (options.vault) config.vault.path = options.vault;
    if (options.originals) config.originals.path = options.originals;
    if (options.mode) config.api.mode = options.mode as any;

    spinner.text = 'Initializing services...';
    
    const claudeService = new ClaudeService(config.api);
    const fileScanner = new FileScanner(config);
    const fileProcessor = new FileProcessor(config, claudeService);

    spinner.text = 'Scanning for files...';
    
    const sources = source ? [{ path: source, includeSubfolders: true }] : config.sources;
    const files = await fileScanner.scan(sources, options.types?.split(','));
    
    if (files.length === 0) {
      spinner.warn('No files found to organize');
      return;
    }

    spinner.succeed(`Found ${files.length} files to process`);

    if (options.dryRun) {
      console.log(chalk.yellow('\n🔍 DRY RUN MODE - No files will be moved\n'));
    }

    console.log(chalk.bold('\nProcessing files...\n'));

    const results = await fileProcessor.processFiles(files, {
      dryRun: options.dryRun || false,
      copy: options.copy || false,
      batchSize: parseInt(options.batch || '10'),
      onProgress: (current, total, file) => {
        console.log(chalk.gray(`[${current}/${total}]`), chalk.blue(file.name));
      },
    });

    const duration = Date.now() - startTime;

    console.log(chalk.bold('\n✨ Organization Complete!\n'));
    console.log(chalk.green(`✓ Files processed: ${results.summary.successful}`));
    if (results.summary.failed > 0) {
      console.log(chalk.red(`✗ Failed: ${results.summary.failed}`));
    }
    console.log(chalk.gray(`⏱  Duration: ${formatDuration(duration)}`));

    if (results.failed.length > 0) {
      console.log(chalk.bold('\n❌ Failed files:'));
      results.failed.forEach(({ file, error }) => {
        console.log(chalk.red(`  - ${file.name}: ${error}`));
      });
    }

  } catch (error) {
    spinner.fail('Organization failed');
    console.error(chalk.red('\nError:'), error instanceof Error ? error.message : error);
    process.exit(1);
  }
}