# Multi-Vault Workflow with Profiles

This example demonstrates managing multiple Obsidian vaults for different purposes using Polish profiles.

## Scenario

You're a researcher who also does consulting work and maintains personal notes. You need:

1. **Research Vault**: Academic papers, research notes, citations
2. **Work Vault**: Client projects, proposals, meeting notes  
3. **Personal Vault**: Personal documents, recipes, travel plans

## Setup

### 1. Create Research Profile

```bash
polish profile create research \
  --description "Academic research and papers" \
  --vault ~/Obsidian/Research \
  --originals ~/Files/Research
```

Interactive configuration:
- **Sources**: `~/Papers`, `~/Academic`, `~/Downloads`
- **Organization**: Date-based (chronological research)
- **Mode**: Claude API (for better academic tagging)

### 2. Create Work Profile

```bash
polish profile create work \
  --description "Client work and consulting" \
  --vault ~/Obsidian/Work \
  --originals ~/Files/Work
```

Configuration:
- **Sources**: `~/WorkDocs`, `~/ClientFiles`, `~/Downloads`
- **Organization**: Project-based
- **Mode**: Claude Code

### 3. Create Personal Profile

```bash
polish profile create personal \
  --description "Personal knowledge management" \
  --vault ~/Obsidian/Personal \
  --originals ~/Files/Personal
```

Configuration:
- **Sources**: `~/Documents`, `~/Downloads`, `~/Desktop`
- **Organization**: Type-based
- **Mode**: Local (privacy-focused)

## Daily Workflow

### Morning: Research Work

```bash
# Switch to research context
polish profile switch research

# Check what's new
polish analyze ~/Papers --types "pdf,txt,md"

# Organize research papers
polish organize ~/Papers

# Quick organize downloads (research mode)
polish organize ~/Downloads --types "pdf,docx"
```

**Result**: Papers organized with academic tags like:
- `#research/ai`
- `#paper/conference`
- `#author/smith-j`
- `#date/2024/01`

### Afternoon: Client Work

```bash
# Switch to work context  
polish profile switch work

# Organize client deliverables
polish organize ~/ClientFiles --copy

# Process meeting recordings and notes
polish organize ~/WorkDocs
```

**Result**: Work files organized with business tags:
- `#client/acme-corp`
- `#project/website-redesign`
- `#type/proposal`
- `#status/draft`

### Evening: Personal Organization

```bash
# Switch to personal context
polish profile switch personal

# Clean up downloads (personal mode)
polish organize ~/Downloads

# Organize personal documents
polish organize ~/Documents/Inbox
```

**Result**: Personal files with privacy-focused tags:
- `#topic/recipes`
- `#topic/travel`
- `#type/receipt`
- `#date/2024/01`

## Advanced Profile Management

### Profile Status Check

```bash
# Check all profiles
polish profile list

# Check specific profile
polish status --profile research
```

### Profile Cloning for Similar Setups

```bash
# Create a backup research profile
polish profile clone research research-backup

# Create similar profile for different research area
polish profile clone research neuroscience \
  --description "Neuroscience research vault"
```

### Profile Import/Export

```bash
# Export all profiles for backup
polish profile export ~/backup/polish-profiles.json

# Import profiles on new machine
polish profile import ~/backup/polish-profiles.json
```

## Vault-Specific Customizations

### Research Vault Structure

The research profile creates:

```
Research/
├── Papers/
│   ├── AI_Research_2024.md
│   ├── Neural_Networks_Review.md
│   └── Conference_Proceedings.md
├── Notes/
│   ├── Research_Ideas.md
│   └── Literature_Review.md
└── References/
    ├── Citation_Database.md
    └── Author_Index.md
```

### Work Vault Structure

The work profile creates:

```
Work/
├── Projects/
│   ├── Client_Proposal_ACME.md
│   └── Website_Redesign_Spec.md
├── Meetings/
│   ├── Weekly_Standup_Notes.md
│   └── Client_Call_Summary.md
└── Resources/
    ├── Template_Library.md
    └── Best_Practices.md
```

### Personal Vault Structure

The personal profile creates:

```
Personal/
├── Documents/
│   ├── Insurance_Policy.md
│   └── Tax_Documents_2024.md
├── Recipes/
│   ├── Pasta_Primavera.md
│   └── Chocolate_Cake.md
└── Travel/
    ├── Italy_Trip_2024.md
    └── Hotel_Confirmations.md
```

## Profile Switching Tips

### Quick Context Switching

```bash
# Create shell aliases for quick switching
alias pr='polish profile switch research'
alias pw='polish profile switch work' 
alias pp='polish profile switch personal'

# Then just use:
pr && polish organize ~/Papers
```

### Batch Operations

```bash
# Organize across all contexts
for profile in research work personal; do
  echo "Organizing for $profile..."
  polish organize --profile $profile
done
```

### Profile-Specific Scripts

Create profile-specific automation:

**research-daily.sh:**
```bash
#!/bin/bash
polish profile switch research
polish organize ~/Papers --types "pdf,txt"
polish organize ~/Downloads --types "pdf,docx" --copy
echo "Research files organized!"
```

## Benefits of Multi-Profile Setup

1. **Context Separation**: Clear boundaries between work areas
2. **Customized Organization**: Each vault has appropriate structure
3. **Privacy Control**: Different processing modes per context
4. **Workflow Efficiency**: Quick switching between contexts
5. **Backup Flexibility**: Export/import specific profiles

## Common Patterns

### Academic Researcher

```bash
polish profile create conferences --description "Conference papers and presentations"
polish profile create grants --description "Grant applications and funding"
polish profile create teaching --description "Course materials and student work"
```

### Consultant/Freelancer

```bash
polish profile create client-a --description "Client A project files"
polish profile create client-b --description "Client B project files"
polish profile create business --description "Business development and admin"
```

### Content Creator

```bash
polish profile create youtube --description "YouTube content creation"
polish profile create blog --description "Blog posts and articles"
polish profile create social --description "Social media content"
```

This multi-profile approach scales to any number of separate knowledge domains!