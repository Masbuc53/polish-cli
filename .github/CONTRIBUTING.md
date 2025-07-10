# Contributing to Polish

Thank you for your interest in contributing to Polish! This document provides guidelines and information for contributors.

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct. Please be respectful and constructive in all interactions.

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in [Issues](https://github.com/user/polish/issues)
2. If not, create a new issue using the bug report template
3. Include detailed reproduction steps and environment information
4. Add relevant logs with `POLISH_LOG_LEVEL=debug`

### Suggesting Features

1. Check if the feature has already been requested
2. Create a new issue using the feature request template
3. Describe your use case and how the feature would help
4. Be open to discussion and feedback

### Contributing Code

1. Fork the repository
2. Create a feature branch from `develop`
3. Make your changes
4. Add tests for your changes
5. Ensure all tests pass
6. Run linting and type checking
7. Create a pull request

## Development Setup

### Prerequisites

- Node.js 18+ 
- npm 8+
- Git

### Setup

```bash
# Clone your fork
git clone https://github.com/your-username/polish.git
cd polish

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Run linting
npm run lint

# Run type checking
npm run type-check
```

### Development Workflow

```bash
# Create a feature branch
git checkout -b feature/your-feature-name

# Make your changes
# ...

# Run tests
npm test

# Run linting
npm run lint

# Build and test
npm run build
npm run test:integration

# Commit your changes
git commit -m "feat: add your feature description"

# Push to your fork
git push origin feature/your-feature-name

# Create a pull request
```

## Code Style

- Use TypeScript for all new code
- Follow the existing code style
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Keep functions small and focused

## Testing

- Write unit tests for all new functionality
- Integration tests for CLI commands
- Maintain test coverage above 80%
- Use descriptive test names
- Test both success and error cases

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- --testPathPattern=ProfileManager

# Run tests in watch mode
npm run test:watch
```

## Documentation

- Update documentation for any user-facing changes
- Add examples for new features
- Update API documentation for public methods
- Keep README.md current
- Add comments for complex logic

## Pull Request Process

1. Ensure your PR addresses a specific issue or feature request
2. Update documentation as needed
3. Add tests for new functionality
4. Ensure all CI checks pass
5. Request review from maintainers
6. Address feedback promptly

### PR Guidelines

- Keep PRs focused on a single feature or fix
- Use descriptive titles and descriptions
- Link to related issues
- Include screenshots for UI changes
- Update CHANGELOG.md for user-facing changes

## Coding Standards

### TypeScript

- Use strict TypeScript settings
- Define interfaces for all data structures
- Use enums for constants
- Prefer type safety over convenience

### Error Handling

- Use specific error types
- Provide helpful error messages
- Handle edge cases gracefully
- Log errors appropriately

### Performance

- Avoid blocking operations
- Use async/await for I/O operations
- Optimize for large file counts
- Consider memory usage

## Architecture

### Project Structure

```
src/
├── cli/           # CLI commands and interface
├── modules/       # Core processing modules
├── services/      # Business logic services
├── types/         # TypeScript type definitions
└── utils/         # Utility functions

tests/             # Test files
docs/              # Documentation
examples/          # Usage examples
```

### Key Components

- **CLI**: Command-line interface using Commander.js
- **ProfileManager**: Handles multiple vault configurations
- **FileProcessor**: Core file processing logic
- **ContentExtractor**: Extracts content from various file types
- **MarkdownGenerator**: Creates Obsidian-compatible markdown

## Release Process

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Create a release branch
4. Test thoroughly
5. Merge to `main`
6. Tag the release
7. Publish to npm

## Getting Help

- Check the [documentation](docs/)
- Search existing [issues](https://github.com/user/polish/issues)
- Ask questions in [discussions](https://github.com/user/polish/discussions)
- Join our community chat (if available)

## Recognition

Contributors will be recognized in:
- CHANGELOG.md for significant contributions
- README.md contributors section
- Release notes for major features

Thank you for contributing to Polish! 🎉