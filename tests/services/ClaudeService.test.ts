import { describe, it, expect, beforeEach } from '@jest/globals';
import { ClaudeService } from '../../src/services/ClaudeService.js';
import { ApiConfig, FileInfo, FileType } from '../../src/types/index.js';

describe('ClaudeService', () => {
  let claudeService: ClaudeService;
  let config: ApiConfig;

  beforeEach(() => {
    config = {
      mode: 'claude-code',
      apiKey: 'test-key',
      model: 'claude-3-opus',
      maxTokens: 1000,
      temperature: 0.3,
    };
    claudeService = new ClaudeService(config);
  });

  const createTestFile = (overrides: Partial<FileInfo> = {}): FileInfo => ({
    path: '/test/path/file.txt',
    name: 'file.txt',
    extension: 'txt',
    size: 1024,
    createdAt: new Date('2024-01-01'),
    modifiedAt: new Date('2024-01-15'),
    type: FileType.Document,
    ...overrides,
  });

  describe('suggestTags', () => {
    it('should generate basic tags for a file', async () => {
      const file = createTestFile();
      const tags = await claudeService.suggestTags(file);

      expect(tags).toBeInstanceOf(Array);
      expect(tags.length).toBeGreaterThan(0);
      
      // Should include type tag
      const typeTag = tags.find(t => t.tag === 'type/document');
      expect(typeTag).toBeDefined();
      expect(typeTag?.confidence).toBe(1.0);
      expect(typeTag?.source).toBe('type');

      // Should include format tag
      const formatTag = tags.find(t => t.tag === 'format/txt');
      expect(formatTag).toBeDefined();
      expect(formatTag?.confidence).toBe(1.0);
      expect(formatTag?.source).toBe('type');
    });

    it('should generate date-based tags', async () => {
      const file = createTestFile({
        modifiedAt: new Date('2024-03-15'),
      });
      const tags = await claudeService.suggestTags(file);

      const dateTag = tags.find(t => t.tag === 'date/2024/03');
      expect(dateTag).toBeDefined();
      expect(dateTag?.confidence).toBe(1.0);
      expect(dateTag?.source).toBe('context');
    });

    it('should generate filename-based tags', async () => {
      const file = createTestFile({
        name: 'project-meeting-notes.txt',
      });
      const tags = await claudeService.suggestTags(file);

      const topicTags = tags.filter(t => t.source === 'filename');
      expect(topicTags.length).toBeGreaterThan(0);
      
      // Should extract meaningful words from filename
      const projectTag = topicTags.find(t => t.tag === 'topic/project');
      const meetingTag = topicTags.find(t => t.tag === 'topic/meeting');
      const notesTag = topicTags.find(t => t.tag === 'topic/notes');

      expect(projectTag).toBeDefined();
      expect(meetingTag).toBeDefined();
      expect(notesTag).toBeDefined();
    });

    it('should handle different file types correctly', async () => {
      const testCases = [
        { type: FileType.Image, extension: 'png', expectedTypeTag: 'type/image' },
        { type: FileType.Code, extension: 'py', expectedTypeTag: 'type/code' },
        { type: FileType.Data, extension: 'json', expectedTypeTag: 'type/data' },
        { type: FileType.Archive, extension: 'zip', expectedTypeTag: 'type/archive' },
      ];

      for (const testCase of testCases) {
        const file = createTestFile({
          type: testCase.type,
          extension: testCase.extension,
        });
        const tags = await claudeService.suggestTags(file);

        const typeTag = tags.find(t => t.tag === testCase.expectedTypeTag);
        expect(typeTag).toBeDefined();
        expect(typeTag?.confidence).toBe(1.0);
      }
    });

    it('should filter out short words from filename', async () => {
      const file = createTestFile({
        name: 'a-big-data-file.txt',
      });
      const tags = await claudeService.suggestTags(file);

      const filenameBasedTags = tags.filter(t => t.source === 'filename');
      
      // Should not include short words like 'a'
      const shortWordTag = filenameBasedTags.find(t => t.tag === 'topic/a');
      expect(shortWordTag).toBeUndefined();
      
      // Should include longer words
      const dataTag = filenameBasedTags.find(t => t.tag === 'topic/data');
      const fileTag = filenameBasedTags.find(t => t.tag === 'topic/file');
      expect(dataTag).toBeDefined();
      expect(fileTag).toBeDefined();
    });
  });

  describe('suggestCategory', () => {
    it('should suggest category based on file type', async () => {
      const file = createTestFile({ type: FileType.Document });
      const result = await claudeService.suggestCategory(file, []);

      expect(result.category).toBe('Document');
      expect(result.confidence).toBe(0.8);
      expect(result.reasoning).toBe('Based on file type and name analysis');
    });

    it('should match existing folder names', async () => {
      const file = createTestFile({
        name: 'project-report.txt',
        type: FileType.Document,
      });
      const existingFolders = ['Projects', 'Reports', 'Archive'];
      const result = await claudeService.suggestCategory(file, existingFolders);

      expect(result.category).toBe('Projects');
      expect(result.confidence).toBe(0.8);
    });

    it('should handle different file types', async () => {
      const testCases = [
        { type: FileType.Image, expected: 'Image' },
        { type: FileType.Code, expected: 'Code' },
        { type: FileType.Data, expected: 'Data' },
        { type: FileType.Archive, expected: 'Archive' },
      ];

      for (const testCase of testCases) {
        const file = createTestFile({ type: testCase.type });
        const result = await claudeService.suggestCategory(file, []);

        expect(result.category).toBe(testCase.expected);
      }
    });
  });

  describe('analyzeContent', () => {
    it('should analyze file content and return summary', async () => {
      const file = createTestFile();
      const content = 'This is a test document with some content.';
      const result = await claudeService.analyzeContent(file, content);

      expect(result.summary).toBe('File file.txt of type document');
      expect(result.tags).toContain('type/document');
      expect(result.tags).toContain('format/txt');
      expect(result.category).toBe('document');
    });

    it('should handle different file types in analysis', async () => {
      const testCases = [
        { type: FileType.Code, extension: 'py', expected: 'code' },
        { type: FileType.Image, extension: 'png', expected: 'image' },
        { type: FileType.Data, extension: 'json', expected: 'data' },
      ];

      for (const testCase of testCases) {
        const file = createTestFile({
          type: testCase.type,
          extension: testCase.extension,
          name: `file.${testCase.extension}`,
        });
        const result = await claudeService.analyzeContent(file, 'content');

        expect(result.summary).toContain(testCase.expected);
        expect(result.category).toBe(testCase.expected);
      }
    });
  });
});