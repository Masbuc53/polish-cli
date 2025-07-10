import chalk from 'chalk';
import ora from 'ora';
import * as fs from 'fs/promises';
import { ConfigService } from '../../services/ConfigService.js';
import { FileScanner } from '../../modules/FileScanner.js';
import { FileType } from '../../types/index.js';
import { formatBytes } from '../../utils/formatting.js';

interface AnalyzeOptions {
  types?: string;
  report?: string;
}

export async function analyzeCommand(source: string | undefined, options: AnalyzeOptions) {
  const spinner = ora('Loading configuration...').start();

  try {
    const configService = new ConfigService();
    const config = await configService.load();
    const fileScanner = new FileScanner(config);

    spinner.text = 'Scanning for files...';
    
    const sources = source ? [{ path: source, includeSubfolders: true }] : config.sources;
    const files = await fileScanner.scan(sources, options.types?.split(','));

    spinner.succeed(`Found ${files.length} files`);

    const analysis = {
      total: files.length,
      totalSize: files.reduce((sum, f) => sum + f.size, 0),
      byType: {} as Record<FileType, { count: number; size: number }>,
      byExtension: {} as Record<string, number>,
      oldestFile: files.reduce((oldest, f) => 
        f.modifiedAt < oldest.modifiedAt ? f : oldest, files[0]),
      newestFile: files.reduce((newest, f) => 
        f.modifiedAt > newest.modifiedAt ? f : newest, files[0]),
    };

    files.forEach(file => {
      if (!analysis.byType[file.type]) {
        analysis.byType[file.type] = { count: 0, size: 0 };
      }
      analysis.byType[file.type].count++;
      analysis.byType[file.type].size += file.size;

      analysis.byExtension[file.extension] = (analysis.byExtension[file.extension] || 0) + 1;
    });

    console.log(chalk.bold('\n📊 File Analysis Report\n'));
    console.log(chalk.cyan('Total files:'), analysis.total);
    console.log(chalk.cyan('Total size:'), formatBytes(analysis.totalSize));
    console.log(chalk.cyan('Date range:'), 
      `${analysis.oldestFile?.modifiedAt.toLocaleDateString()} - ${analysis.newestFile?.modifiedAt.toLocaleDateString()}`);

    console.log(chalk.bold('\n📁 By Type:'));
    Object.entries(analysis.byType).forEach(([type, data]) => {
      console.log(`  ${type}: ${data.count} files (${formatBytes(data.size)})`);
    });

    console.log(chalk.bold('\n📄 Top Extensions:'));
    const topExtensions = Object.entries(analysis.byExtension)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);
    topExtensions.forEach(([ext, count]) => {
      console.log(`  .${ext}: ${count} files`);
    });

    if (options.report) {
      await fs.writeFile(options.report, JSON.stringify(analysis, null, 2));
      console.log(chalk.green(`\n✓ Report saved to ${options.report}`));
    }

  } catch (error) {
    spinner.fail('Analysis failed');
    console.error(chalk.red('\nError:'), error instanceof Error ? error.message : error);
    process.exit(1);
  }
}