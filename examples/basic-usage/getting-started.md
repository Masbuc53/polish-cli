# Getting Started with Polish

This guide walks you through your first Polish setup and file organization.

## Prerequisites

- Node.js 18+ installed
- An Obsidian vault (or willingness to create one)

## Installation

```bash
npm install -g polish-cli
```

## First-Time Setup

### Step 1: Create Your First Profile

```bash
polish profile create my-vault
```

You'll be prompted to configure:
- **Profile name**: `my-vault`
- **Description**: "My main Obsidian vault"
- **Vault path**: `/Users/username/ObsidianVault`
- **Originals path**: `/Users/username/OrganizedFiles`
- **Source folders**: Desktop, Downloads
- **Organization style**: By file type
- **Processing mode**: Claude Code (recommended)

### Step 2: Verify Setup

```bash
polish status
```

Output:
```
✨ Polish Status

👤 Profiles:
Active: my-vault
Total: 1

📁 Profile: my-vault
Vault: /Users/username/ObsidianVault ✓
Originals: /Users/username/OrganizedFiles ✓

📂 Sources:
- /Users/username/Desktop ✓
- /Users/username/Downloads ✓
```

### Step 3: Test with Sample Files

Create some test files:

```bash
mkdir -p ~/test-files
echo "Meeting notes from today" > ~/test-files/meeting-notes.txt
echo '{"name": "config", "version": "1.0"}' > ~/test-files/config.json
echo "print('Hello from Python')" > ~/test-files/script.py
```

### Step 4: Preview Organization

```bash
polish organize ~/test-files --dry-run
```

Output:
```
🔍 DRY RUN MODE - No files will be moved

Processing files...
✓ meeting-notes.txt → /ObsidianVault/Documents/
  Tags: #type/document #format/txt #topic/meeting #topic/notes
  Created companion note: meeting-notes.md

✓ config.json → /ObsidianVault/References/
  Tags: #type/data #format/json

✓ script.py → /ObsidianVault/Code/
  Tags: #type/code #format/py #language/python

Organization complete!
- Files processed: 3
- Companion notes created: 3
- Tags applied: 9
```

### Step 5: Organize for Real

```bash
polish organize ~/test-files
```

## Understanding the Results

After organization, you'll have:

### In Your Obsidian Vault:
```
ObsidianVault/
├── Documents/
│   └── meeting-notes.md
├── References/
│   └── config.md
└── Code/
    └── script.md
```

### In Your Organized Files:
```
OrganizedFiles/
└── 2024/
    ├── Document/
    │   └── meeting-notes.txt
    ├── Data/
    │   └── config.json
    └── Code/
        └── script.py
```

### Example Generated Markdown:

**meeting-notes.md:**
```markdown
---
title: "meeting-notes"
originalFile: "[[file:///path/to/meeting-notes.txt]]"
fileType: "txt"
created: "2024-01-20T10:00:00Z"
processed: "2024-01-20T10:30:00Z"
tags:
  - type/document
  - format/txt
  - topic/meeting
  - topic/notes
---

# meeting-notes

## Content

Meeting notes from today

---
*Original file: [meeting-notes.txt](file:///path/to/meeting-notes.txt)*
```

## Next Steps

1. **Customize Your Profile**: Adjust settings for your workflow
2. **Organize Real Files**: Start with your Downloads folder
3. **Explore Advanced Features**: Try different processing modes
4. **Create More Profiles**: Set up different workflows

## Common Commands

```bash
# Basic organization
polish organize

# Organize specific folder
polish organize ~/Documents/Inbox

# Copy instead of move
polish organize --copy

# Use different processing mode
polish organize --mode local

# Check what files would be processed
polish analyze ~/Downloads
```

## Troubleshooting

### Files not being processed?
- Check `polish list-supported` for supported file types
- Verify source folder paths exist
- Use `polish analyze` to see what files are found

### Want different organization?
- Try `polish organize --dry-run` first
- Adjust profile settings
- Create new profiles for different workflows

### Need help?
```bash
polish --help
polish profile --help
polish organize --help
```