#!/bin/bash

# GitHub Repository Setup Script for Polish
# Replace YOUR_GITHUB_USERNAME with your actual GitHub username

GITHUB_USERNAME="Masbuc53"
REPO_NAME="polish-cli"

echo "🚀 Setting up GitHub repository for Polish..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Make sure you're in the Polish project directory."
    exit 1
fi

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "❌ Error: Git repository not initialized. Run 'git init' first."
    exit 1
fi

# Add GitHub remote
echo "📡 Adding GitHub remote..."
git remote add origin "https://github.com/${GITHUB_USERNAME}/${REPO_NAME}.git"

# Check if we have commits
if ! git log --oneline -1 > /dev/null 2>&1; then
    echo "📝 No commits found. Creating initial commit..."
    git add .
    git commit -m "Initial commit: Complete Polish project

🚀 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"
fi

# Push to GitHub
echo "⬆️ Pushing to GitHub..."
git push -u origin main

echo "✅ Repository setup complete!"
echo ""
echo "Next steps:"
echo "1. Visit https://github.com/${GITHUB_USERNAME}/${REPO_NAME}"
echo "2. Enable GitHub Actions in the Actions tab"
echo "3. Add NPM_TOKEN secret for publishing (optional)"
echo "4. Set up branch protection rules (recommended)"
echo "5. Create your first release when ready"
echo ""
echo "🎉 Your Polish repository is ready!"