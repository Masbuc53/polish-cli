import { FileInfo, Frontmatter, FileType } from '../types/index.js';

export class MarkdownGenerator {
  generate(file: FileInfo, content: string | null, frontmatter: Frontmatter): string {
    const sections: string[] = [];

    // Add frontmatter
    sections.push(this.generateFrontmatter(frontmatter));

    // Add title
    sections.push(`# ${frontmatter.title}\n`);

    // Add file-type specific content
    switch (file.type) {
      case FileType.Image:
        sections.push(this.generateImageContent(file, frontmatter));
        break;
      case FileType.Code:
        sections.push(this.generateCodeContent(file, content));
        break;
      case FileType.Document:
        sections.push(this.generateDocumentContent(content));
        break;
      default:
        sections.push(this.generateDefaultContent(file, content));
    }

    // Add footer with original file reference
    sections.push(this.generateFooter(file));

    return sections.join('\n');
  }

  private generateFrontmatter(frontmatter: Frontmatter): string {
    const lines = ['---'];
    
    Object.entries(frontmatter).forEach(([key, value]) => {
      if (key === 'tags' && Array.isArray(value)) {
        lines.push('tags:');
        value.forEach(tag => lines.push(`  - ${tag}`));
      } else {
        lines.push(`${key}: ${JSON.stringify(value)}`);
      }
    });
    
    lines.push('---\n');
    return lines.join('\n');
  }

  private generateImageContent(file: FileInfo, _frontmatter: Frontmatter): string {
    const sections: string[] = [];
    
    sections.push(`![[${file.name}]]`);
    sections.push('');
    sections.push('## Description');
    sections.push(`Image file: ${file.name}`);
    sections.push('');
    sections.push('## Properties');
    sections.push(`- **Format**: ${file.extension.toUpperCase()}`);
    sections.push(`- **Size**: ${this.formatBytes(file.size)}`);
    sections.push(`- **Modified**: ${file.modifiedAt.toLocaleDateString()}`);
    
    return sections.join('\n');
  }

  private generateCodeContent(file: FileInfo, content: string | null): string {
    const sections: string[] = [];
    const language = this.getLanguageFromExtension(file.extension);
    
    sections.push('## Overview');
    sections.push(`Source code file written in ${language}.`);
    sections.push('');
    
    if (content) {
      const lines = content.split('\n');
      sections.push('## Statistics');
      sections.push(`- **Lines of code**: ${lines.length}`);
      sections.push(`- **File size**: ${this.formatBytes(file.size)}`);
      sections.push('');
      
      // Extract key elements if possible
      const functions = this.extractFunctions(content, language);
      if (functions.length > 0) {
        sections.push('## Key Functions');
        functions.slice(0, 10).forEach(func => {
          sections.push(`- \`${func}\``);
        });
        sections.push('');
      }
      
      sections.push('## Code Preview');
      sections.push('```' + language);
      sections.push(lines.slice(0, 50).join('\n'));
      if (lines.length > 50) {
        sections.push('// ... (truncated)');
      }
      sections.push('```');
    }
    
    return sections.join('\n');
  }

  private generateDocumentContent(content: string | null): string {
    if (!content) {
      return '## Content\n\n*Unable to extract content from this document.*';
    }

    const sections: string[] = [];
    sections.push('## Content\n');
    
    // Limit content length for readability
    const maxLength = 5000;
    if (content.length > maxLength) {
      sections.push(content.substring(0, maxLength));
      sections.push('\n\n*... (content truncated)*');
    } else {
      sections.push(content);
    }
    
    return sections.join('\n');
  }

  private generateDefaultContent(file: FileInfo, content: string | null): string {
    const sections: string[] = [];
    
    sections.push('## File Information');
    sections.push(`- **Type**: ${file.type}`);
    sections.push(`- **Format**: ${file.extension}`);
    sections.push(`- **Size**: ${this.formatBytes(file.size)}`);
    sections.push(`- **Modified**: ${file.modifiedAt.toLocaleDateString()}`);
    
    if (content) {
      sections.push('');
      sections.push('## Content Preview');
      sections.push('```');
      sections.push(content.substring(0, 1000));
      if (content.length > 1000) {
        sections.push('... (truncated)');
      }
      sections.push('```');
    }
    
    return sections.join('\n');
  }

  private generateFooter(file: FileInfo): string {
    return `\n---\n*Original file: [${file.name}](file://${file.path})*`;
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private getLanguageFromExtension(extension: string): string {
    const languageMap: Record<string, string> = {
      js: 'javascript',
      ts: 'typescript',
      py: 'python',
      rb: 'ruby',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
      cs: 'csharp',
      go: 'go',
      rs: 'rust',
      php: 'php',
      swift: 'swift',
      kt: 'kotlin',
    };
    
    return languageMap[extension] || extension;
  }

  private extractFunctions(content: string, language: string): string[] {
    const functions: string[] = [];
    
    // Simple regex patterns for common languages
    const patterns: Record<string, RegExp> = {
      javascript: /(?:function\s+(\w+)|const\s+(\w+)\s*=\s*(?:\([^)]*\)\s*=>|function))/g,
      typescript: /(?:function\s+(\w+)|const\s+(\w+)\s*=\s*(?:\([^)]*\)\s*=>|function))/g,
      python: /def\s+(\w+)\s*\(/g,
      java: /(?:public|private|protected)?\s*(?:static)?\s*\w+\s+(\w+)\s*\(/g,
    };
    
    const pattern = patterns[language];
    if (pattern) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const funcName = match[1] || match[2];
        if (funcName) {
          functions.push(funcName);
        }
      }
    }
    
    return [...new Set(functions)];
  }
}