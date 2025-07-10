import * as fs from 'fs/promises';
import { FileInfo, FileType } from '../types/index.js';

export class ContentExtractor {
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  async extract(file: FileInfo): Promise<string | null> {
    try {
      // Check file size
      if (file.size > this.MAX_FILE_SIZE) {
        return null;
      }

      switch (file.type) {
        case FileType.Document:
          return await this.extractDocument(file);
        case FileType.Code:
        case FileType.Data:
          return await this.extractText(file);
        case FileType.Image:
          return null; // No text content to extract
        default:
          return await this.extractBasic(file);
      }
    } catch (error) {
      console.warn(`Failed to extract content from ${file.name}:`, error);
      return null;
    }
  }

  private async extractDocument(file: FileInfo): Promise<string | null> {
    switch (file.extension) {
      case 'txt':
      case 'md':
        return await this.extractText(file);
      case 'pdf':
        // PDF extraction would require pdf-parse
        // For now, return null (stub)
        return null;
      case 'docx':
        // DOCX extraction would require mammoth
        // For now, return null (stub)
        return null;
      default:
        return null;
    }
  }

  private async extractText(file: FileInfo): Promise<string> {
    const content = await fs.readFile(file.path, 'utf-8');
    return content;
  }

  private async extractBasic(file: FileInfo): Promise<string | null> {
    try {
      // Try to read as text
      const content = await fs.readFile(file.path, 'utf-8');
      // Check if content looks like text
      if (this.isTextContent(content)) {
        return content;
      }
      return null;
    } catch {
      return null;
    }
  }

  private isTextContent(content: string): boolean {
    // Simple heuristic: check for non-printable characters
    const nonPrintable = content.match(/[\x00-\x08\x0B-\x0C\x0E-\x1F]/g);
    return !nonPrintable || nonPrintable.length < content.length * 0.1;
  }
}