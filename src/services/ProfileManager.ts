import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { Profile, ProfileSummary, Config } from '../types/index.js';
import { ConfigService } from './ConfigService.js';

export class ProfileManager {
  private profilesDir: string;
  private activeProfileFile: string;
  private configService: ConfigService;

  constructor() {
    const polishDir = path.join(os.homedir(), '.polish');
    this.profilesDir = path.join(polishDir, 'profiles');
    this.activeProfileFile = path.join(polishDir, 'active-profile');
    this.configService = new ConfigService();
  }

  /**
   * Initialize the profile system
   */
  async initialize(): Promise<void> {
    await fs.mkdir(this.profilesDir, { recursive: true });

    // Check if this is first time setup
    const hasProfiles = await this.hasAnyProfiles();
    if (!hasProfiles) {
      await this.createDefaultProfile();
    }

    // Ensure we have an active profile
    const activeProfile = await this.getActiveProfile();
    if (!activeProfile) {
      const profiles = await this.listProfiles();
      if (profiles.length > 0) {
        await this.setActiveProfile(profiles[0].name);
      }
    }
  }

  /**
   * Create a new profile
   */
  async createProfile(name: string, config: Config, description?: string): Promise<Profile> {
    await this.validateProfileName(name);

    const profile: Profile = {
      name,
      description,
      config,
      createdAt: new Date().toISOString(),
      lastUsed: new Date().toISOString(),
    };

    const profilePath = this.getProfilePath(name);
    await fs.writeFile(profilePath, JSON.stringify(profile, null, 2));

    return profile;
  }

