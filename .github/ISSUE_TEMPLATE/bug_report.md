---
name: Bug report
about: Create a report to help us improve Polish
title: '[BUG] '
labels: bug
assignees: ''

---

**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Run command `polish ...`
2. With configuration `...`
3. See error

**Expected behavior**
A clear and concise description of what you expected to happen.

**Screenshots**
If applicable, add screenshots to help explain your problem.

**Environment (please complete the following information):**
- OS: [e.g. macOS, Ubuntu, Windows]
- Node.js version: [e.g. 18.17.0]
- Polish version: [e.g. 1.0.0]
- Obsidian version: [e.g. 1.4.16]

**Configuration**
Please provide your Polish configuration (remove any sensitive information):
```json
{
  "vault": {
    "path": "/path/to/vault"
  },
  // ... rest of config
}
```

**Additional context**
Add any other context about the problem here.

**Debug Information**
If possible, run the command with debug logging and include the output:
```bash
POLISH_LOG_LEVEL=debug polish [your-command] 2>&1
```