import * as fs from 'fs/promises';
import { FileInfo, FileType } from '../types/index.js';
import sharp from 'sharp';

export class ContentExtractor {
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  async extract(file: FileInfo): Promise<string | null> {
    try {
      // Check file size (allow larger files for media)
      const maxSize = file.type === FileType.Image || file.type === FileType.Media 
        ? 50 * 1024 * 1024  // 50MB for media
        : this.MAX_FILE_SIZE; // 10MB for documents
        
      if (file.size > maxSize) {
        return null;
      }

      switch (file.type) {
        case FileType.Document:
          return await this.extractDocument(file);
        case FileType.Code:
        case FileType.Data:
          return await this.extractText(file);
        case FileType.Image:
          return await this.extractImage(file);
        case FileType.Media:
          return await this.extractMedia(file);
        case FileType.Archive:
          return await this.extractArchiveMetadata(file);
        default:
          return await this.extractBasic(file);
      }
    } catch (error) {
      console.warn(`Failed to extract content from ${file.name}:`, error);
      return null;
    }
  }

  private async extractDocument(file: FileInfo): Promise<string | null> {
    switch (file.extension.toLowerCase()) {
      case 'txt':
      case 'md':
      case 'markdown':
      case 'rtf':
        return await this.extractText(file);
      case 'pdf':
        return await this.extractPDF(file);
      case 'docx':
      case 'doc':
        return await this.extractDOCX(file);
      case 'odt':
        return await this.extractODT(file);
      case 'html':
      case 'htm':
        return await this.extractHTML(file);
      default:
        return null;
    }
  }

  private async extractText(file: FileInfo): Promise<string> {
    const content = await fs.readFile(file.path, 'utf-8');
    return content;
  }

  private async extractPDF(file: FileInfo): Promise<string | null> {
    try {
      const { default: pdf } = await import('pdf-parse');
      const dataBuffer = await fs.readFile(file.path);
      const data = await pdf(dataBuffer);
      return data.text || null;
    } catch (error) {
      console.warn(`Failed to extract PDF content from ${file.name}:`, error);
      return null;
    }
  }

  private async extractDOCX(file: FileInfo): Promise<string | null> {
    try {
      const { default: mammoth } = await import('mammoth');
      const result = await mammoth.extractRawText({ path: file.path });
      return result.value || null;
    } catch (error) {
      console.warn(`Failed to extract DOCX content from ${file.name}:`, error);
      return null;
    }
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

  private async extractODT(file: FileInfo): Promise<string | null> {
    // ODT files are essentially ZIP archives with XML content
    // For now, return null (would need unzipper + xml parsing)
    console.warn(`ODT extraction not yet implemented for ${file.name}`);
    return null;
  }

  private async extractHTML(file: FileInfo): Promise<string | null> {
    try {
      const content = await fs.readFile(file.path, 'utf-8');
      // Simple HTML tag removal
      return content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    } catch (error) {
      console.warn(`Failed to extract HTML content from ${file.name}:`, error);
      return null;
    }
  }

  private async extractImage(file: FileInfo): Promise<string | null> {
    try {
      const metadata = await sharp(file.path).metadata();
      
      const info = [
        `Image: ${file.name}`,
        `Format: ${metadata.format}`,
        `Dimensions: ${metadata.width}x${metadata.height}`,
        `Color space: ${metadata.space}`,
        `Channels: ${metadata.channels}`,
        metadata.exif ? 'Contains EXIF data' : 'No EXIF data',
      ].filter(Boolean);

      return info.join('\n');
    } catch (error) {
      console.warn(`Failed to extract image metadata from ${file.name}:`, error);
      return `Image file: ${file.name} (${file.extension.toUpperCase()})`;
    }
  }

  private async extractMedia(file: FileInfo): Promise<string | null> {
    // For audio/video files, extract basic metadata
    const ext = file.extension.toLowerCase();
    const mediaTypes = {
      // Audio
      mp3: 'MP3 Audio',
      wav: 'WAV Audio', 
      flac: 'FLAC Audio',
      aac: 'AAC Audio',
      ogg: 'OGG Audio',
      m4a: 'M4A Audio',
      
      // Video
      mp4: 'MP4 Video',
      mkv: 'MKV Video',
      avi: 'AVI Video',
      mov: 'QuickTime Video',
      wmv: 'WMV Video',
      webm: 'WebM Video',
    };

    const mediaType = mediaTypes[ext as keyof typeof mediaTypes] || `${ext.toUpperCase()} Media`;
    
    return [
      `Media file: ${file.name}`,
      `Type: ${mediaType}`,
      `Size: ${this.formatFileSize(file.size)}`,
      `Created: ${file.createdAt.toLocaleDateString()}`,
    ].join('\n');
  }

  private async extractArchiveMetadata(file: FileInfo): Promise<string | null> {
    // For archives, just provide metadata - don't extract contents for security
    const ext = file.extension.toLowerCase();
    const archiveTypes = {
      zip: 'ZIP Archive',
      rar: 'RAR Archive', 
      tar: 'TAR Archive',
      gz: 'GZIP Archive',
      '7z': '7-Zip Archive',
      bz2: 'BZIP2 Archive',
    };

    const archiveType = archiveTypes[ext as keyof typeof archiveTypes] || `${ext.toUpperCase()} Archive`;
    
    return [
      `Archive: ${file.name}`,
      `Type: ${archiveType}`,
      `Size: ${this.formatFileSize(file.size)}`,
      `Note: Archive contents not extracted for security`,
    ].join('\n');
  }

  private formatFileSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  private isTextContent(content: string): boolean {
    // Simple heuristic: check for non-printable characters
    // eslint-disable-next-line no-control-regex
    const nonPrintable = content.match(/[\x00-\x08\x0B-\x0C\x0E-\x1F]/g);
    return !nonPrintable || nonPrintable.length < content.length * 0.1;
  }
}