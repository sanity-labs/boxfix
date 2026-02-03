# Contributing to boxfix

Thank you for your interest in contributing to boxfix! This document provides guidelines and instructions for contributing.

## Development Setup

### Prerequisites

- Node.js 20 or later
- npm

### Getting Started

1. Fork and clone the repository:
   ```bash
   git clone https://github.com/YOUR_USERNAME/boxfix.git
   cd boxfix
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the project:
   ```bash
   npm run build
   ```

4. Run tests to verify setup:
   ```bash
   npm run test:run
   ```

## Development Workflow

### Branch Protection

The `main` branch is protected with the following rules:

- **Pull requests required** - All changes must go through a PR
- **Approval required** - At least 1 approving review needed
- **Status checks required** - CI must pass on Node 20 and 22
- **No force pushes** - History cannot be rewritten on main
- **Stale reviews dismissed** - New commits invalidate previous approvals

### Creating a Pull Request

1. Create a feature branch from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   ```

2. Make your changes, ensuring:
   - Tests pass: `npm run test:run`
   - Types check: `npm run typecheck`
   - Build succeeds: `npm run build`

3. Commit using [conventional commits](#commit-conventions)

4. Push and create a PR against `main`

5. Wait for CI to pass and request a review

### Commit Conventions

We use [Conventional Commits](https://www.conventionalcommits.org/). Format:

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation only
- `style` - Code style (formatting, semicolons, etc.)
- `refactor` - Code change that neither fixes a bug nor adds a feature
- `perf` - Performance improvement
- `test` - Adding or updating tests
- `build` - Build system or external dependencies
- `ci` - CI configuration
- `chore` - Other changes that don't modify src or test files

**Examples:**
```bash
feat(cli): add --verbose flag for detailed output
fix(width): handle zero-width joiners in emoji sequences
docs: update installation instructions
test: add edge cases for nested boxes
```

## Project Structure

```
src/
├── types.ts          # Type definitions and constants
├── width.ts          # Display width calculation
├── diagram-detector.ts # Diagram vs code heuristics
├── boxfix.ts         # Core fixing algorithm
├── markdown.ts       # Markdown processing
├── cli.ts            # CLI entry point
└── index.ts          # Library exports

test/
└── boxfix.test.ts    # Test suite

examples/             # Before/after diagram examples
```

## Testing

### Running Tests

```bash
npm test              # Watch mode
npm run test:run      # Single run (CI)
```

### Writing Tests

Tests use [Vitest](https://vitest.dev/). The test file covers:

- Width calculation for ASCII, Unicode, CJK, and emoji
- Diagram detection heuristics
- Line type classification (boundary, content, tree)
- Fixing various box styles
- Markdown code block processing

When adding features, include tests that cover:
- Happy path
- Edge cases
- Error conditions (if applicable)

### Test Guidelines

- Test behavior, not implementation
- One assertion per test when possible
- Use descriptive test names
- Follow existing test patterns

## Code Style

- TypeScript strict mode
- ESM modules (no CommonJS)
- Prefer `const` over `let`
- Use descriptive variable names
- Keep functions focused and small

## Making Changes

### Adding Features

1. Check existing issues or create one to discuss the feature
2. Fork and create a feature branch
3. Write tests first (TDD encouraged)
4. Implement the feature
5. Update documentation if needed
6. Submit a PR

### Fixing Bugs

1. Create an issue describing the bug (if not already reported)
2. Fork and create a fix branch
3. Add a test that reproduces the bug
4. Fix the bug
5. Verify the test passes
6. Submit a PR referencing the issue

### Documentation

- Update README.md for user-facing changes
- Update CLAUDE.md for architectural changes
- Add examples to `examples/` for new diagram support

## Release Process

Releases are managed through [Changesets](https://github.com/changesets/changesets):

1. Create a changeset when making user-facing changes:
   ```bash
   npm run changeset
   ```

2. Follow the prompts to describe your changes

3. Commit the generated changeset file with your PR

4. When merged to main, the release workflow will:
   - Create/update a "Version Packages" PR
   - When that PR is merged, publish to npm

## Getting Help

- Open an issue for bugs or feature requests
- Check existing issues before creating new ones
- Be clear and provide context in your reports

## Code of Conduct

Be respectful and constructive. We're all here to build something useful.
