import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import * as fs from 'fs/promises';
import * as path from 'path';
import { ConfigService } from '../../src/services/ConfigService.js';
import { Config } from '../../src/types/index.js';
import { getTempDir } from '../setup.js';

describe('ConfigService', () => {
  let configService: ConfigService;
  let tempConfigDir: string;
  let originalHomedir: string;

  beforeEach(async () => {
    tempConfigDir = getTempDir('config-test');
    await fs.mkdir(tempConfigDir, { recursive: true });
    
    // Mock os.homedir to return our temp directory
    originalHomedir = process.env.HOME || '';
    process.env.HOME = tempConfigDir;
    
    configService = new ConfigService();
  });

  afterEach(async () => {
    process.env.HOME = originalHomedir;
    try {
      await fs.rm(tempConfigDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('getDefaultConfig', () => {
    it('should return a valid default configuration', () => {
      const config = configService.getDefaultConfig();
      
      expect(config).toBeDefined();
      expect(config.vault).toBeDefined();
      expect(config.vault.path).toContain('ObsidianVault');
      expect(config.originals).toBeDefined();
      expect(config.sources).toBeInstanceOf(Array);
      expect(config.processing).toBeDefined();
      expect(config.tagging).toBeDefined();
      expect(config.api).toBeDefined();
      expect(config.api.mode).toBe('claude-code');
    });
  });

  describe('exists', () => {
    it('should return false when config does not exist', async () => {
      const exists = await configService.exists();
      expect(exists).toBe(false);
    });

    it('should return true when config exists', async () => {
      const config = configService.getDefaultConfig();
      await configService.save(config);
      
      const exists = await configService.exists();
      expect(exists).toBe(true);
    });
  });

  describe('save and load', () => {
    it('should save and load configuration correctly', async () => {
      const config: Config = {
        ...configService.getDefaultConfig(),
        vault: {
          path: '/test/vault',
          structure: {
            documents: 'Docs',
            media: 'Media',
            code: 'Code',
            references: 'Refs',
          },
        },
        api: {
          mode: 'api',
          apiKey: 'test-key',
          model: 'claude-3-opus',
          maxTokens: 1000,
          temperature: 0.5,
        },
      };

      await configService.save(config);
      const loadedConfig = await configService.load();

      expect(loadedConfig).toEqual(config);
    });

    it('should throw error when loading non-existent config', async () => {
      await expect(configService.load()).rejects.toThrow('Configuration not found');
    });
  });

  describe('save', () => {
    it('should create directory if it does not exist', async () => {
      const config = configService.getDefaultConfig();
      
      // Ensure directory doesn't exist
      const configDir = path.join(tempConfigDir, '.polish');
      try {
        await fs.rm(configDir, { recursive: true });
      } catch {
        // Directory doesn't exist, which is what we want
      }

      await configService.save(config);
      
      const stats = await fs.stat(configDir);
      expect(stats.isDirectory()).toBe(true);
    });

    it('should write valid JSON', async () => {
      const config = configService.getDefaultConfig();
      await configService.save(config);

      const configPath = path.join(tempConfigDir, '.polish', 'config.json');
      const fileContent = await fs.readFile(configPath, 'utf-8');
      
      expect(() => JSON.parse(fileContent)).not.toThrow();
      const parsedConfig = JSON.parse(fileContent);
      expect(parsedConfig).toEqual(config);
    });
  });
});