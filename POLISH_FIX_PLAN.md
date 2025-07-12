# Polish CLI Fix Plan & Specification

## Overview
This document outlines the comprehensive plan to fix and enhance the Polish CLI tool based on identified issues and user requirements.

## Current State Analysis

### Identified Issues

1. **CLI Command Structure Mismatch**
   - Help text shows config subcommands that don't work
   - `polish config show` fails - requires `polish config --show`
   - Options are implemented instead of proper subcommands

2. **Directory Tracking Issues**
   - User selected "Documents" but profile shows Desktop/Downloads
   - No way to update existing profile's source directories
   - Limited to preset directories (Desktop/Downloads/Documents)

3. **File Processing Failures**
   - PDF parsing returns null (stubbed implementation)
   - DOCX parsing returns null (stubbed implementation)
   - Markdown files only contain links, not actual content
   - Original file links point to source location, not organized location

4. **File Organization Logic**
   - Files should be MOVED from source to Originals directory
   - Currently using copy instead of move by default
   - No validation of successful move before creating markdown

5. **Profile Management Limitations**
   - No way to edit existing profiles
   - Config commands don't modify active profile
   - No support for arbitrary source directories

## Proposed Solution Architecture

### 1. CLI Command Restructure

#### Current (Broken)
```bash
polish config --show         # Works
polish config show          # Doesn't work (but shown in help)
polish config --set key val # Works
polish config set key val   # Doesn't work
```

#### Proposed Fix
Implement proper Commander.js subcommands:
```bash
polish config show          # Show full configuration
polish config get <key>     # Get specific value
polish config set <key> <value>  # Set configuration value
polish config init          # Interactive initialization
polish config edit          # Edit current profile interactively
```

### 2. Enhanced Profile Management

#### New Profile Commands
```bash
polish profile edit [name]           # Edit existing profile
polish profile add-source <path>     # Add source directory to current profile
polish profile remove-source <path>  # Remove source directory
polish profile set <key> <value>     # Update profile setting
```

#### Profile Configuration Structure
```typescript
interface ProfileConfig {
  sources: Array<{
    path: string;           // Any absolute path
    includeSubfolders: boolean;
    filters?: {
      includePatterns?: string[];
      excludePatterns?: string[];
    };
  }>;
  // ... rest of config
}
```

### 3. File Processing Pipeline Fixes

#### PDF/DOCX Parsing Implementation
```typescript
// ContentExtractor.ts
import pdf from 'pdf-parse';
import mammoth from 'mammoth';

private async extractDocument(file: FileInfo): Promise<string | null> {
  switch (file.extension) {
    case 'pdf':
      return await this.extractPDF(file);
    case 'docx':
      return await this.extractDOCX(file);
    // ...
  }
}

private async extractPDF(file: FileInfo): Promise<string | null> {
  const dataBuffer = await fs.readFile(file.path);
  const data = await pdf(dataBuffer);
  return data.text;
}

private async extractDOCX(file: FileInfo): Promise<string | null> {
  const result = await mammoth.extractRawText({ path: file.path });
  return result.value;
}
```

#### Fix Markdown Generation
```typescript
// FileProcessor.ts - Update frontmatter generation
const frontmatter = {
  title: path.parse(file.name).name,
  originalFile: originalNewPath,  // Point to organized location
  sourceLocation: file.path,      // Keep source for reference
  fileType: file.extension,
  // ...
};
```

### 4. File Organization Logic

#### Default Behavior Change
- Change default from copy to move
- Add safety checks before moving
- Implement rollback on failure

```typescript
// FileProcessor.ts
if (!options.copy) {
  // Verify destination doesn't exist
  if (await this.fileExists(originalNewPath)) {
    throw new Error(`Destination already exists: ${originalNewPath}`);
  }
  
  // Move file
  await fs.rename(file.path, originalNewPath);
  
  // Verify move succeeded
  if (!await this.fileExists(originalNewPath)) {
    throw new Error('File move failed');
  }
}
```

