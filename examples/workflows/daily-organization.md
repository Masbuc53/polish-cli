# Daily Organization Workflow

A comprehensive daily file organization routine using Polish to maintain a clean, organized digital workspace.

## Overview

This workflow processes files throughout the day, ensuring nothing accumulates in temporary locations like Downloads, Desktop, or email attachments.

## Setup

### Create Daily Profile

```bash
polish profile create daily \
  --description "Daily file organization routine" \
  --vault ~/ObsidianVault/Daily \
  --originals ~/OrganizedFiles/Daily
```

### Configure Sources

```json
{
  "sources": [
    {
      "path": "/Users/username/Desktop",
      "includeSubfolders": false,
      "excludePatterns": ["*.tmp", "*.DS_Store", "*.localized"]
    },
    {
      "path": "/Users/username/Downloads", 
      "includeSubfolders": false,
      "excludePatterns": ["*.tmp", "*.partial", "*.crdownload"]
    },
    {
      "path": "/Users/username/Documents/Inbox",
      "includeSubfolders": true,
      "excludePatterns": ["*.tmp"]
    }
  ]
}
```

## Daily Routine

### Morning: Quick Desktop Cleanup

```bash
# Switch to daily profile
polish profile switch daily

# Preview what's on desktop
polish analyze ~/Desktop --summary

# Organize if files found
polish organize ~/Desktop --dry-run
polish organize ~/Desktop
```

**Expected output:**
```
✨ Desktop Organization Complete

📊 Summary:
- Files processed: 5
- Screenshots → Media/Screenshots/
- Documents → Documents/Daily/
- Code files → Code/Scripts/

🏷️ Tags added: 12
⏱️ Completed in 2.3s
```

### Midday: Downloads Processing

```bash
# Check downloads folder
polish analyze ~/Downloads --types "pdf,docx,png,jpg"

# Process work-related files
polish organize ~/Downloads --filter "work,client,project"

# Process personal files
polish organize ~/Downloads --filter "personal,recipe,travel"
```

### Evening: Full Inbox Processing

```bash
# Process all accumulated files
polish organize --sources ~/Desktop,~/Downloads,~/Documents/Inbox

# Generate daily summary
polish status --summary
```

## Automation Scripts

### Daily Cleanup Script

**daily-cleanup.sh:**
```bash
#!/bin/bash

echo "🧹 Starting daily cleanup..."

# Switch to daily profile
polish profile switch daily

# Process each source with progress
echo "📁 Processing Desktop..."
polish organize ~/Desktop --quiet

echo "📁 Processing Downloads..."
polish organize ~/Downloads --quiet

echo "📁 Processing Inbox..."
polish organize ~/Documents/Inbox --quiet

# Generate summary
echo "📊 Daily Summary:"
polish status --summary

echo "✅ Daily cleanup complete!"
```

### Cron Job Setup

```bash
# Add to crontab for automatic execution
# Run daily cleanup at 6 PM
0 18 * * * /Users/username/scripts/daily-cleanup.sh

# Quick morning cleanup at 9 AM
0 9 * * * polish organize ~/Desktop --quiet
```

## File Type Handling

### Screenshots and Images

```bash
# Process screenshots with specific tags
polish organize ~/Desktop --types "png,jpg" --tags "screenshot,daily"

# Batch process phone photos
polish organize ~/Desktop --filter "IMG_,photo" --copy
```

### Documents and PDFs

```bash
# Process PDFs with text extraction
polish organize ~/Downloads --types "pdf" --extract-text

# Handle receipts and invoices
polish organize ~/Documents/Inbox --filter "receipt,invoice" --tags "finance"
```

### Code and Development Files

```bash
# Process code files
polish organize ~/Desktop --types "js,py,json" --tags "code,development"

# Handle project exports
polish organize ~/Downloads --filter "project,export" --preserve-structure
```

## Weekly Review

### Sunday: Weekly Organization

```bash
# Review the week's organization
polish status --profile daily --detailed

# Process any remaining files
polish organize --all-sources --dry-run
polish organize --all-sources

# Archive completed items
polish archive --older-than 7d --status completed
```

### Monthly Archive

```bash
# Archive old daily files
polish archive --older-than 30d --profile daily

# Generate monthly report
polish report --profile daily --period 30d
```

## Custom Filters

### Work Files Filter

```bash
# Create custom filter for work files
polish organize ~/Downloads --filter "client,proposal,contract,meeting"
```

### Personal Files Filter

```bash
# Create custom filter for personal files
polish organize ~/Downloads --filter "recipe,travel,personal,family"
```

## Integration with Other Tools

### Email Attachments

```bash
# Process email attachments folder
polish organize ~/Downloads/EmailAttachments --source email

# Handle Outlook attachments
polish organize ~/Downloads/OutlookAttachments --tags "email,attachment"
```

### Cloud Sync Folders

```bash
# Process Dropbox downloads
polish organize ~/Dropbox/Downloads --copy

# Process Google Drive downloads
polish organize ~/GoogleDrive/Downloads --copy
```

## Troubleshooting

### Common Issues

**Files not being processed:**
```bash
# Check what files are found
polish analyze ~/Desktop --verbose

# Check supported file types
polish list-supported
```

**Too many files processed:**
```bash
# Use more specific filters
polish organize ~/Downloads --types "pdf,docx" --newer-than 1d
```

**Duplicate files:**
```bash
# Check for duplicates before organizing
polish analyze ~/Downloads --check-duplicates
```

## Benefits

1. **Clean Workspace**: Never accumulate files in temporary locations
2. **Consistent Organization**: All files follow the same organizational logic
3. **Automated Tagging**: Files are automatically tagged for easy retrieval
4. **Time Savings**: Automated processing saves manual organization time
5. **Searchable Archive**: Everything is searchable in your Obsidian vault

## Customization

### Adjust for Your Workflow

```bash
# Modify processing frequency
polish organize --schedule "every 2 hours"

# Change organization style
polish config set organizationStyle "date-based"

# Add custom tag patterns
polish config set customTagPatterns.priority "urgent|high|medium|low"
```

### Create Shortcuts

```bash
# Add to ~/.bashrc or ~/.zshrc
alias daily-cleanup='polish profile switch daily && polish organize'
alias quick-desktop='polish organize ~/Desktop --quiet'
alias downloads-check='polish analyze ~/Downloads --summary'
```

This daily workflow ensures your digital workspace stays organized with minimal manual intervention!