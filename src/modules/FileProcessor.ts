import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { Config, FileInfo, ProcessedFile, OrganizationResult, FileType } from '../types/index.js';
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
    // Handle archives with recursive processing
    if (file.type === FileType.Archive) {
      return await this.processArchiveRecursively(file, options);
    }

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
      originalFile: `[[file://${originalNewPath}]]`,
      sourceLocation: file.path, // Keep reference to source for debugging
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

  private async processArchiveRecursively(file: FileInfo, options: ProcessOptions): Promise<ProcessedFile> {
    const tempExtractDir = await fs.mkdtemp(path.join(os.tmpdir(), 'polish-archive-'));
    
    try {
      console.log(`📦 Expanding archive: ${file.name}`);
      
      // Extract archive contents
      const extractedFiles = await this.extractArchive(file, tempExtractDir);
      
      if (extractedFiles.length === 0) {
        console.log(`⚠️  Archive ${file.name} appears to be empty or could not be extracted`);
        return await this.processFileAsNormal(file, options);
      }

      console.log(`📁 Found ${extractedFiles.length} files in archive`);

      // Process each extracted file recursively
      const childResults: ProcessedFile[] = [];
      
      for (const extractedFile of extractedFiles) {
        try {
          // Create FileInfo for the extracted file
          const stat = await fs.stat(extractedFile);
          const fileInfo: FileInfo = {
            path: extractedFile,
            name: path.basename(extractedFile),
            extension: path.extname(extractedFile).slice(1).toLowerCase(),
            size: stat.size,
            createdAt: stat.birthtime,
            modifiedAt: stat.mtime,
            type: this.determineFileType(path.extname(extractedFile).slice(1).toLowerCase()),
          };

          // Recursively process the extracted file
          const processed = await this.processFile(fileInfo, options);
          childResults.push(processed);
        } catch (error) {
          console.warn(`Failed to process extracted file ${extractedFile}:`, error);
        }
      }

      // Create summary markdown for the archive
      const archiveContent = this.generateArchiveSummary(file, childResults);
      const tags = await this.generateArchiveTags(file, childResults);
      
      // Determine paths for the archive summary
      const categorySuggestion = await this.claudeService.suggestCategory(file, await this.getExistingVaultFolders());
      const vaultCategory = this.mapCategoryToVaultFolder(categorySuggestion.category);
      const markdownPath = path.join(
        this.config.vault.path,
        vaultCategory,
        sanitizeFilename(path.parse(file.name).name + '_archive.md')
      );

      const originalNewPath = this.getOriginalFilePath(file, categorySuggestion.category);

      // Generate frontmatter for archive summary
      const frontmatter = {
        title: `Archive: ${path.parse(file.name).name}`,
        originalFile: `[[file://${originalNewPath}]]`,
        sourceLocation: file.path,
        fileType: file.extension,
        archiveType: 'expanded',
        extractedFiles: childResults.length,
        created: file.createdAt.toISOString(),
        processed: new Date().toISOString(),
        tags,
      };

      const markdownContent = this.markdownGenerator.generate(file, archiveContent, frontmatter);

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

    } finally {
      // Always clean up the temporary extraction directory
      try {
        await fs.rm(tempExtractDir, { recursive: true, force: true });
      } catch (error) {
        console.warn(`Failed to clean up temporary directory ${tempExtractDir}:`, error);
      }
    }
  }

  private async extractArchive(file: FileInfo, outputDir: string): Promise<string[]> {
    const extractedFiles: string[] = [];
    
    try {
      if (file.extension.toLowerCase() === 'zip') {
        try {
          // Dynamically import unzipper to handle cases where it's not installed
          const unzipperModule = await import('unzipper' as any);
          const unzipper = unzipperModule.default || unzipperModule;
          
          const archive = await unzipper.Open.file(file.path);
          
          for (const entry of archive.files) {
            if (!entry.type || entry.type === 'File') {
              // Security check: prevent path traversal
              const safePath = path.join(outputDir, entry.path.replace(/^\/+/, '').replace(/\.\./g, ''));
              
              // Ensure the directory exists
              await fs.mkdir(path.dirname(safePath), { recursive: true });
              
              // Extract the file
              const buffer = await entry.buffer();
              await fs.writeFile(safePath, buffer);
              extractedFiles.push(safePath);
            }
          }
        } catch (importError) {
          console.warn(`Archive extraction requires 'unzipper' package. Install with: npm install unzipper`);
          console.warn(`Skipping extraction of ${file.name}`);
        }
      } else {
        // For other archive types, we could add support for tar, rar, etc.
        console.warn(`Archive type ${file.extension} not yet supported for extraction`);
      }
    } catch (error) {
      console.warn(`Failed to extract archive ${file.name}:`, error);
    }

    return extractedFiles;
  }

  private async processFileAsNormal(file: FileInfo, options: ProcessOptions): Promise<ProcessedFile> {
    // This is the original processFile logic for non-archives
    const content = await this.contentExtractor.extract(file);

    const tagSuggestions = await this.claudeService.suggestTags(file, content || undefined);
    const tags = tagSuggestions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, this.config.tagging.maxTags)
      .map(t => t.tag);

    const existingFolders = await this.getExistingVaultFolders();
    const categorySuggestion = await this.claudeService.suggestCategory(file, existingFolders);

    const vaultCategory = this.mapCategoryToVaultFolder(categorySuggestion.category);
    const markdownPath = path.join(
      this.config.vault.path,
      vaultCategory,
      sanitizeFilename(path.parse(file.name).name + '.md')
    );

    const originalNewPath = this.getOriginalFilePath(file, categorySuggestion.category);

    const frontmatter = {
      title: path.parse(file.name).name,
      originalFile: `[[file://${originalNewPath}]]`,
      sourceLocation: file.path,
      fileType: file.extension,
      created: file.createdAt.toISOString(),
      processed: new Date().toISOString(),
      tags,
    };

    const markdownContent = this.markdownGenerator.generate(file, content, frontmatter);

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

  private generateArchiveSummary(archiveFile: FileInfo, extractedFiles: ProcessedFile[]): string {
    const summary = [
      `# Archive: ${archiveFile.name}`,
      '',
      `This archive contained ${extractedFiles.length} files that were extracted and processed:`,
      '',
    ];

    // Group by category
    const byCategory = extractedFiles.reduce((groups, file) => {
      const category = file.category || 'unknown';
      if (!groups[category]) groups[category] = [];
      groups[category].push(file);
      return groups;
    }, {} as Record<string, ProcessedFile[]>);

    Object.entries(byCategory).forEach(([category, files]) => {
      summary.push(`## ${category.charAt(0).toUpperCase() + category.slice(1)} Files (${files.length})`);
      summary.push('');
      
      files.forEach(file => {
        const linkName = path.parse(file.original.name).name;
        const relativePath = path.relative(this.config.vault.path, file.markdownPath);
        summary.push(`- [[${relativePath.replace(/\.md$/, '')}|${linkName}]]`);
      });
      summary.push('');
    });

    return summary.join('\n');
  }

  private async generateArchiveTags(archiveFile: FileInfo, extractedFiles: ProcessedFile[]): Promise<string[]> {
    const tags = new Set<string>();
    
    // Add archive-specific tags
    tags.add('type/archive');
    tags.add(`format/${archiveFile.extension}`);
    tags.add('source/expanded');
    
    // Add date tag
    const year = archiveFile.modifiedAt.getFullYear();
    const month = String(archiveFile.modifiedAt.getMonth() + 1).padStart(2, '0');
    tags.add(`date/${year}/${month}`);

    // Aggregate tags from extracted files
    const childTags = new Set<string>();
    extractedFiles.forEach(file => {
      file.tags.forEach(tag => {
        if (!tag.startsWith('type/') && !tag.startsWith('format/')) {
          childTags.add(tag);
        }
      });
    });

    // Add most common child tags
    const tagCounts = Array.from(childTags).map(tag => ({
      tag,
      count: extractedFiles.filter(file => file.tags.includes(tag)).length
    }));

    tagCounts
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .forEach(({ tag }) => tags.add(`contains/${tag.split('/').pop()}`));

    return Array.from(tags).slice(0, this.config.tagging.maxTags);
  }

  private determineFileType(extension: string): FileType {
    const ext = extension.toLowerCase();
    
    // Documents
    if (['pdf', 'doc', 'docx', 'txt', 'md', 'rtf', 'odt'].includes(ext)) {
      return FileType.Document;
    }
    
    // Images
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(ext)) {
      return FileType.Image;
    }
    
    // Code
    if (['js', 'ts', 'py', 'java', 'cpp', 'c', 'go', 'rs', 'rb', 'php'].includes(ext)) {
      return FileType.Code;
    }
    
    // Data
    if (['json', 'csv', 'xml', 'yaml', 'yml'].includes(ext)) {
      return FileType.Data;
    }
    
    // Media
    if (['mp3', 'wav', 'mp4', 'avi', 'mov', 'mkv'].includes(ext)) {
      return FileType.Media;
    }
    
    // Archives
    if (['zip', 'rar', 'tar', 'gz', '7z'].includes(ext)) {
      return FileType.Archive;
    }
    
    return FileType.Unknown;
  }
}