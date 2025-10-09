# Quality Checks Quick Reference

This file provides quick commands for running quality checks locally.

## Quick Commands

```bash
# Run all quality checks (same as CI)
npm run quality:check

# Run quick quality checks (fast feedback)
npm run quality:quick

# Individual checks
npm run lint              # ESLint
npm run format:check      # Prettier
npm run check:duplication # jscpd
npm run check:dead-code   # ts-prune
npm test                  # Vitest
npm run build            # Production build
```

## Before Committing

**Recommended workflow:**

```bash
# Quick check while developing
npm run quality:quick

# Full check before committing
npm run quality:check
```

## Auto-fix Common Issues

```bash
# Fix linting issues
npm run lint:fix

# Fix formatting issues
npm run format
```

## What Gets Checked

### quality:quick (⚡ Fast ~30s)

1. TypeScript type checking
2. ESLint (code linting)
3. Prettier (code formatting)
4. Code duplication detection

### quality:check (🔍 Complete ~1-2min)

1. TypeScript type checking
2. ESLint (code linting)
3. Prettier (code formatting)
4. Code duplication detection
5. Dead code detection
6. Unit tests
7. Production build

## CI Equivalent

The `quality:check` command runs the exact same checks as CI, so if it passes locally, it will pass in CI.

## Tips

- Run `quality:quick` frequently during development for fast feedback
- Run `quality:check` before pushing to ensure CI will pass
- Use `lint:fix` and `format` to auto-fix most issues
- Check `docs/code-quality.md` for detailed documentation
