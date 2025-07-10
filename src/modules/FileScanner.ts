import { globby } from 'globby';
import * as path from 'path';
import * as fs from 'fs/promises';
import { Config, FileInfo, FileType, SourceConfig } from '../types/index.js';

export class FileScanner {
  private config: Config;
  private extensionMap: Map<string, FileType>;

  constructor(config: Config) {
    this.config = config;
    this.extensionMap = this.buildExtensionMap();
  }

  async scan(sources: SourceConfig[], filterTypes?: string[]): Promise<FileInfo[]> {
    const allFiles: FileInfo[] = [];

    for (const source of sources) {
      const files = await this.scanDirectory(source.path, source.includeSubfolders);
      allFiles.push(...files);
    }

    let filtered = allFiles.filter(file => 
      this.config.processing.supportedFormats.includes(file.extension)
    );

    if (filterTypes && filterTypes.length > 0) {
      filtered = filtered.filter(file => 
        filterTypes.includes(file.extension)
      );
    }

    return filtered;
  }

  private async scanDirectory(dirPath: string, includeSubfolders: boolean): Promise<FileInfo[]> {
    try {
      const pattern = includeSubfolders ? '**/*' : '*';
      const paths = await globby(pattern, {
        cwd: dirPath,
        absolute: true,
        onlyFiles: true,
        ignore: ['**/node_modules/**', '**/.git/**', '**/.*'],
      });

      const files = await Promise.all(
        paths.map(filePath => this.getFileInfo(filePath))
      );

      return files.filter((file): file is FileInfo => file !== null);
    } catch (error) {
      console.warn(`Failed to scan directory ${dirPath}:`, error);
      return [];
    }
  }

  private async getFileInfo(filePath: string): Promise<FileInfo | null> {
    try {
      const stats = await fs.stat(filePath);
      const parsed = path.parse(filePath);
      const extension = parsed.ext.slice(1).toLowerCase();

      return {
        path: filePath,
        name: parsed.base,
        extension,
        size: stats.size,
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime,
        type: this.getFileType(extension),
      };
    } catch {
      return null;
    }
  }

  private getFileType(extension: string): FileType {
    return this.extensionMap.get(extension) || FileType.Unknown;
  }

  private buildExtensionMap(): Map<string, FileType> {
    const map = new Map<string, FileType>();
    
    // Documents
    ['pdf', 'docx', 'doc', 'txt', 'rtf', 'odt'].forEach(ext => 
      map.set(ext, FileType.Document)
    );
    
    // Images
    ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'svg', 'webp'].forEach(ext => 
      map.set(ext, FileType.Image)
    );
    
    // Code
    ['js', 'ts', 'py', 'java', 'cpp', 'c', 'go', 'rs', 'rb', 'php', 'swift', 'kt'].forEach(ext => 
      map.set(ext, FileType.Code)
    );
    
    // Data
    ['json', 'csv', 'xml', 'yaml', 'yml', 'sql'].forEach(ext => 
      map.set(ext, FileType.Data)
    );
    
    // Archives
    ['zip', 'tar', 'gz', 'rar', '7z', 'bz2'].forEach(ext => 
      map.set(ext, FileType.Archive)
    );
    
    // Media
    ['mp3', 'mp4', 'avi', 'mov', 'wav', 'flac'].forEach(ext => 
      map.set(ext, FileType.Media)
    );

    return map;
  }
}