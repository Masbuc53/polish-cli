# Installation Guide

This guide covers installing Polish on your system and getting it ready for use.

## Prerequisites

- **Node.js**: Version 18 or higher
- **npm**: Version 8 or higher (comes with Node.js)
- **Operating System**: macOS, Linux, or Windows

### Check Prerequisites

```bash
# Check Node.js version
node --version  # Should be 18.0.0 or higher

# Check npm version
npm --version   # Should be 8.0.0 or higher
```

## Installation

### Option 1: Global Installation (Recommended)

```bash
npm install -g polish-obsidian
```

**Benefits:**
- Available from anywhere in your terminal
- Simplest to use
- Automatic updates with `npm update -g polish-obsidian`

### Option 2: Local Installation

```bash
# Create a directory for Polish
mkdir ~/polish-app
cd ~/polish-app

# Install locally
npm install polish-obsidian

# Run using npx
npx polish --version
```

### Option 3: Development Installation

```bash
# Clone the repository
git clone https://github.com/user/polish.git
cd polish

# Install dependencies
npm install

# Build the project
npm run build

# Link globally for development
npm link
```

## Verify Installation

```bash
# Check Polish version
polish --version

# Verify installation
polish --help
```

Expected output:
```
Polish v1.0.0 - AI-powered file organization for Obsidian

Usage: polish [options] [command]

Options:
  -V, --version   Display version number
  -h, --help      Display help for command

Commands:
  profile         Manage profiles
  organize        Organize files
  analyze         Analyze files
  status          Show status
  help [command]  Display help for command
```

## First-Time Setup

### 1. Create Your First Profile

```bash
polish profile create my-vault
```

You'll be prompted to configure:
- Profile name
- Description
- Obsidian vault path
- Organized files path
- Source directories
- Processing preferences

### 2. Test the Setup

```bash
# Check status
polish status

# Test with a small directory
polish organize ~/Desktop --dry-run
```

## System-Specific Setup

### macOS

**Homebrew Installation:**
```bash
# Install Node.js via Homebrew
brew install node

# Install Polish
npm install -g polish-obsidian
```

**Permissions:**
Polish may need permissions to access certain directories. Grant access when prompted.

### Linux

**Ubuntu/Debian:**
```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Polish
npm install -g polish-obsidian
```

**CentOS/RHEL:**
```bash
# Install Node.js
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Install Polish
npm install -g polish-obsidian
```

### Windows

**Using Node.js Installer:**
1. Download Node.js from [nodejs.org](https://nodejs.org/)
2. Run the installer
3. Open Command Prompt or PowerShell
4. Install Polish: `npm install -g polish-obsidian`

**Using Chocolatey:**
```powershell
# Install Node.js
choco install nodejs

# Install Polish
npm install -g polish-obsidian
```

## Configuration

### Environment Variables

Polish respects these environment variables:

```bash
# Configuration directory (default: ~/.polish)
export POLISH_CONFIG_DIR="$HOME/.polish"

# Default profile (default: "default")
export POLISH_DEFAULT_PROFILE="my-profile"

# Log level (default: "info")
export POLISH_LOG_LEVEL="debug"
```

### Shell Integration

Add to your `.bashrc`, `.zshrc`, or equivalent:

```bash
# Polish aliases
alias po='polish organize'
alias pa='polish analyze'
alias ps='polish status'
alias pc='polish config'

# Profile shortcuts
alias work='polish profile switch work'
alias personal='polish profile switch personal'
```

## Troubleshooting Installation

### Common Issues

**Permission Errors:**
```bash
# If npm install fails with permission errors
npm config set prefix '~/.npm-global'
export PATH=~/.npm-global/bin:$PATH
npm install -g polish-obsidian
```

**Node.js Version Issues:**
```bash
# Use Node Version Manager (nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
```

**Installation Hangs:**
```bash
# Clear npm cache
npm cache clean --force

# Try with different registry
npm install -g polish-obsidian --registry https://registry.npmjs.org/
```

### Verification Commands

```bash
# Check installation location
which polish

# Check package info
npm list -g polish-obsidian

# Check dependencies
polish --version --verbose
```

## Updating Polish

### Automatic Updates

```bash
# Update to latest version
npm update -g polish-obsidian

# Check for updates
npm outdated -g polish-obsidian
```

### Manual Updates

```bash
# Uninstall current version
npm uninstall -g polish-obsidian

# Install latest version
npm install -g polish-obsidian
```

## Uninstalling

```bash
# Remove Polish globally
npm uninstall -g polish-obsidian

# Remove configuration (optional)
rm -rf ~/.polish
```

## Next Steps

After installation:

1. **[Quick Start Guide](quick-start.md)** - Get organizing in 5 minutes
2. **[Configuration Guide](configuration.md)** - Customize Polish for your workflow
3. **[Examples](../examples/)** - See real-world usage examples

## Getting Help

If you encounter issues:

1. Check the [Troubleshooting Guide](troubleshooting.md)
2. Search [GitHub Issues](https://github.com/user/polish/issues)
3. Create a new issue with:
   - Operating system and version
   - Node.js version (`node --version`)
   - Polish version (`polish --version`)
   - Error messages or unexpected behavior