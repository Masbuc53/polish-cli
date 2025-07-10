# Troubleshooting Guide

This guide helps you resolve common issues with Polish.

## Common Issues

### Installation Problems

#### Permission Errors During Installation

**Problem:** `npm install -g polish-obsidian` fails with permission errors.

**Solution:**
```bash
# Option 1: Use npm's built-in solution
npm config set prefix '~/.npm-global'
export PATH=~/.npm-global/bin:$PATH
npm install -g polish-obsidian

# Option 2: Use Node Version Manager (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
npm install -g polish-obsidian
```

#### Command Not Found

**Problem:** `polish: command not found` after installation.

**Solution:**
```bash
# Check if Polish is installed
npm list -g polish-obsidian

# Find installation location
npm root -g

# Add to PATH (add to ~/.bashrc or ~/.zshrc)
export PATH="$(npm root -g)/.bin:$PATH"
```

### Configuration Issues

#### Profile Not Found

**Problem:** `Error: Profile 'my-profile' not found`

**Solution:**
```bash
# List available profiles
polish profile list

# Create the profile if it doesn't exist
polish profile create my-profile

# Check active profile
polish status
```

#### Invalid Vault Path

**Problem:** `Error: Vault path does not exist or is not accessible`

**Solution:**
```bash
# Check if path exists
ls -la "/path/to/your/vault"

# Update profile with correct path
polish profile edit my-profile

# Use absolute paths
polish profile create test --vault "$HOME/ObsidianVault"
```

### File Processing Issues

#### Files Not Being Processed

**Problem:** Polish doesn't process any files from source directories.

**Diagnosis:**
```bash
# Check what files are found
polish analyze ~/Desktop --verbose

# Check supported file types
polish list-supported

# Verify source paths
polish status --detailed
```

**Solutions:**
```bash
# Check file permissions
ls -la ~/Desktop

# Include more file types
polish organize ~/Desktop --types "pdf,docx,txt,png,jpg"

# Check for exclusion patterns
polish config show | grep excludePatterns
```

#### Processing Fails for Specific Files

**Problem:** Some files cause processing to fail.

**Diagnosis:**
```bash
# Run with debug logging
POLISH_LOG_LEVEL=debug polish organize ~/Desktop --dry-run

# Check file size and type
file ~/Desktop/problematic-file.ext
du -h ~/Desktop/problematic-file.ext
```

**Solutions:**
```bash
# Increase max file size
polish config set processing.maxFileSize "50MB"

# Skip problematic files
polish organize ~/Desktop --exclude "*.problematic-ext"

# Process individual files
polish organize ~/Desktop/specific-file.txt
```

### API and Processing Mode Issues

#### Claude API Authentication

**Problem:** API authentication fails.

**Solution:**
```bash
# Check API mode
polish config show | grep "mode"

# Switch to local mode temporarily
polish organize --mode local

# Verify API credentials (if using API mode)
polish config set api.mode "claude-code"
```

#### Slow Processing

**Problem:** File processing is very slow.

**Solutions:**
```bash
# Use local mode for faster processing
polish organize --mode local

# Reduce file size limit
polish config set processing.maxFileSize "10MB"

# Process in smaller batches
polish organize ~/Desktop --limit 10

# Skip text extraction for media files
polish organize ~/Desktop --skip-text-extraction
```

### Obsidian Integration Issues

#### Markdown Files Not Appearing in Obsidian

**Problem:** Organized files don't show up in Obsidian.

**Solution:**
```bash
# Check vault path
polish status | grep "Vault:"

# Verify Obsidian vault location
ls -la "/path/to/obsidian/vault"

# Force refresh in Obsidian
# Go to Obsidian: Settings → Files & Links → Detect all file extensions
```

#### Frontmatter Format Issues

**Problem:** Obsidian doesn't recognize the frontmatter.

**Solution:**
```bash
# Check generated markdown
cat "/path/to/vault/Documents/sample.md" | head -20

# Verify frontmatter format
polish config show | grep frontmatter
```

