# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Profile System**: Support for multiple vault configurations
  - Create, switch, and manage multiple profiles
  - Each profile has independent vault and source settings
  - Automatic migration from legacy single configuration
  - Profile import/export functionality
  - Clone and rename profile operations
- Profile-aware CLI commands with `--profile` option
- Enhanced status command showing profile information
- ProfileManager service for programmatic profile management

### Changed
- Updated all CLI commands to support profile selection
- ConfigService now works alongside ProfileManager
- Main Polish class accepts profile name parameter

## [0.1.0] - 2024-01-20

### Added
- Initial release of Polish
- AI-powered file organization system
- Dual organization (Obsidian vault + organized originals)
- Multiple processing modes (Claude Code, API, hybrid, local)
- File content extraction and markdown generation
- Intelligent tagging system
- CLI interface with comprehensive commands
- Configuration management system
- Support for multiple file types:
  - Documents: PDF, DOCX, TXT, RTF, ODT
  - Images: PNG, JPG, GIF, BMP, SVG, WebP
  - Code: JS, TS, Python, Java, C++, Go, Rust, etc.
  - Data: JSON, CSV, XML, YAML
  - Archives: ZIP, TAR, RAR, 7Z
- Comprehensive test suite with 80%+ coverage
- TypeScript support with full type definitions
- ES modules compatibility
- Cross-platform support (macOS, Linux, Windows)

### Features
- **Smart File Analysis**: Automatically categorizes files based on content and metadata
- **Tag Generation**: Creates hierarchical tags for powerful organization
- **Markdown Conversion**: Converts all files to markdown for Obsidian
- **Content Preservation**: Maintains original files in organized structure
- **Flexible Configuration**: Customizable folder structures and tagging rules
- **Dry Run Mode**: Preview organization changes before execution
- **Progress Tracking**: Real-time feedback during file processing
- **Error Handling**: Graceful handling of processing failures

### CLI Commands
- `polish organize` - Organize files from configured sources
- `polish config init` - Interactive configuration setup
- `polish analyze` - Analyze files without organizing
- `polish status` - Show current configuration and status
- `polish list-supported` - Display supported file types

### Technical
- Built with TypeScript and Node.js
- ES modules architecture
- Jest testing framework
- ESLint code quality
- GitHub Actions CI/CD
- Comprehensive documentation
- MIT License