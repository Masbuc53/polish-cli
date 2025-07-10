import { describe, it, expect } from '@jest/globals';
import { MarkdownGenerator } from '../../src/modules/MarkdownGenerator.js';
import { FileInfo, FileType, Frontmatter } from '../../src/types/index.js';

describe('MarkdownGenerator', () => {
  let markdownGenerator: MarkdownGenerator;

  beforeEach(() => {
    markdownGenerator = new MarkdownGenerator();
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

  const createTestFrontmatter = (overrides: Partial<Frontmatter> = {}): Frontmatter => ({
    title: 'Test File',
    originalFile: '[[file:///test/path/file.txt]]',
    fileType: 'txt',
    created: '2024-01-01T00:00:00.000Z',
    processed: '2024-01-15T00:00:00.000Z',
    tags: ['type/document', 'format/txt'],
    ...overrides,
  });

  describe('generate', () => {
    it('should generate markdown with frontmatter', () => {
      const file = createTestFile();
      const frontmatter = createTestFrontmatter();
      const content = 'This is test content';

      const result = markdownGenerator.generate(file, content, frontmatter);

      expect(result).toContain('---');
      expect(result).toContain('title: "Test File"');
      expect(result).toContain('tags:');
      expect(result).toContain('  - type/document');
      expect(result).toContain('  - format/txt');
      expect(result).toContain('# Test File');
      expect(result).toContain('*Original file: [file.txt](file:///test/path/file.txt)*');
    });

    it('should generate document content correctly', () => {
      const file = createTestFile({ type: FileType.Document });
      const frontmatter = createTestFrontmatter();
      const content = 'This is a document with multiple lines.\n\nAnd paragraphs.';

      const result = markdownGenerator.generate(file, content, frontmatter);

      expect(result).toContain('## Content');
      expect(result).toContain('This is a document with multiple lines.');
      expect(result).toContain('And paragraphs.');
    });

    it('should generate image content correctly', () => {
      const file = createTestFile({ 
        type: FileType.Image, 
        name: 'image.png', 
        extension: 'png' 
      });
      const frontmatter = createTestFrontmatter({ title: 'Test Image' });

      const result = markdownGenerator.generate(file, null, frontmatter);

      expect(result).toContain('![[image.png]]');
      expect(result).toContain('## Description');
      expect(result).toContain('Image file: image.png');
      expect(result).toContain('## Properties');
      expect(result).toContain('- **Format**: PNG');
      expect(result).toContain('- **Size**: 1 KB');
    });

    it('should generate code content correctly', () => {
      const file = createTestFile({ 
        type: FileType.Code, 
        name: 'script.py', 
        extension: 'py' 
      });
      const frontmatter = createTestFrontmatter({ title: 'Python Script' });
      const content = 'def hello():\n    print("Hello, World!")\n\nif __name__ == "__main__":\n    hello()';

      const result = markdownGenerator.generate(file, content, frontmatter);

      expect(result).toContain('## Overview');
      expect(result).toContain('Source code file written in python');
      expect(result).toContain('## Statistics');
      expect(result).toContain('- **Lines of code**: 5');
      expect(result).toContain('## Key Functions');
      expect(result).toContain('- `hello`');
      expect(result).toContain('## Code Preview');
      expect(result).toContain('```python');
      expect(result).toContain('def hello():');
      expect(result).toContain('```');
    });

    it('should handle long content by truncating', () => {
      const file = createTestFile({ type: FileType.Document });
      const frontmatter = createTestFrontmatter();
      const longContent = 'A'.repeat(6000);

      const result = markdownGenerator.generate(file, longContent, frontmatter);

      expect(result).toContain('## Content');
      expect(result).toContain('*... (content truncated)*');
    });

    it('should handle code files with long content', () => {
      const file = createTestFile({ 
        type: FileType.Code, 
        name: 'long.js', 
        extension: 'js' 
      });
      const frontmatter = createTestFrontmatter();
      const longContent = Array.from({ length: 100 }, (_, i) => `console.log(${i});`).join('\n');

      const result = markdownGenerator.generate(file, longContent, frontmatter);

      expect(result).toContain('```javascript');
      expect(result).toContain('// ... (truncated)');
    });

    it('should handle null content gracefully', () => {
      const file = createTestFile();
      const frontmatter = createTestFrontmatter();

      const result = markdownGenerator.generate(file, null, frontmatter);

      expect(result).toContain('# Test File');
      expect(result).toContain('*Original file: [file.txt](file:///test/path/file.txt)*');
    });

    it('should format frontmatter arrays correctly', () => {
      const file = createTestFile();
      const frontmatter = createTestFrontmatter({
        tags: ['type/document', 'project/test', 'status/active'],
      });

      const result = markdownGenerator.generate(file, 'content', frontmatter);

      expect(result).toContain('tags:');
      expect(result).toContain('  - type/document');
      expect(result).toContain('  - project/test');
      expect(result).toContain('  - status/active');
    });

    it('should extract functions from different programming languages', () => {
      const testCases = [
        {
          language: 'javascript',
          extension: 'js',
          content: 'function test() {}\nconst arrow = () => {}\nfunction another() {}',
          expectedFunctions: ['test', 'arrow', 'another'],
        },
        {
          language: 'python',
          extension: 'py',
          content: 'def test():\n    pass\ndef another():\n    pass',
          expectedFunctions: ['test', 'another'],
        },
        {
          language: 'java',
          extension: 'java',
          content: 'public void test() {}\nprivate static int calculate() {}\nprotected void helper() {}',
          expectedFunctions: ['test', 'calculate', 'helper'],
        },
      ];

      testCases.forEach(({ language, extension, content, expectedFunctions }) => {
        const file = createTestFile({ 
          type: FileType.Code, 
          name: `script.${extension}`, 
          extension 
        });
        const frontmatter = createTestFrontmatter();

        const result = markdownGenerator.generate(file, content, frontmatter);

        expect(result).toContain(`written in ${language}`);
        expectedFunctions.forEach(func => {
          expect(result).toContain(`- \`${func}\``);
        });
      });
    });
  });
});