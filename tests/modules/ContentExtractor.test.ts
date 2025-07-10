import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import * as fs from 'fs/promises';
import * as path from 'path';
import { ContentExtractor } from '../../src/modules/ContentExtractor.js';
import { FileInfo, FileType } from '../../src/types/index.js';
import { getTempDir, createTestFiles } from '../setup.js';

describe('ContentExtractor', () => {
  let contentExtractor: ContentExtractor;
  let tempDir: string;

  beforeEach(async () => {
    contentExtractor = new ContentExtractor();
    tempDir = getTempDir('extractor-test');
    await fs.mkdir(tempDir, { recursive: true });
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

  describe('extract', () => {
    it('should extract text content from text files', async () => {
      const testContent = 'This is a test file with some content.';
      const file = createTestFile();
      await createTestFiles([{ path: file.path, content: testContent }]);

      const result = await contentExtractor.extract(file);

      expect(result).toBe(testContent);
    });

    it('should extract content from markdown files', async () => {
      const testContent = '# Test Markdown\n\nThis is a **markdown** file.';
      const file = createTestFile({
        path: path.join(tempDir, 'test.md'),
        name: 'test.md',
        extension: 'md',
        type: FileType.Document,
      });
      await createTestFiles([{ path: file.path, content: testContent }]);

      const result = await contentExtractor.extract(file);

      expect(result).toBe(testContent);
    });

    it('should extract content from code files', async () => {
      const testContent = 'function test() {\n  console.log("Hello, World!");\n}';
      const file = createTestFile({
        path: path.join(tempDir, 'test.js'),
        name: 'test.js',
        extension: 'js',
        type: FileType.Code,
      });
      await createTestFiles([{ path: file.path, content: testContent }]);

      const result = await contentExtractor.extract(file);

      expect(result).toBe(testContent);
    });

    it('should extract content from data files', async () => {
      const testContent = '{"name": "test", "value": 123}';
      const file = createTestFile({
        path: path.join(tempDir, 'test.json'),
        name: 'test.json',
        extension: 'json',
        type: FileType.Data,
      });
      await createTestFiles([{ path: file.path, content: testContent }]);

      const result = await contentExtractor.extract(file);

      expect(result).toBe(testContent);
    });

    it('should return null for image files', async () => {
      const file = createTestFile({
        path: path.join(tempDir, 'test.png'),
        name: 'test.png',
        extension: 'png',
        type: FileType.Image,
      });
      await createTestFiles([{ path: file.path, content: 'fake binary content' }]);

      const result = await contentExtractor.extract(file);

      expect(result).toBeNull();
    });

    it('should return null for PDF files (stub implementation)', async () => {
      const file = createTestFile({
        path: path.join(tempDir, 'test.pdf'),
        name: 'test.pdf',
        extension: 'pdf',
        type: FileType.Document,
      });
      await createTestFiles([{ path: file.path, content: 'fake PDF content' }]);

      const result = await contentExtractor.extract(file);

      expect(result).toBeNull();
    });

    it('should return null for DOCX files (stub implementation)', async () => {
      const file = createTestFile({
        path: path.join(tempDir, 'test.docx'),
        name: 'test.docx',
        extension: 'docx',
        type: FileType.Document,
      });
      await createTestFiles([{ path: file.path, content: 'fake DOCX content' }]);

      const result = await contentExtractor.extract(file);

      expect(result).toBeNull();
    });

    it('should return null for files that are too large', async () => {
      const file = createTestFile({
        size: 20 * 1024 * 1024, // 20MB, over the 10MB limit
      });
      await createTestFiles([{ path: file.path, content: 'content' }]);

      const result = await contentExtractor.extract(file);

      expect(result).toBeNull();
    });

    it('should handle non-existent files gracefully', async () => {
      const file = createTestFile({
        path: path.join(tempDir, 'non-existent.txt'),
      });

      const result = await contentExtractor.extract(file);

      expect(result).toBeNull();
    });

    it('should detect binary files and return null', async () => {
      const binaryContent = Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04, 0x05]);
      const file = createTestFile({
        path: path.join(tempDir, 'binary.bin'),
        name: 'binary.bin',
        extension: 'bin',
        type: FileType.Unknown,
      });
      
      await fs.writeFile(file.path, binaryContent);

      const result = await contentExtractor.extract(file);

      expect(result).toBeNull();
    });

    it('should handle text files with some non-printable characters', async () => {
      const mixedContent = 'Normal text\x01some control char\x02more text';
      const file = createTestFile();
      await createTestFiles([{ path: file.path, content: mixedContent }]);

      const result = await contentExtractor.extract(file);

      // Should still return content if less than 10% non-printable
      expect(result).toBe(mixedContent);
    });

    it('should reject files with too many non-printable characters', async () => {
      const binaryContent = '\x00'.repeat(100) + 'some text';
      const file = createTestFile({
        path: path.join(tempDir, 'mostly-binary.txt'),
        type: FileType.Unknown,
      });
      await createTestFiles([{ path: file.path, content: binaryContent }]);

      const result = await contentExtractor.extract(file);

      expect(result).toBeNull();
    });

    it('should handle UTF-8 encoded text files', async () => {
      const unicodeContent = 'Hello 世界 🌍 café naïve résumé';
      const file = createTestFile();
      await createTestFiles([{ path: file.path, content: unicodeContent }]);

      const result = await contentExtractor.extract(file);

      expect(result).toBe(unicodeContent);
    });
  });
});