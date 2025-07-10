import * as fs from 'fs/promises';
import * as path from 'path';
import { Config, FileInfo, ProcessedFile, OrganizationResult } from '../types/index.js';
import { ClaudeService } from '../services/ClaudeService.js';
import { MarkdownGenerator } from './MarkdownGenerator.js';
import { ContentExtractor } from './ContentExtractor.js';
import { sanitizeFilename, getDatePath } from '../utils/formatting.js';

interface ProcessOptions {
  dryRun: boolean;
  copy: boolean;
  batchSize: number;
  onProgress?: (current: number, total: number, file: FileInfo) => void;
}

export class FileProcessor {
  private config: Config;
  private claudeService: ClaudeService;
  private markdownGenerator: MarkdownGenerator;
  private contentExtractor: ContentExtractor;

  constructor(config: Config, claudeService: ClaudeService) {
    this.config = config;
    this.claudeService = claudeService;
    this.markdownGenerator = new MarkdownGenerator();
    this.contentExtractor = new ContentExtractor();
  }

  async processFiles(files: FileInfo[], options: ProcessOptions): Promise<OrganizationResult> {
    const results: OrganizationResult = {
      processed: [],
      failed: [],
      summary: {
        total: files.length,
        successful: 0,
        failed: 0,
        duration: 0,
      },
    };

    const startTime = Date.now();

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (options.onProgress) {
        options.onProgress(i + 1, files.length, file);
      }

      try {
        const processed = await this.processFile(file, options);
        results.processed.push(processed);
        results.summary.successful++;
      } catch (error) {
        results.failed.push({
          file,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        results.summary.failed++;
      }
    }

    results.summary.duration = Date.now() - startTime;
    return results;
  }

  private async processFile(file: FileInfo, options: ProcessOptions): Promise<ProcessedFile> {
    // Extract content
    const content = await this.contentExtractor.extract(file);

    // Get tag suggestions
    const tagSuggestions = await this.claudeService.suggestTags(file, content || undefined);
    const tags = tagSuggestions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, this.config.tagging.maxTags)
      .map(t => t.tag);

    // Get category suggestion
    const existingFolders = await this.getExistingVaultFolders();
    const categorySuggestion = await this.claudeService.suggestCategory(file, existingFolders);

    // Determine paths
    const vaultCategory = this.mapCategoryToVaultFolder(categorySuggestion.category);
    const markdownPath = path.join(
      this.config.vault.path,
      vaultCategory,
      sanitizeFilename(path.parse(file.name).name + '.md')
    );

    const originalNewPath = this.getOriginalFilePath(file, categorySuggestion.category);

    // Generate markdown content
    const frontmatter = {
      title: path.parse(file.name).name,
      originalFile: `[[file://${file.path}]]`,
      fileType: file.extension,
      created: file.createdAt.toISOString(),
      processed: new Date().toISOString(),
      tags,
    };

    const markdownContent = this.markdownGenerator.generate(file, content, frontmatter);

    // Execute file operations (unless dry run)
    if (!options.dryRun) {
      await this.ensureDirectory(path.dirname(markdownPath));
      await this.ensureDirectory(path.dirname(originalNewPath));
      
      await fs.writeFile(markdownPath, markdownContent);
      
      if (options.copy) {
        await fs.copyFile(file.path, originalNewPath);
      } else {
        await fs.rename(file.path, originalNewPath);
      }
    }

    return {
      original: file,
      markdownPath,
      originalNewPath,
      content: markdownContent,
      frontmatter,
      tags,
      category: categorySuggestion.category,
    };
  }

  private async getExistingVaultFolders(): Promise<string[]> {
    try {
      const entries = await fs.readdir(this.config.vault.path, { withFileTypes: true });
      return entries
        .filter(entry => entry.isDirectory() && !entry.name.startsWith('.'))
        .map(entry => entry.name);
    } catch {
      return [];
    }
  }

  private mapCategoryToVaultFolder(category: string): string {
    const typeMap: Record<string, string> = {
      document: this.config.vault.structure.documents,
      image: this.config.vault.structure.media,
      code: this.config.vault.structure.code,
      media: this.config.vault.structure.media,
    };

    return typeMap[category.toLowerCase()] || this.config.vault.structure.references;
  }

  private getOriginalFilePath(file: FileInfo, category: string): string {
    let basePath = this.config.originals.path;

    if (this.config.originals.createYearFolders) {
      basePath = path.join(basePath, file.modifiedAt.getFullYear().toString());
    }

    if (this.config.originals.organizationStyle === 'type-based') {
      basePath = path.join(basePath, category);
    } else if (this.config.originals.organizationStyle === 'date-based') {
      basePath = path.join(basePath, getDatePath());
    }

    return path.join(basePath, file.name);
  }

  private async ensureDirectory(dirPath: string): Promise<void> {
    await fs.mkdir(dirPath, { recursive: true });
  }
}