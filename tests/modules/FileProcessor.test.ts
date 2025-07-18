import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import * as fs from 'fs/promises';
import * as path from 'path';
import { FileProcessor } from '../../src/modules/FileProcessor.js';
import { ClaudeService } from '../../src/services/ClaudeService.js';
import { Config, FileInfo, FileType } from '../../src/types/index.js';
import { getTempDir, createTestFiles } from '../setup.js';

describe('FileProcessor', () => {
  let fileProcessor: FileProcessor;
  let claudeService: ClaudeService;
  let tempDir: string;
  let config: Config;

  beforeEach(async () => {
    tempDir = getTempDir('processor-test');
    await fs.mkdir(tempDir, { recursive: true });

    config = {
      vault: {
        path: path.join(tempDir, 'vault'),
        structure: {
          documents: 'Documents',
          media: 'Media',
          code: 'Code',
          references: 'References',
        },
      },
      originals: {
        path: path.join(tempDir, 'originals'),
        organizationStyle: 'type-based',
        createYearFolders: true,
      },
      sources: [],
      processing: {
        extractText: true,
        maxFileSize: '50MB',
        supportedFormats: ['txt', 'md', 'py', 'js', 'json'],
      },
      tagging: {
        maxTags: 5,
        autoGenerateTypeTags: true,
        autoGenerateDateTags: true,
        customTagPatterns: {},
      },
      api: {
        mode: 'claude-code',
        apiKey: 'test-key',
      },
    };

    claudeService = new ClaudeService(config.api);
    fileProcessor = new FileProcessor(config, claudeService);
  });

  afterEach(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  const createTestFile = (overrides: Partial<FileInfo> = {}): FileInfo => ({
    path: path.join(tempDir, 'test.txt'),
    name: 'test.txt',
    extension: 'txt',
    size: 1024,
    createdAt: new Date('2024-01-01'),
    modifiedAt: new Date('2024-01-15'),
    type: FileType.Document,
    ...overrides,
  });

  describe('processFiles', () => {
    it('should process multiple files successfully', async () => {
      const files = [
        createTestFile({ path: path.join(tempDir, 'doc1.txt'), name: 'doc1.txt' }),
        createTestFile({ path: path.join(tempDir, 'doc2.txt'), name: 'doc2.txt' }),
      ];

      await createTestFiles([
        { path: files[0].path, content: 'Document 1 content' },
        { path: files[1].path, content: 'Document 2 content' },
      ]);

      const result = await fileProcessor.processFiles(files, {
        dryRun: true,
        copy: false,
        batchSize: 10,
      });

      expect(result.summary.total).toBe(2);
      expect(result.summary.successful).toBe(2);
      expect(result.summary.failed).toBe(0);
      expect(result.processed).toHaveLength(2);
    });

    it('should handle progress callback', async () => {
      const files = [
        createTestFile({ path: path.join(tempDir, 'doc1.txt'), name: 'doc1.txt' }),
        createTestFile({ path: path.join(tempDir, 'doc2.txt'), name: 'doc2.txt' }),
      ];

      await createTestFiles([
        { path: files[0].path, content: 'Content 1' },
        { path: files[1].path, content: 'Content 2' },
      ]);

      const progressCalls: Array<{ current: number; total: number; fileName: string }> = [];

      await fileProcessor.processFiles(files, {
        dryRun: true,
        copy: false,
        batchSize: 10,
        onProgress: (current, total, file) => {
          progressCalls.push({ current, total, fileName: file.name });
        },
      });

      expect(progressCalls).toHaveLength(2);
      expect(progressCalls[0]).toEqual({ current: 1, total: 2, fileName: 'doc1.txt' });
      expect(progressCalls[1]).toEqual({ current: 2, total: 2, fileName: 'doc2.txt' });
    });

    it('should handle file processing errors gracefully', async () => {
      const files = [
        createTestFile({ path: path.join(tempDir, 'good.txt'), name: 'good.txt' }),
        createTestFile({ path: path.join(tempDir, 'nonexistent.txt'), name: 'nonexistent.txt' }),
      ];

      await createTestFiles([
        { path: files[0].path, content: 'Good content' },
        // Don't create the second file to cause an error
      ]);

      const result = await fileProcessor.processFiles(files, {
        dryRun: true,
        copy: false,
        batchSize: 10,
      });

      expect(result.summary.total).toBe(2);
      expect(result.summary.successful).toBe(1);
      expect(result.summary.failed).toBe(1);
      expect(result.processed).toHaveLength(1);
      expect(result.failed).toHaveLength(1);
      expect(result.failed[0].file.name).toBe('nonexistent.txt');
    });

    it('should create directories when not in dry-run mode', async () => {
      const file = createTestFile({
        path: path.join(tempDir, 'source', 'document.txt'),
        name: 'document.txt',
      });

      await createTestFiles([
        { path: file.path, content: 'Test content' },
      ]);

      await fileProcessor.processFiles([file], {
        dryRun: false,
        copy: false,
        batchSize: 10,
      });

      // Check that vault directories were created
      const vaultDocsPath = path.join(config.vault.path, 'Documents');
      const vaultExists = await fs.access(vaultDocsPath).then(() => true).catch(() => false);
      expect(vaultExists).toBe(true);

      // Check that originals directories were created
      const currentYear = new Date().getFullYear();
      const originalsPath = path.join(config.originals.path, currentYear.toString(), 'Document');
      const originalsExists = await fs.access(originalsPath).then(() => true).catch(() => false);
      expect(originalsExists).toBe(true);
    });

    it('should copy files when copy mode is enabled', async () => {
      const file = createTestFile({
        path: path.join(tempDir, 'source', 'document.txt'),
        name: 'document.txt',
      });

      await createTestFiles([
        { path: file.path, content: 'Test content for copying' },
      ]);

      await fileProcessor.processFiles([file], {
        dryRun: false,
        copy: true,
        batchSize: 10,
      });

      // Original file should still exist
      const originalExists = await fs.access(file.path).then(() => true).catch(() => false);
      expect(originalExists).toBe(true);

      // Copy should exist in organized location
      const currentYear = new Date().getFullYear();
      const copyPath = path.join(config.originals.path, currentYear.toString(), 'Document', 'document.txt');
      const copyExists = await fs.access(copyPath).then(() => true).catch(() => false);
      expect(copyExists).toBe(true);
    });

    it('should move files when copy mode is disabled', async () => {
      const file = createTestFile({
        path: path.join(tempDir, 'source', 'document.txt'),
        name: 'document.txt',
      });

      await createTestFiles([
        { path: file.path, content: 'Test content for moving' },
      ]);

      await fileProcessor.processFiles([file], {
        dryRun: false,
        copy: false,
        batchSize: 10,
      });

      // Original file should not exist
      const originalExists = await fs.access(file.path).then(() => true).catch(() => false);
      expect(originalExists).toBe(false);

      // File should exist in organized location
      const currentYear = new Date().getFullYear();
      const newPath = path.join(config.originals.path, currentYear.toString(), 'Document', 'document.txt');
      const newExists = await fs.access(newPath).then(() => true).catch(() => false);
      expect(newExists).toBe(true);
    });

    it('should respect tagging configuration limits', async () => {
      const file = createTestFile({
        name: 'project-management-system-documentation-final-version.txt',
      });

      await createTestFiles([
        { path: file.path, content: 'Content with many potential tags' },
      ]);

      const result = await fileProcessor.processFiles([file], {
        dryRun: true,
        copy: false,
        batchSize: 10,
      });

      const processed = result.processed[0];
      expect(processed.tags.length).toBeLessThanOrEqual(config.tagging.maxTags);
    });

    it('should handle different organization styles', async () => {
      // Test type-based organization
      const file = createTestFile({ type: FileType.Code, extension: 'py', name: 'script.py' });
      await createTestFiles([{ path: file.path, content: 'print("hello")' }]);

      let result = await fileProcessor.processFiles([file], {
        dryRun: true,
        copy: false,
        batchSize: 10,
      });

      expect(result.processed[0].originalNewPath).toContain('Code');

      // Test date-based organization
      config.originals.organizationStyle = 'date-based';
      fileProcessor = new FileProcessor(config, claudeService);

      result = await fileProcessor.processFiles([file], {
        dryRun: true,
        copy: false,
        batchSize: 10,
      });

      const currentYear = new Date().getFullYear();
      const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
      expect(result.processed[0].originalNewPath).toContain(`${currentYear}/${currentMonth}`);
    });

    it('should map file types to correct vault folders', async () => {
      const testCases = [
        { type: FileType.Document, extension: 'txt', expectedFolder: 'Documents' },
        { type: FileType.Image, extension: 'png', expectedFolder: 'Media' },
        { type: FileType.Code, extension: 'py', expectedFolder: 'Code' },
        { type: FileType.Data, extension: 'json', expectedFolder: 'References' },
        { type: FileType.Unknown, extension: 'xyz', expectedFolder: 'References' },
      ];

      for (const testCase of testCases) {
        const file = createTestFile({
          type: testCase.type,
          extension: testCase.extension,
          name: `test.${testCase.extension}`,
          path: path.join(tempDir, `test.${testCase.extension}`),
        });

        await createTestFiles([{ path: file.path, content: 'test content' }]);

        const result = await fileProcessor.processFiles([file], {
          dryRun: true,
          copy: false,
          batchSize: 10,
        });

        expect(result.processed[0].markdownPath).toContain(testCase.expectedFolder);
      }
    });

    it('should handle year folder creation option', async () => {
      const file = createTestFile();
      await createTestFiles([{ path: file.path, content: 'content' }]);

      // Test with year folders enabled
      config.originals.createYearFolders = true;
      fileProcessor = new FileProcessor(config, claudeService);

      let result = await fileProcessor.processFiles([file], {
        dryRun: true,
        copy: false,
        batchSize: 10,
      });

      const currentYear = new Date().getFullYear();
      expect(result.processed[0].originalNewPath).toContain(currentYear.toString());

      // Test with year folders disabled
      config.originals.createYearFolders = false;
      fileProcessor = new FileProcessor(config, claudeService);

      result = await fileProcessor.processFiles([file], {
        dryRun: true,
        copy: false,
        batchSize: 10,
      });

      expect(result.processed[0].originalNewPath).not.toContain(currentYear.toString());
    });

    it('should generate correct frontmatter', async () => {
      const file = createTestFile({
        name: 'test-document.txt',
        createdAt: new Date('2024-01-01T10:00:00Z'),
        modifiedAt: new Date('2024-01-15T15:30:00Z'),
      });

      await createTestFiles([{ path: file.path, content: 'Test content' }]);

      const result = await fileProcessor.processFiles([file], {
        dryRun: true,
        copy: false,
        batchSize: 10,
      });

      const processed = result.processed[0];
      const frontmatter = processed.frontmatter;

      expect(frontmatter.title).toBe('test-document');
      expect(frontmatter.originalFile).toContain('file://');
      expect(frontmatter.fileType).toBe('txt');
      expect(frontmatter.created).toBe('2024-01-01T10:00:00.000Z');
      expect(frontmatter.processed).toBeDefined();
      expect(frontmatter.tags).toBeInstanceOf(Array);
      expect(frontmatter.tags.length).toBeGreaterThan(0);
    });

    it('should handle files with null content', async () => {
      const file = createTestFile({
        type: FileType.Image,
        extension: 'png',
        name: 'image.png',
        path: path.join(tempDir, 'image.png'),
      });

      await createTestFiles([{ path: file.path, content: 'binary-image-data' }]);

      const result = await fileProcessor.processFiles([file], {
        dryRun: true,
        copy: false,
        batchSize: 10,
      });

      expect(result.summary.successful).toBe(1);
      const processed = result.processed[0];
      expect(processed.content).toContain('# image');
      expect(processed.content).toContain('![[image.png]]');
    });

    it('should calculate processing duration', async () => {
      const files = [createTestFile()];
      await createTestFiles([{ path: files[0].path, content: 'content' }]);

      const result = await fileProcessor.processFiles(files, {
        dryRun: true,
        copy: false,
        batchSize: 10,
      });

      expect(result.summary.duration).toBeGreaterThan(0);
      expect(typeof result.summary.duration).toBe('number');
    });
  });
});