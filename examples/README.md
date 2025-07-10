# Polish Examples

This directory contains practical examples and use cases for Polish, demonstrating how to organize files for different scenarios and workflows.

## Directory Structure

- **[basic-usage/](basic-usage/)** - Getting started examples
- **[profile-management/](profile-management/)** - Multi-profile workflows
- **[programmatic-api/](programmatic-api/)** - Using Polish programmatically
- **[sample-configs/](sample-configs/)** - Example configurations
- **[workflows/](workflows/)** - Real-world workflow examples

## Quick Start Examples

### 1. First Time Setup

```bash
# Install Polish globally
npm install -g polish-cli

# Create your first profile
polish profile create personal
# Follow the interactive prompts...

# Organize your Desktop
polish organize ~/Desktop --dry-run
polish organize ~/Desktop
```

### 2. Multiple Vault Management

```bash
# Work profile
polish profile create work \
  --vault ~/Obsidian/WorkVault \
  --originals ~/OrganizedFiles/Work

# Personal profile  
polish profile create personal \
  --vault ~/Obsidian/PersonalVault \
  --originals ~/OrganizedFiles/Personal

# Switch between them
polish profile switch work
polish organize ~/WorkFiles

polish profile switch personal
polish organize ~/Downloads
```

### 3. Project-Specific Organization

```bash
# Research project
polish profile create research-ai \
  --description "AI research papers and notes"

# Configure for academic workflow
polish organize ~/Papers --types "pdf,txt,md"
```

## Example Workflows

### Academic Researcher
- **Profile**: `research`
- **Sources**: `~/Papers`, `~/Downloads`, `~/Academic`
- **Organization**: Date-based with topic tags
- **Use Case**: Research papers, notes, references

### Software Developer
- **Profile**: `development` 
- **Sources**: `~/Code`, `~/Downloads`, `~/Docs`
- **Organization**: Project-based with language tags
- **Use Case**: Code files, documentation, resources

### Content Creator
- **Profile**: `content`
- **Sources**: `~/Media`, `~/Scripts`, `~/Assets` 
- **Organization**: Type-based with project tags
- **Use Case**: Videos, images, scripts, assets

### Personal Knowledge Management
- **Profile**: `personal`
- **Sources**: `~/Documents`, `~/Downloads`
- **Organization**: Topic-based with date tags
- **Use Case**: Personal documents, web clippings, notes

## Getting Help

- Check the [user documentation](../docs/) for detailed guides
- See [troubleshooting](../docs/troubleshooting.md) for common issues
- Review [API documentation](../api-docs/) for programmatic usage