### Performance Issues

#### High Memory Usage

**Problem:** Polish consumes too much memory.

**Solutions:**
```bash
# Process files in smaller batches
polish organize ~/Desktop --batch-size 50

# Reduce concurrent processing
polish config set processing.concurrency 2

# Clear cache
polish cache clear
```

#### Disk Space Issues

**Problem:** Running out of disk space.

**Solutions:**
```bash
# Use copy mode instead of move
polish organize --copy

# Clean up old organized files
polish clean --older-than 30d

# Check disk usage
du -h ~/.polish/
du -h "/path/to/organized/files"
```

## Debugging Tools

### Enable Debug Logging

```bash
# Enable debug logging
export POLISH_LOG_LEVEL=debug
polish organize ~/Desktop --dry-run

# Save logs to file
polish organize ~/Desktop --log-file ~/polish-debug.log
```

### Check Configuration

```bash
# Show current configuration
polish config show

# Show profile details
polish profile show my-profile

# Validate configuration
polish config validate
```

### Analyze File Processing

```bash
# Analyze without processing
polish analyze ~/Desktop --detailed

# Check file types
polish analyze ~/Desktop --types-only

# Test specific file
polish analyze ~/Desktop/test-file.pdf --verbose
```

## Recovery Procedures

### Restore from Backup

```bash
# Restore configuration
cp ~/.polish/backup/config.json ~/.polish/config.json

# Restore profiles
cp ~/.polish/backup/profiles.json ~/.polish/profiles.json

# Restore organized files
cp -r ~/OrganizedFiles/backup/* ~/OrganizedFiles/
```

### Reset Configuration

```bash
# Reset to defaults
polish config reset

# Remove all profiles
polish profile reset

# Complete reset
rm -rf ~/.polish
polish profile create default
```

## Error Messages

### Common Error Messages and Solutions

**"Profile 'default' not found"**
```bash
polish profile create default
```

**"Vault path is not a valid directory"**
```bash
mkdir -p "/path/to/your/vault"
polish profile edit default
```

**"No files found to process"**
```bash
polish analyze ~/Desktop --verbose
```

**"API request failed"**
```bash
polish organize --mode local
```

**"Permission denied"**
```bash
sudo chown -R $(whoami) ~/.polish
```

## Getting Additional Help

### Information to Include When Reporting Issues

1. **System Information:**
   ```bash
   uname -a
   node --version
   npm --version
   polish --version
   ```

2. **Configuration:**
   ```bash
   polish config show
   polish status --detailed
   ```

3. **Error Output:**
   ```bash
   POLISH_LOG_LEVEL=debug polish organize ~/Desktop --dry-run 2>&1 | tee error.log
   ```

### Where to Get Help

- **GitHub Issues**: [Report bugs](https://github.com/user/polish/issues)
- **Discussions**: [Community support](https://github.com/user/polish/discussions)
- **Documentation**: Search these docs for specific topics

### Creating a Minimal Reproduction

When reporting issues, create a minimal example:

```bash
# Create test directory
mkdir ~/polish-test
echo "test content" > ~/polish-test/test.txt

# Try to reproduce the issue
polish organize ~/polish-test --dry-run
```

## Preventive Measures

### Regular Maintenance

```bash
# Weekly cleanup
polish clean --older-than 7d

# Monthly cache clear
polish cache clear

# Backup configuration
cp ~/.polish/config.json ~/.polish/backup/config-$(date +%Y%m%d).json
```

### Best Practices

1. **Always use `--dry-run` first** for new configurations
2. **Keep backups** of your configuration and important files
3. **Monitor disk space** when processing large numbers of files
4. **Update regularly** to get bug fixes and improvements
5. **Test with small batches** before processing large directories

This troubleshooting guide should help resolve most common issues with Polish. If you encounter a problem not covered here, please create an issue on GitHub with the debugging information outlined above.