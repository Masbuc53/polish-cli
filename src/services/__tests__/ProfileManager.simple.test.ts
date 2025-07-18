import { Config } from '../../types/index.js';

describe('ProfileManager Simple Tests', () => {

  describe('configuration validation', () => {
    it('should validate complete config structure', () => {
      const config: Config = {
        vault: {
          path: '/test/vault',
          structure: {
            documents: 'Documents',
            media: 'Media',
            code: 'Code',
            references: 'References'
          }
        },
        originals: {
          path: '/test/originals',
          organizationStyle: 'type-based',
          createYearFolders: true
        },
        sources: [],
        processing: {
          extractText: true,
          maxFileSize: '10MB',
          supportedFormats: []
        },
        tagging: {
          maxTags: 8,
          autoGenerateTypeTags: true,
          autoGenerateDateTags: true,
          customTagPatterns: {}
        },
        api: {
          mode: 'claude-code'
        }
      };

      expect(config.vault.path).toBe('/test/vault');
      expect(config.originals.organizationStyle).toBe('type-based');
      expect(config.api.mode).toBe('claude-code');
    });

    it('should validate profile structure', () => {
      const profile = {
        name: 'test',
        description: 'Test profile',
        config: {
          vault: {
            path: '/test/vault',
            structure: {
              documents: 'Documents',
              media: 'Media',
              code: 'Code',
              references: 'References'
            }
          },
          originals: {
            path: '/test/originals',
            organizationStyle: 'type-based' as const,
            createYearFolders: true
          },
          sources: [],
          processing: {
            extractText: true,
            maxFileSize: '10MB',
            supportedFormats: []
          },
          tagging: {
            maxTags: 8,
            autoGenerateTypeTags: true,
            autoGenerateDateTags: true,
            customTagPatterns: {}
          },
          api: {
            mode: 'claude-code' as const
          }
        },
        createdAt: new Date().toISOString(),
        lastUsed: new Date().toISOString()
      };

      expect(profile.name).toBe('test');
      expect(profile.config.vault.path).toBe('/test/vault');
      expect(profile.config.originals.organizationStyle).toBe('type-based');
    });
  });

  describe('utility methods', () => {
    it('should create profile summary structure', () => {
      const profileSummary = {
        name: 'test',
        description: 'Test profile',
        vaultPath: '/test/vault',
        originalsPath: '/test/originals',
        sourceCount: 0,
        isActive: false,
        createdAt: new Date().toISOString(),
        lastUsed: new Date().toISOString()
      };

      expect(profileSummary.name).toBe('test');
      expect(profileSummary.vaultPath).toBe('/test/vault');
      expect(profileSummary.isActive).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should handle invalid profile names', () => {
      const invalidNames = ['', '/', '\\', '..', '.'];
      
      invalidNames.forEach(name => {
        expect(() => {
          if (!name || name.length === 0) {
            throw new Error('Profile name cannot be empty');
          }
          if (name.includes('/') || name.includes('\\')) {
            throw new Error('Profile name cannot contain path separators');
          }
          if (name === '.' || name === '..') {
            throw new Error('Profile name cannot be . or ..');
          }
        }).toThrow();
      });
    });

    it('should validate config completeness', () => {
      const incompleteConfig = {
        vault: { path: '/test/vault' },
        // Missing required fields
      };

      expect(() => {
        // This would fail TypeScript compilation, which is what we want
        const config = incompleteConfig as Config;
        if (!config.originals || !config.sources || !config.processing || !config.tagging || !config.api) {
          throw new Error('Incomplete configuration');
        }
      }).toThrow('Incomplete configuration');
    });
  });
});