## Implementation Plan

### Phase 1: Critical Fixes (High Priority)

1. **Fix Config Command Structure** (2 hours)
   - Refactor config.ts to use proper subcommands
   - Update CLI help text
   - Add tests for all config commands

2. **Implement PDF/DOCX Parsing** (3 hours)
   - Install pdf-parse and mammoth dependencies
   - Implement extraction methods
   - Add error handling and fallbacks
   - Test with various file formats

3. **Fix File Organization Logic** (2 hours)
   - Change default to move operation
   - Update frontmatter links
   - Add safety checks and validation

4. **Add Custom Source Directories** (3 hours)
   - Update profile schema
   - Add profile edit commands
   - Implement add/remove source commands
   - Update file scanner to handle arbitrary paths

### Phase 2: Enhanced Features (Medium Priority)

5. **Profile Management Improvements** (4 hours)
   - Add profile edit command
   - Add profile set command for individual settings
   - Implement profile validation
   - Add profile backup/restore

6. **Comprehensive Testing** (4 hours)
   - Unit tests for all parsers
   - Integration tests for file processing
   - E2E tests for CLI commands
   - Add GitHub Actions CI/CD

7. **Documentation Updates** (2 hours)
   - Update README with correct commands
   - Add troubleshooting guide
   - Create migration guide for existing users
   - Add examples for common workflows

### Phase 3: Future Enhancements

8. **Additional File Type Support**
   - Excel/CSV parsing
   - Image OCR for text extraction
   - Audio/Video metadata extraction

9. **Advanced Organization Features**
   - Rule-based organization
   - Smart duplicate detection
   - Batch undo/rollback support

10. **Performance Optimizations**
    - Parallel file processing
    - Incremental processing (skip already processed)
    - Progress persistence for resume capability

## Testing Strategy

### Unit Tests
- Config command parsing
- Profile management operations
- File content extraction
- Markdown generation
- Path calculation logic

### Integration Tests
- Full file processing pipeline
- Profile switching and loading
- File moving and organization
- Error recovery scenarios

### E2E Tests
- Complete organize workflow
- Profile creation and management
- Config initialization flow
- Dry-run mode verification

## Success Criteria

1. All config commands work as documented
2. PDF and DOCX files are properly parsed to markdown
3. Files are moved (not copied) from source to organized location
4. Users can add any directory as a source
5. Existing profiles can be edited without recreation
6. All tests pass with >90% coverage
7. No breaking changes for existing users

## Migration Guide

### For Existing Users
1. Backup ~/.polish directory before update
2. Run `polish profile list` to verify profiles migrated
3. Use `polish profile edit` to update source directories
4. Use `polish organize --dry-run` to preview changes

### Breaking Changes
- Default behavior changes from copy to move
- Config commands syntax changes
- Frontmatter originalFile path changes

## Timeline

- Phase 1: 1-2 days (Critical fixes)
- Phase 2: 3-4 days (Enhanced features)
- Phase 3: Future releases

## Dependencies to Add

```json
{
  "dependencies": {
    "pdf-parse": "^1.1.1",
    "mammoth": "^1.6.0"
  }
}
```

## Files to Modify

1. `/src/cli/commands/config.ts` - Restructure command
2. `/src/cli/index.ts` - Update command definitions
3. `/src/modules/ContentExtractor.ts` - Add PDF/DOCX parsing
4. `/src/modules/FileProcessor.ts` - Fix file organization
5. `/src/cli/commands/profile.ts` - Add edit commands
6. `/src/types/index.ts` - Update config types
7. `/src/services/ProfileManager.ts` - Add profile editing

## Rollback Plan

If issues arise:
1. Keep current version as `polish-legacy` command
2. Add --legacy flag to use old behavior
3. Provide config migration tool
4. Document all breaking changes clearly