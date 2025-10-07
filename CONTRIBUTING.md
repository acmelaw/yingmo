# Contributing

Thanks for your interest in contributing!

## Prerequisites

- Node.js >= 18
- npm

## Setup

1. Install dependencies:
   ```
   npm install
   ```
2. Start the frontend:
   ```
   npm run dev
   ```
3. (Optional) Start the sync server in another terminal:
   ```
   cd sync-server
   npm install
   npm run dev
   ```

## Development Workflow

- Keep changes focused and incremental.
- Prefer pure functions and dependency injection in store modules.
- Add or update tests (Vitest for units, Playwright for e2e) where relevant.
- Ensure build passes:
  ```
  npm run build
  ```
- Ensure tests pass:
  ```
  npm test
  npm run test:e2e
  ```

## Branching & Commits

- Branch naming suggestion: `feat/<topic>`, `fix/<topic>`, `docs/<topic>`, `chore/<topic>`
- Use clear, descriptive commit messages.

## Pull Requests

- Explain the motivation and approach.
- List key changes and any breaking changes.
- Include screenshots or terminal output when useful.
- Checklists:
  - [ ] Build passes
  - [ ] Tests pass locally
  - [ ] Docs updated (if needed)
