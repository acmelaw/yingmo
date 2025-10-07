# Sync Server

Modern sync server for Yingmo built with Fastify, Better Auth, Drizzle ORM on better-sqlite3, and Yjs protocol helpers.

- Runtime: Node.js >= 18
- Framework: Fastify (HTTP + WebSocket)
- Auth: Better Auth
- DB/ORM: better-sqlite3 + Drizzle ORM
- Realtime: ws + Yjs (y-protocols)
- TypeScript with `tsx` for dev

## Getting Started

Install:
```
cd sync-server
npm install
```

Dev mode:
```
npm run dev
```

Build:
```
npm run build
```

Start:
```
npm start
```

By default, Docker mapping in scripts exposes port `4444`:
```
npm run docker:build
npm run docker:run
# container port 4444 is mapped to host 4444
```

## Database & Migrations

Drizzle commands:
```
npm run db:generate   # Generate migrations
npm run db:migrate    # Run migrations
npm run db:studio     # Visualize schema
```

## Quality

- Lint: `npm run lint` / `npm run lint:fix`
- Type-check: `npm run type-check`
- Tests: `npm test`, `npm run test:coverage`

## Notes

- The server exposes WebSocket support for Yjs collaboration and sync.
- Authentication and configuration details are defined in the server source (see `server.ts` and related modules).
- The local database uses better-sqlite3; storage location and schema are managed via Drizzle.
