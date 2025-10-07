# Development

## Prerequisites

- Node.js >= 18
- npm (or your preferred compatible package manager)

## Setup

Install dependencies:
```
npm install
```

Start the frontend in dev mode:
```
npm run dev
```

Optional: start the sync server (separate terminal):
```
cd sync-server
npm install
npm run dev
```

## Build and Preview

Build:
```
npm run build
```

Preview:
```
npm run preview
```

## Testing

Unit tests:
```
npm test
npm run test:coverage
```

E2E tests:
```
npm run test:e2e
```

UI mode:
```
npm run test:ui
npm run test:e2e:ui
```

## Project Conventions

- TypeScript strictness: keep types explicit where practical
- Store modules:
  - Prefer pure functions where possible
  - Use dependency injection for external services for testability
  - Keep single responsibility per module
- Paths:
  - Frontend uses `@/*` alias mapped to `src/*` (see tsconfig)

## Useful Scripts

From root package.json:
- Dev: `npm run dev`
- Build: `npm run build`
- Preview: `npm run preview`
- Tests: `npm test`, `npm run test:ui`, `npm run test:coverage`
- E2E: `npm run test:e2e`, `npm run test:e2e:ui`, `npm run test:e2e:headed`, `npm run test:e2e:debug`
