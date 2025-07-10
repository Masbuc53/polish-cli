# Polish: AI-Powered File Organization with Markdown Conversion for Obsidian

## Project Overview

Polish is an AI-powered file organization tool that creates a dual-organization system: 
1. Converts all files to tagged markdown documents for your Obsidian Vault
2. Intelligently organizes original files into a separate directory structure

The tool can be used via Claude Code for interactive sessions or programmatically through Claude API endpoints, making it flexible for both manual and automated workflows.

## Core Features

### 1. Dual Organization System
- **Markdown Generation**: Creates markdown representations of all file types
- **Original File Organization**: Sorts original files into intelligent categories
- **Two Output Directories**: Separate destinations for markdown and originals
- **Preservation**: Never deletes original files, only moves/copies them

### 2. Dual-Mode Operation
- **Claude Code Mode**: Interactive CLI for ad-hoc organization
- **API Mode**: Programmatic access via Claude API for automation
- **Hybrid Mode**: CLI can use API for batch processing
- **Local Fallback**: Basic organization without AI when offline

### 3. Intelligent Markdown Conversion
- **Content Extraction**: Extracts readable content from documents (PDF, DOCX, TXT, etc.)
- **Metadata Preservation**: Embeds file metadata in frontmatter
- **Link to Original**: Each markdown file contains a reference to its original
- **Rich Formatting**: Preserves structure, headings, and formatting where possible

