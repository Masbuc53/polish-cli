#!/bin/bash

# Release preparation script for Polish
# Usage: ./scripts/prepare-release.sh [version]

set -e

VERSION=${1:-"patch"}

echo "🚀 Preparing Polish release..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Make sure you're in the Polish project directory."
    exit 1
fi

# Check if working directory is clean
if ! git diff-index --quiet HEAD --; then
    echo "❌ Error: Working directory is not clean. Commit your changes first."
    exit 1
fi

# Check if on main branch
BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$BRANCH" != "main" ]; then
    echo "❌ Error: You must be on the main branch to create a release."
    exit 1
fi

# Update version
echo "📦 Updating version..."
npm version $VERSION --no-git-tag-version

# Get new version
NEW_VERSION=$(node -p "require('./package.json').version")
echo "📋 New version: $NEW_VERSION"

# Run tests
echo "🧪 Running tests..."
npm test

# Run linting
echo "🔍 Running linter..."
npm run lint

# Run type checking
echo "🏷️ Running type check..."
npm run type-check

# Build project
echo "🔨 Building project..."
npm run build

# Update CHANGELOG.md
echo "📝 Updating CHANGELOG.md..."
DATE=$(date +"%Y-%m-%d")
sed -i '' "s/## \[Unreleased\]/## [Unreleased]\n\n## [$NEW_VERSION] - $DATE/" CHANGELOG.md

# Commit changes
echo "💾 Committing changes..."
git add package.json CHANGELOG.md
git commit -m "chore: bump version to $NEW_VERSION

🚀 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# Create tag
echo "🏷️ Creating tag..."
git tag -a "v$NEW_VERSION" -m "Release v$NEW_VERSION"

# Push changes and tag
echo "⬆️ Pushing to GitHub..."
git push origin main
git push origin "v$NEW_VERSION"

echo "✅ Release $NEW_VERSION prepared successfully!"
echo ""
echo "Next steps:"
echo "1. Go to GitHub and create a release from tag v$NEW_VERSION"
echo "2. Add release notes describing the changes"
echo "3. Publish the release"
echo "4. The CI will automatically publish to npm if configured"
echo ""
echo "🎉 Release ready!"