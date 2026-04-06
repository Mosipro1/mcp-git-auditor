# Contributing to MCP Git Auditor

First off, thank you for considering contributing to MCP Git Auditor! It's people like you that make this tool better for everyone.

## Getting Started

### Fork the Repository

1. Navigate to the repository on GitHub
2. Click the "Fork" button in the top-right corner
3. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR-USERNAME/mcp-git-auditor.git
   cd mcp-git-auditor
   ```

### Set Up Development Environment

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test
```

## Development Workflow

### Create a Branch

```bash
# Create and switch to a new branch
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b fix/issue-description
```

Branch naming conventions:
- `feature/` - New features or enhancements
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test additions or improvements

### Make Your Changes

1. Write clear, concise code
2. Follow the existing code style
3. Add or update tests as needed
4. Update documentation if relevant

### Commit Your Changes

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

Types:
- `feat:` - A new feature
- `fix:` - A bug fix
- `docs:` - Documentation only changes
- `style:` - Code style changes (formatting, semicolons, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Build process or auxiliary tool changes

Examples:
```
feat(security): add detection for GitLab tokens

fix(scanner): resolve path traversal edge case

docs(readme): add troubleshooting section
```

### Push and Create Pull Request

```bash
# Push your branch
git push origin feature/your-feature-name
```

Then create a Pull Request from your fork to the main repository:

1. Go to the original repository
2. Click "New Pull Request"
3. Select your fork and branch
4. Fill out the PR template

## Coding Standards

### TypeScript

- Use TypeScript strict mode
- Provide explicit types for function parameters and return values
- Use `const` and `let`, avoid `var`
- Prefer `async/await` over callbacks

### Code Style

- 2 spaces for indentation
- Single quotes for strings
- Semicolons at end of statements
- Maximum line length: 100 characters

### Testing

- Write tests for new features
- Ensure all tests pass before submitting PR
- Aim for good coverage of critical paths

```bash
# Run tests
npm test

# Run tests in watch mode
npm test -- --watch
```

## Areas for Contribution

### Good First Issues

Look for issues labeled `good first issue`. These are typically:

- Documentation improvements
- Small bug fixes
- Adding new test cases
- Performance optimizations

### Priority Areas

1. **Performance**: Optimize for large repositories
2. **Security Detection**: Add new secret patterns
3. **Standards**: Expand ISO/IEEE compliance checks
4. **Frameworks**: Add support for more test frameworks
5. **Documentation**: Improve clarity and examples

## Code of Conduct

### Our Standards

- Be respectful and inclusive
- Welcome newcomers
- Accept constructive criticism gracefully
- Focus on what's best for the community

### Unacceptable Behavior

- Harassment or discrimination
- Trolling or insulting comments
- Personal attacks
- Publishing others' private information

## Questions?

Feel free to:
- Open an issue for questions
- Join discussions in existing issues
- Contact the maintainers

## License

By contributing, you agree that your contributions will be licensed under the Apache License 2.0.

---

Thank you for contributing! 🎉