### 4. Comprehensive Tagging System
- **Content-Based Tags**: Generated from extracted text and file analysis
- **Hierarchical Structure**: Multi-level tags (#topic/subtopic/detail)
- **File Type Tags**: Automatic tagging based on original file type
- **Custom Tag Rules**: User-defined tagging patterns

### 5. Smart Original File Organization
- **AI-Driven Categories**: Claude analyzes files and creates logical folder structures
- **Type-Based Sorting**: Documents, Images, Code, Data, Archives, etc.
- **Project Detection**: Groups related files together
- **Date-Based Options**: Optional chronological organization

## Technical Architecture

### Components

1. **File Parser Module**
   - Extracts content from various file types
   - PDF text extraction (pdf-parse)
   - Office document parsing (mammoth, xlsx)
   - Image metadata (sharp, exif)
   - Code file formatting (prettier)

2. **Markdown Generator**
   - Creates well-formatted markdown files
   - Generates comprehensive frontmatter (gray-matter)
   - Embeds or links media
   - Preserves formatting and structure

3. **Tag Generator**
   - Analyzes content and metadata
   - Generates relevant tags
   - Maintains tag consistency
   - Suggests tag hierarchies

4. **Original File Organizer**
   - Categorizes files by type and content
   - Creates logical folder structures
   - Handles naming conflicts
   - Maintains file relationships

5. **Claude Integration**
   - **Claude Code Mode**: Direct integration within Claude Code environment
   - **API Mode**: Uses Anthropic SDK for Claude API
   - Analyzes files for categorization
   - Suggests tags and organization

6. **CLI Application**
   - Built with Commander.js
   - Interactive prompts with Inquirer.js
   - Progress bars with ora/cli-progress
   - Colored output with chalk

### Data Flow

```
Input Files → Parser → Content Extraction → Markdown Generation → Tag Application → Vault Output
     ↓                                              ↓
File Analysis                              Original Organization → Organized Directory
     ↓                                              ↑
Claude Analysis ────────────────────────────────────┘
(via Code or API)
```

## Installation & Distribution

### NPM Package
```bash
# Global installation
npm install -g polish-obsidian

# Local installation
npm install polish-obsidian

# Development installation
git clone https://github.com/username/polish
cd polish
npm install
npm link
```

### Package.json Structure
```json
{
  "name": "polish-obsidian",
  "version": "1.0.0",
  "description": "AI-powered file organization for Obsidian with markdown conversion",
  "main": "dist/index.js",
  "bin": {
    "polish": "./dist/cli.js"
  },
  "scripts": {
    "build": "tsc",
    "dev": "ts-node src/cli.ts",
    "test": "jest",
    "lint": "eslint src/**/*.ts",
    "prepublishOnly": "npm run build && npm run test"
  },
  "keywords": ["obsidian", "file-organization", "markdown", "ai", "claude"],
  "author": "Your Name",
  "license": "MIT",
  "dependencies": {
    "@anthropic-ai/sdk": "^0.x.x",
    "commander": "^11.0.0",
    "inquirer": "^9.0.0",
    "chalk": "^5.0.0",
    "pdf-parse": "^1.1.1",
    "mammoth": "^1.6.0",
    "sharp": "^0.33.0",
    "gray-matter": "^4.0.3",
    "glob": "^10.0.0",
    "ora": "^7.0.0"
  }
}
```

## Usage Modes

### 1. Claude Code Mode
```bash
# Within Claude Code environment
polish organize --mode claude-code

# Uses Claude's built-in capabilities
# No API key needed
# Interactive feedback
```

### 2. API Mode
```bash
# Using Claude API
export ANTHROPIC_API_KEY="your-api-key"
polish organize --mode api

# Batch processing
polish organize --mode api --batch 50
```

### 3. Hybrid Mode
```bash
# Use API for complex categorization, local for simple rules
polish organize --mode hybrid
```

### 4. Local Mode
```bash
# No AI, uses rule-based organization
polish organize --mode local
```

## CLI Interface

```bash
# Basic commands
polish organize              # Organize with default settings
polish config                # Interactive configuration
polish analyze               # Analyze without organizing
polish status                # Show current configuration

# Organization options
polish organize ~/Desktop --vault ~/Obsidian --originals ~/Organized
polish organize --dry-run    # Preview changes
polish organize --types "pdf,docx,md"
polish organize --mode api --batch 10

# Configuration
polish config set vault.path "~/MyVault"
polish config set api.key "sk-..."
polish config show

# Utilities
polish list-supported        # Show supported file types
polish clean-cache          # Clear processing cache
polish export-report        # Export organization report
```

## Documentation Structure

### 1. README.md
```markdown
# Polish

AI-powered file organization for Obsidian with automatic markdown conversion.

## Quick Start
- Installation
- Basic usage
- Key features
- Links to detailed docs

## Features
- Dual organization system
- Multiple usage modes
- Supported file types
- Example outputs
```

### 2. User Documentation (docs/)
```
docs/
├── getting-started.md
│   ├── Installation
│   ├── Initial setup
│   └── First organization
├── configuration.md
│   ├── Config file structure
│   ├── Environment variables
│   └── Advanced options
├── usage-modes.md
│   ├── Claude Code mode
│   ├── API mode
│   ├── Hybrid mode
│   └── Local mode
├── file-types.md
│   ├── Supported formats
│   ├── Conversion examples
│   └── Custom handlers
├── organization-strategies.md
│   ├── Folder structures
│   ├── Tagging systems
│   └── Custom rules
└── troubleshooting.md
    ├── Common issues
    ├── Error messages
    └── FAQ
```

### 3. API Documentation (api-docs/)
```
api-docs/
├── programmatic-usage.md
│   ├── Node.js integration
│   ├── API examples
│   └── Event handling
├── claude-api-integration.md
│   ├── API key setup
│   ├── Rate limiting
│   └── Error handling
└── extending-polish.md
    ├── Custom parsers
    ├── Tag generators
    └── Organization rules
```

### 4. Developer Documentation
```
CONTRIBUTING.md
├── Development setup
├── Architecture overview
├── Testing guidelines
└── Pull request process

ARCHITECTURE.md
├── Module structure
├── Data flow
├── Decision rationale
└── Future considerations
```

### 5. In-Code Documentation
- JSDoc comments for all public APIs
- Type definitions with descriptions
- Example usage in comments
- Error handling documentation

## API Usage Examples

### Programmatic Usage
```typescript
import { Polish } from 'polish-obsidian';

// Initialize with config
const polish = new Polish({
  vault: {
    path: '/path/to/vault'
  },
  originals: {
    path: '/path/to/organized'
  },
  mode: 'api',
  apiKey: process.env.ANTHROPIC_API_KEY
});

// Organize files
const results = await polish.organize({
  sources: ['/path/to/files'],
  dryRun: false,
  onProgress: (file, status) => {
    console.log(`Processing ${file}: ${status}`);
  }
});

// Get organization report
console.log(results.summary);
```

### Claude API Integration
```typescript
// Batch processing with Claude API
const batchProcessor = polish.createBatchProcessor({
  batchSize: 50,
  maxConcurrency: 5,
  rateLimitDelay: 1000
});

await batchProcessor.processDirectory('/large/directory');
```

## Configuration Schema

```json
{
  "vault": {
    "path": "/Users/username/ObsidianVault",
    "structure": {
      "documents": "Documents",
      "media": "Media",
      "code": "Code",
      "references": "References"
    }
  },
  "originals": {
    "path": "/Users/username/OrganizedFiles",
    "organizationStyle": "type-based",
    "createYearFolders": true
  },
  "sources": [
    {
      "path": "/Users/username/Desktop",
      "includeSubfolders": false
    }
  ],
  "processing": {
    "extractText": true,
    "maxFileSize": "50MB",
    "supportedFormats": ["pdf", "docx", "txt", "md", "png", "jpg", "py", "js"]
  },
  "tagging": {
    "maxTags": 10,
    "autoGenerateTypeTags": true,
    "customTagPatterns": {}
  },
  "api": {
    "mode": "claude-code", // or "api", "hybrid", "local"
    "apiKey": "env:ANTHROPIC_API_KEY",
    "model": "claude-3-opus-20240229",
    "maxTokens": 4096,
    "temperature": 0.3
  }
}
```

## Testing Strategy

### Unit Tests
- Parser modules
- Markdown generation
- Tag generation
- File organization logic

### Integration Tests
- Full processing pipeline
- API integration
- File system operations
- Error scenarios

### E2E Tests
- CLI commands
- Real file processing
- Configuration management

## Publishing Checklist

### Pre-release
- [ ] All tests passing
- [ ] Documentation complete
- [ ] Examples working
- [ ] CHANGELOG updated
- [ ] Version bumped

### NPM Publishing
```bash
# Login to npm
npm login

# Publish
npm publish

# Or with tags
npm publish --tag beta
```

### Post-release
- [ ] GitHub release created
- [ ] Documentation site updated
- [ ] Announcement made
- [ ] Issues triaged

## Success Metrics

- Installation success rate: > 95%
- First-run success: > 90%
- Documentation clarity: < 5 min to first organize
- API reliability: > 99.9% success rate
- Performance: < 5s per file processing
- User satisfaction: > 4.5/5 rating