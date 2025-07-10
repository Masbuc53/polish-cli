# Polish 🪞

AI-powered file organization for Obsidian with automatic markdown conversion.

Polish creates a dual-organization system that converts all your files into tagged markdown documents for your Obsidian vault while intelligently organizing the original files in a separate directory structure.

## Features

- **👤 Multi-Profile Support**: Manage multiple vault configurations for different projects
- **🤖 AI-Powered Organization**: Uses Claude to intelligently categorize and tag files
- **📝 Markdown Conversion**: Converts all file types into markdown documents for Obsidian
- **🏷️ Smart Tagging**: Generates hierarchical tags based on content and context
- **📂 Dual Organization**: Keeps originals organized separately from vault
- **🔄 Multiple Modes**: Works with Claude Code, Claude API, or locally
- **⚡ Batch Processing**: Handle multiple files efficiently

## Quick Start

### Installation

```bash
npm install -g polish-obsidian
```

### Setup

```bash
polish config init
```

Follow the interactive setup to configure your vault path, organization preferences, and processing mode.

### Profile Management

Polish supports multiple profiles for different vaults and workflows:

```bash
# Create a new profile
polish profile create work

# List all profiles
polish profile list

# Switch between profiles
polish profile switch personal

# Show current profile
polish profile current

# Clone a profile
polish profile clone work work-backup
```

### Organize Files

```bash
# Organize files from default sources
polish organize

# Organize with specific profile
polish organize --profile work

# Organize specific folder
polish organize ~/Desktop/ToOrganize

# Preview changes without moving files
polish organize --dry-run
```

## Usage Modes

### Claude Code Mode (Recommended)
```bash
polish organize --mode claude-code
```
- No API key required
- Works within Claude Code environment
- Interactive feedback

### Claude API Mode
```bash
export ANTHROPIC_API_KEY="your-api-key"
polish organize --mode api
```
- Requires Anthropic API key
- Best for batch processing
- Programmatic access

### Local Mode
```bash
polish organize --mode local
```
- No AI processing
- Rule-based organization
- Works offline

## File Processing

Polish processes these file types:

- **Documents**: PDF, DOCX, TXT, RTF, ODT
- **Images**: PNG, JPG, GIF, BMP, SVG, WebP
- **Code**: JS, TS, Python, Java, C++, Go, Rust
- **Data**: JSON, CSV, XML, YAML
- **Archives**: ZIP, TAR, RAR, 7Z
- **Markdown**: MD files

## Output Structure

### Obsidian Vault
```
MyVault/
├── Documents/
│   ├── Project_Report.md
│   └── Meeting_Notes.md
├── Media/
│   └── Screenshot_Analysis.md
└── Code/
    └── Script_Documentation.md
```

### Original Files
```
OrganizedFiles/
├── 2024/
│   ├── Documents/
│   │   └── Project_Report.pdf
│   ├── Media/
│   │   └── screenshot.png
│   └── Code/
│       └── script.py
```

## Example Markdown Output

```markdown
---
title: "Meeting Notes Q1 2024"
originalFile: "[[file:///path/to/meeting_notes.pdf]]"
fileType: "pdf"
created: "2024-01-15T10:30:00Z"
processed: "2024-01-20T14:22:00Z"
tags:
  - type/document
  - project/q1-planning
  - topic/meeting
  - date/2024/01
---

# Meeting Notes Q1 2024

## Content

[Extracted text from PDF...]

---
*Original file: [meeting_notes.pdf](file:///path/to/meeting_notes.pdf)*
```

## CLI Commands

```bash
# Profile Management
polish profile create [name]    # Create new profile
polish profile list             # List all profiles
polish profile switch [name]    # Switch active profile
polish profile current          # Show current profile
polish profile delete [name]    # Delete profile
polish profile clone <src> <dst> # Clone profile

# Organization
polish organize [source]        # Organize files
polish organize --profile work  # Use specific profile
polish organize --dry-run       # Preview changes
polish organize --copy          # Copy instead of move

# Configuration
polish config init              # Interactive setup
polish config set vault.path "~/MyVault"
polish config show             # View current config

# Analysis
polish analyze ~/Desktop       # Analyze without organizing
polish status                  # Show current status
polish status --profile work   # Show specific profile status
polish list-supported          # Show supported file types
```

## Programmatic Usage

```typescript
import { Polish, ProfileManager } from 'polish-obsidian';

// Using profiles
const profileManager = new ProfileManager();
await profileManager.initialize();

// Use specific profile
const polish = new Polish(undefined, 'work');

// Or use custom config
const polishCustom = new Polish({
  vault: { path: '/path/to/vault' },
  originals: { path: '/path/to/organized' },
  api: { mode: 'claude-code' }
});

const results = await polish.organize({
  sources: ['/path/to/files'],
  dryRun: false,
  onProgress: (current, total, file) => {
    console.log(`Processing ${file.name} (${current}/${total})`);
  }
});

console.log(`Organized ${results.summary.successful} files`);

// Profile management
const profiles = await profileManager.listProfiles();
const activeConfig = await profileManager.getActiveConfig();
```

## Configuration

Polish stores its configuration in `~/.polish/config.json`. You can customize:

- **Vault structure**: Folder mapping for different file types
- **Tagging rules**: Custom tag patterns and hierarchies
- **Processing options**: File size limits, supported formats
- **AI settings**: Model selection, API configuration

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Support

- 📖 [Documentation](docs/)
- 🐛 [Issues](https://github.com/Masbuc53/polish-cli/issues)
- 💬 [Discussions](https://github.com/Masbuc53/polish-cli/discussions)