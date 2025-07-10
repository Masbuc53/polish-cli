# Contributing to Polish

Thank you for your interest in contributing to Polish! This document provides guidelines and information for contributors.

## Code of Conduct

By participating in this project, you agree to abide by our code of conduct:
- Be respectful and inclusive
- Provide constructive feedback
- Focus on what's best for the community
- Show empathy towards other community members

## Getting Started

### Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/yourusername/polish.git
   cd polish
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Run Tests**
   ```bash
   npm test
   ```

4. **Start Development**
   ```bash
   npm run dev
   ```

### Project Structure

```
src/
├── cli/            # CLI commands and interface
├── modules/        # Core functionality modules
├── services/       # External service integrations
├── types/          # TypeScript type definitions
└── utils/          # Utility functions

tests/
├── modules/        # Unit tests for modules
├── services/       # Unit tests for services
├── integration/    # Integration tests
└── coverage/       # Coverage verification tests
```

## Development Guidelines

### Code Style

- Follow TypeScript best practices
- Use ESLint configuration provided
- Write clear, self-documenting code
- Add JSDoc comments for public APIs

### Testing

- Write tests for all new functionality
- Maintain minimum 80% code coverage
- Include both unit and integration tests
- Test error scenarios and edge cases

### Commits

- Use conventional commit messages
- Write clear, descriptive commit messages
- Keep commits atomic and focused

Example:
```
feat: add PDF content extraction support
fix: handle file permission errors gracefully
docs: update CLI usage examples
test: add integration tests for file processing
```

## Contributing Process

### 1. Issue Discussion

- Check existing issues before creating new ones
- Use issue templates when available
- Provide detailed descriptions and reproduction steps
- Discuss major changes before implementation

### 2. Development

- Create a feature branch from `main`
- Follow the coding standards
- Write comprehensive tests
- Update documentation as needed

### 3. Pull Request

- Fill out the PR template completely
- Ensure all tests pass
- Request review from maintainers
- Address feedback promptly

### 4. Review Process

- Code review by at least one maintainer
- All CI checks must pass
- Documentation updates included
- Breaking changes properly documented

## Types of Contributions

### Bug Fixes
- Fix existing functionality that doesn't work as expected
- Include test cases that verify the fix
- Explain the root cause in PR description

### New Features
- Discuss the feature in an issue first
- Follow existing patterns and conventions
- Include comprehensive tests
- Update documentation

### Documentation
- Fix typos and improve clarity
- Add missing documentation
- Update examples and tutorials
- Improve code comments

### Performance Improvements
- Profile and measure before optimizing
- Include benchmarks in PR description
- Ensure changes don't break existing functionality

## Testing Guidelines

### Unit Tests
- Test individual functions and classes
- Mock external dependencies
- Cover edge cases and error conditions
- Use descriptive test names

### Integration Tests
- Test complete workflows
- Use real file system operations
- Test CLI commands end-to-end
- Verify error handling

### Coverage Requirements
- Minimum 80% overall coverage
- 85% coverage for modules and services
- All new code must be tested
- Coverage reports generated automatically

## Documentation

### Code Documentation
- JSDoc comments for all public APIs
- Type definitions with descriptions
- Example usage in comments

### User Documentation
- Update README for new features
- Add CLI help text
- Create usage examples
- Update configuration documentation

## Release Process

### Version Numbering
- Follow Semantic Versioning (SemVer)
- Breaking changes increment major version
- New features increment minor version
- Bug fixes increment patch version

### Release Checklist
- [ ] All tests passing
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Version bumped in package.json
- [ ] Git tag created
- [ ] npm package published
- [ ] GitHub release created

## Getting Help

### Communication Channels
- GitHub Issues for bug reports and feature requests
- GitHub Discussions for questions and ideas
- Pull Request comments for code review

### Resources
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Jest Testing Framework](https://jestjs.io/docs/getting-started)
- [Obsidian API Documentation](https://docs.obsidian.md/)

## Recognition

Contributors will be recognized in:
- CONTRIBUTORS.md file
- GitHub contributors page
- Release notes for significant contributions

Thank you for contributing to Polish! 🎉