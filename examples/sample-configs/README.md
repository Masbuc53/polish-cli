# Sample Configurations

This directory contains example configuration files for different use cases and workflows.

## Configuration Files

- **[basic-config.json](basic-config.json)** - Simple single-vault setup
- **[multi-profile-config.json](multi-profile-config.json)** - Multiple profiles configuration
- **[research-config.json](research-config.json)** - Academic research workflow
- **[developer-config.json](developer-config.json)** - Software development workflow
- **[content-creator-config.json](content-creator-config.json)** - Content creation workflow

## Usage

### Import Configuration

```bash
# Import a complete configuration
polish config import basic-config.json

# Import specific profile
polish profile import multi-profile-config.json --profile research
```

### Copy Configuration

```bash
# Copy existing configuration file
cp examples/sample-configs/basic-config.json ~/.polish/config.json

# Create profile from sample
polish profile create my-profile --from examples/sample-configs/research-config.json
```

### Customize Configuration

1. Copy a sample configuration that's closest to your needs
2. Edit the file to match your specific paths and preferences
3. Import or apply the configuration
4. Test with `--dry-run` mode first

## Configuration Structure

All configurations follow this general structure:

```json
{
  "vault": {
    "path": "/path/to/obsidian/vault",
    "structure": {
      "documents": "Documents",
      "media": "Media",
      "code": "Code",
      "references": "References"
    }
  },
  "originals": {
    "path": "/path/to/organized/files",
    "organizationStyle": "type-based",
    "createYearFolders": true
  },
  "sources": [...],
  "processing": {...},
  "tagging": {...},
  "api": {...}
}
```

## Tips

- Always use absolute paths in configuration files
- Test configurations with `--dry-run` before applying
- Start with a basic configuration and customize gradually
- Use environment variables for sensitive information