  /**
   * Get a profile by name
   */
  async getProfile(name: string): Promise<Profile | null> {
    try {
      const profilePath = this.getProfilePath(name);
      const data = await fs.readFile(profilePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      return null;
    }
  }

  /**
   * Update an existing profile
   */
  async updateProfile(name: string, updates: Partial<Pick<Profile, 'description' | 'config'>>): Promise<Profile> {
    const profile = await this.getProfile(name);
    if (!profile) {
      throw new Error(`Profile '${name}' not found`);
    }

    const updatedProfile: Profile = {
      ...profile,
      ...updates,
      lastUsed: new Date().toISOString(),
    };

    const profilePath = this.getProfilePath(name);
    await fs.writeFile(profilePath, JSON.stringify(updatedProfile, null, 2));

    return updatedProfile;
  }

  /**
   * Delete a profile
   */
  async deleteProfile(name: string): Promise<void> {
    if (name === 'default') {
      throw new Error('Cannot delete the default profile');
    }

    const profile = await this.getProfile(name);
    if (!profile) {
      throw new Error(`Profile '${name}' not found`);
    }

    // If this is the active profile, switch to default
    const activeProfile = await this.getActiveProfile();
    if (activeProfile === name) {
      await this.setActiveProfile('default');
    }

    const profilePath = this.getProfilePath(name);
    await fs.unlink(profilePath);
  }

  /**
   * List all profiles
   */
  async listProfiles(): Promise<ProfileSummary[]> {
    try {
      const files = await fs.readdir(this.profilesDir);
      const activeProfile = await this.getActiveProfile();
      
      const profiles: ProfileSummary[] = [];
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const name = path.basename(file, '.json');
          const profile = await this.getProfile(name);
          
          if (profile) {
            profiles.push({
              name: profile.name,
              description: profile.description,
              vaultPath: profile.config.vault.path,
              originalsPath: profile.config.originals.path,
              sourceCount: profile.config.sources.length,
              isActive: profile.name === activeProfile,
              createdAt: profile.createdAt,
              lastUsed: profile.lastUsed,
            });
          }
        }
      }

      // Sort by last used, with active profile first
      return profiles.sort((a, b) => {
        if (a.isActive) return -1;
        if (b.isActive) return 1;
        return new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime();
      });
    } catch (error) {
      return [];
    }
  }

  /**
   * Get the currently active profile name
   */
  async getActiveProfile(): Promise<string | null> {
    try {
      const activeProfile = await fs.readFile(this.activeProfileFile, 'utf-8');
      return activeProfile.trim();
    } catch (error) {
      return null;
    }
  }

  /**
   * Set the active profile
   */
  async setActiveProfile(name: string): Promise<void> {
    const profile = await this.getProfile(name);
    if (!profile) {
      throw new Error(`Profile '${name}' not found`);
    }

    await fs.writeFile(this.activeProfileFile, name);
    
    // Update last used timestamp
    await this.updateProfile(name, {});
  }

  /**
   * Get the active profile's configuration
   */
  async getActiveConfig(): Promise<Config> {
    const activeProfileName = await this.getActiveProfile();
    if (!activeProfileName) {
      throw new Error('No active profile found. Run "polish profile create" to create one.');
    }

    const profile = await this.getProfile(activeProfileName);
    if (!profile) {
      throw new Error(`Active profile '${activeProfileName}' not found`);
    }

    return profile.config;
  }

  /**
   * Clone a profile with a new name
   */
  async cloneProfile(sourceName: string, targetName: string, description?: string): Promise<Profile> {
    const sourceProfile = await this.getProfile(sourceName);
    if (!sourceProfile) {
      throw new Error(`Source profile '${sourceName}' not found`);
    }

    return await this.createProfile(targetName, sourceProfile.config, description);
  }

  /**
   * Rename a profile
   */
  async renameProfile(oldName: string, newName: string): Promise<void> {
    if (oldName === 'default') {
      throw new Error('Cannot rename the default profile');
    }

    await this.validateProfileName(newName);

    const profile = await this.getProfile(oldName);
    if (!profile) {
      throw new Error(`Profile '${oldName}' not found`);
    }

    // Create new profile with new name
    const updatedProfile = {
      ...profile,
      name: newName,
      lastUsed: new Date().toISOString(),
    };

    const newProfilePath = this.getProfilePath(newName);
    await fs.writeFile(newProfilePath, JSON.stringify(updatedProfile, null, 2));

    // Update active profile if needed
    const activeProfile = await this.getActiveProfile();
    if (activeProfile === oldName) {
      await this.setActiveProfile(newName);
    }

    // Delete old profile
    const oldProfilePath = this.getProfilePath(oldName);
    await fs.unlink(oldProfilePath);
  }

  /**
   * Import profiles from a JSON file
   */
  async importProfiles(filePath: string, overwrite = false): Promise<string[]> {
    const data = await fs.readFile(filePath, 'utf-8');
    const importedProfiles = JSON.parse(data) as Profile[];

    if (!Array.isArray(importedProfiles)) {
      throw new Error('Invalid import file format');
    }

    const imported: string[] = [];

    for (const profile of importedProfiles) {
      const exists = await this.getProfile(profile.name);
      if (exists && !overwrite) {
        continue; // Skip existing profiles unless overwrite is true
      }

      await this.createProfile(profile.name, profile.config, profile.description);
      imported.push(profile.name);
    }

    return imported;
  }

  /**
   * Export profiles to a JSON file
   */
  async exportProfiles(filePath: string, profileNames?: string[]): Promise<void> {
    const allProfiles = await this.listProfiles();
    let profilesToExport = allProfiles;

    if (profileNames && profileNames.length > 0) {
      profilesToExport = allProfiles.filter(p => profileNames.includes(p.name));
    }

    const profiles: Profile[] = [];
    for (const summary of profilesToExport) {
      const profile = await this.getProfile(summary.name);
      if (profile) {
        profiles.push(profile);
      }
    }

    await fs.writeFile(filePath, JSON.stringify(profiles, null, 2));
  }

  /**
   * Migrate legacy configuration to profile system
   */
  async migrateLegacyConfig(): Promise<boolean> {
    try {
      // Check if old config exists
      const legacyConfigExists = await this.configService.exists();
      if (!legacyConfigExists) {
        return false;
      }

      const legacyConfig = await this.configService.load();
      
      // Create default profile from legacy config
      await this.createProfile('default', legacyConfig, 'Migrated from legacy configuration');
      await this.setActiveProfile('default');

      console.log('Successfully migrated legacy configuration to default profile');
      return true;
    } catch (error) {
      console.warn('Failed to migrate legacy configuration:', error);
      return false;
    }
  }

  private async hasAnyProfiles(): Promise<boolean> {
    try {
      const files = await fs.readdir(this.profilesDir);
      return files.some(file => file.endsWith('.json'));
    } catch (error) {
      return false;
    }
  }

  private async createDefaultProfile(): Promise<void> {
    // Try to migrate legacy config first
    const migrated = await this.migrateLegacyConfig();
    
    if (!migrated) {
      // Create default profile with default config
      const defaultConfig = this.configService.getDefaultConfig();
      await this.createProfile('default', defaultConfig, 'Default profile');
      await this.setActiveProfile('default');
    }
  }

  private getProfilePath(name: string): string {
    return path.join(this.profilesDir, `${name}.json`);
  }

  private async validateProfileName(name: string): Promise<void> {
    if (!name || name.trim().length === 0) {
      throw new Error('Profile name cannot be empty');
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
      throw new Error('Profile name can only contain letters, numbers, hyphens, and underscores');
    }

    if (name.length > 50) {
      throw new Error('Profile name cannot be longer than 50 characters');
    }

    const exists = await this.getProfile(name);
    if (exists) {
      throw new Error(`Profile '${name}' already exists`);
    }
  }
}