export { Config, FileInfo, FileType, ProcessedFile, OrganizationResult, Profile, ProfileSummary } from './types/index.js';
export { ConfigService } from './services/ConfigService.js';
export { ProfileManager } from './services/ProfileManager.js';
export { ClaudeService } from './services/ClaudeService.js';
export { FileScanner } from './modules/FileScanner.js';
export { FileProcessor } from './modules/FileProcessor.js';
export { MarkdownGenerator } from './modules/MarkdownGenerator.js';
export { ContentExtractor } from './modules/ContentExtractor.js';

// Import types for use in class
import { Config, FileInfo, OrganizationResult } from './types/index.js';
import { ProfileManager } from './services/ProfileManager.js';
import { ConfigService } from './services/ConfigService.js';

// Main Polish class for programmatic use
export class Polish {
  private config: Config;
  private profileManager: ProfileManager;
  private profileName?: string;

  constructor(config?: Partial<Config>, profileName?: string) {
    this.profileManager = new ProfileManager();
    this.profileName = profileName;
    
    if (config) {
      const configService = new ConfigService();
      this.config = { ...configService.getDefaultConfig(), ...config };
    } else {
      // Will be loaded in loadConfig or organize methods
      this.config = new ConfigService().getDefaultConfig();
    }
  }

  async loadConfig(): Promise<void> {
    try {
      await this.profileManager.initialize();
      
      if (this.profileName) {
        const profile = await this.profileManager.getProfile(this.profileName);
        if (!profile) {
          throw new Error(`Profile '${this.profileName}' not found`);
        }
        this.config = profile.config;
      } else {
        this.config = await this.profileManager.getActiveConfig();
      }
    } catch (error) {
      console.warn('Could not load profile config, using defaults');
    }
  }

  async organize(options: {
    sources?: string[];
    dryRun?: boolean;
    copy?: boolean;
    onProgress?: (current: number, total: number, file: FileInfo) => void;
  } = {}): Promise<OrganizationResult> {
    // Ensure config is loaded
    if (!this.config || this.config === new ConfigService().getDefaultConfig()) {
      await this.loadConfig();
    }
    
    const { FileScanner } = await import('./modules/FileScanner.js');
    const { FileProcessor } = await import('./modules/FileProcessor.js');
    const { ClaudeService } = await import('./services/ClaudeService.js');

    const claudeService = new ClaudeService(this.config.api);
    const fileScanner = new FileScanner(this.config);
    const fileProcessor = new FileProcessor(this.config, claudeService);

    const sources = options.sources ? 
      options.sources.map(path => ({ path, includeSubfolders: true })) : 
      this.config.sources;

    const files = await fileScanner.scan(sources);

    return await fileProcessor.processFiles(files, {
      dryRun: options.dryRun || false,
      copy: options.copy || false,
      batchSize: 10,
      onProgress: options.onProgress,
    });
  }
}