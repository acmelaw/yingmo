# Linting & Formatting Setup

This repository now has comprehensive linting and formatting infrastructure to ensure consistent code style across all contributions.

## Quick Start

### Before Committing

The repository has pre-commit hooks that automatically format and lint your staged files. Just commit as usual:

```bash
git add .
git commit -m "Your message"
# → Husky runs lint-staged automatically
```

### Manual Commands

```bash
# Check linting (warnings only, won't fail)
npm run lint

# Auto-fix linting issues
npm run lint:fix

# Check formatting
npm run format:check

# Format all files
npm run format

# Format specific files
npx prettier --write path/to/file
```

## Configuration Files

- **.prettierrc.json** - Prettier configuration (2 spaces, semicolons, double quotes)
- **.prettierignore** - Files/folders excluded from formatting (dist, node_modules, sync-server, helm, etc.)
- **.eslintrc.cjs** - ESLint rules for Vue 3 + TypeScript + Prettier
- **.eslintignore** - Files/folders excluded from linting
- **.editorconfig** - Editor settings (LF line endings, UTF-8, trim whitespace)
- **.gitattributes** - Git line ending normalization
- **.nvmrc** - Node version (18)

## VS Code Setup

The repository includes VS Code settings for automatic formatting:

1. Install recommended extensions (Prettier, ESLint)
2. Format on save is enabled by default
3. Prettier is set as the default formatter

## CI/CD

### GitHub Actions Workflows

**ci.yml** - Runs on push/PR to main:

- Install dependencies
- Type check
- Build
- Run unit tests
- Run E2E tests
- **Generate hero screenshot** - Automatically captures app state
- Upload screenshot artifact
- Commit screenshot to repo (on main branch only)

**lint.yml** - Runs on PRs:

- Lint check
- Format check

### Automated Screenshot Generation

The CI pipeline automatically generates a hero screenshot of the application:

- **Location**: `hero-screenshot.png` in the root directory
- **Display**: Embedded in README.md to showcase the app
- **Trigger**: Runs on every CI build, commits to main branch
- **Purpose**: Visual verification that the build works and displays current features
- **Implementation**: E2E test in `e2e/screenshot.spec.ts` captures the app with sample notes

This enables:

- Quick visual verification of the build status
- Automatic documentation updates showing current UI state
- Coding agents can independently verify the app is working
- Continuous visual regression testing

## Current State

### Linting Status

- ✅ 0 ESLint errors
- ⚠️ 1576 ESLint warnings (tracked for future cleanup)
- All warnings are formatting-related from Prettier integration

### Formatting Status

- ✅ All configuration files properly formatted
- ✅ All new code formatted via pre-commit hooks
- ⚠️ ~76 existing files have formatting issues (not reformatted to minimize delta)

## Gradual Improvement Strategy

Rather than reformatting the entire codebase at once, we're using a gradual approach:

1. **New code**: Automatically formatted via pre-commit hooks
2. **Modified code**: Formatted as part of changes via lint-staged
3. **Existing code**: Will be gradually formatted as files are touched

This approach:

- Minimizes merge conflicts
- Keeps git history clean
- Allows parallel development
- Gradually improves code quality

## Sync Server

The `sync-server` directory has its own linting configuration and is excluded from root linting. To lint sync-server code:

```bash
cd sync-server
npm run lint
npm run lint:fix
```

## Troubleshooting

### Pre-commit hook fails

If the pre-commit hook fails:

1. Review the errors shown
2. Run `npm run lint:fix` to auto-fix issues
3. Run `npm run format` to format code
4. Stage the fixes and commit again

### Bypass hooks (emergency only)

```bash
git commit --no-verify -m "Message"
```

Only use when absolutely necessary.

### ESLint/Prettier conflict

The configuration ensures ESLint and Prettier work together via `eslint-plugin-prettier`. If you see conflicts:

1. Ensure you're using the latest dependencies: `npm install`
2. Check that VS Code is using the workspace Prettier, not a global one

## For Contributors

Before submitting a PR, ensure:

- [ ] `npm run lint` shows 0 errors
- [ ] `npm run format:check` passes or shows minimal warnings
- [ ] Pre-commit hooks run successfully
- [ ] CI workflows will pass (check locally first)

The pre-commit hooks will help ensure your code meets standards automatically.
