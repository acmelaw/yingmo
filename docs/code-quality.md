# Code Quality Checks

This document explains the automated code quality checks that run in our CI pipeline.

## Duplication Detection

We use [jscpd](https://github.com/kucherenko/jscpd) to detect code duplication across the codebase.

### Configuration

- **Location**: `.jscpd.json`
- **Threshold**: 1% (fails if more than 1% of code is duplicated)
- **Minimum lines**: 5 lines
- **Minimum tokens**: 70 tokens
- **Formats**: TypeScript, JavaScript, Vue

### Running Locally

```bash
npm run check:duplication
```

### How to Fix

If the check fails, review the duplication report in `reports/jscpd/jscpd-report.json` and:

1. Extract duplicated code into shared utility functions
2. Create reusable components or modules
3. If duplication is intentional (e.g., test setup), consider refactoring test helpers

## Dead Code Detection

We use [ts-prune](https://github.com/nadeesha/ts-prune) to detect potentially unused exports.

### Configuration

- **Location**: `.ts-prunerc`
- **Ignored**: Test files, config files, type definitions

### Running Locally

```bash
npm run check:dead-code
```

### How to Fix

If exports are flagged as unused:

1. Remove genuinely unused code
2. For composables and utilities that are meant to be exported for future use, add a comment explaining why
3. For types that are used in module exports, the tool may flag them - this is expected

**Note**: This check runs with `continue-on-error: true` in CI as it can flag legitimate exports.

## Build Artifacts

### dist/ Directory

The `dist/` directory contains build artifacts and is:

- **Ignored by git** (`.gitignore`)
- **Generated during CI** builds
- **Uploaded as artifacts** in CI for 7 days retention

Build artifacts should never be committed to the repository.

## Coverage

We maintain test coverage metrics:

```bash
npm run test:coverage
```

Coverage reports are generated in the `coverage/` directory and are excluded from git.

## Best Practices

1. **Keep duplication below 1%** - Extract shared utilities when you find yourself copying code
2. **Remove dead code** - Delete unused exports and files regularly
3. **Don't commit build artifacts** - The CI pipeline handles artifact generation
4. **Run checks locally** before pushing to ensure your code passes CI
