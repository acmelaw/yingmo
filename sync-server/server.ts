/**
 * Vue Notes Sync Server v3.0
 *
 * Modern Fastify-based server with:
 * - Modular note type system (text, rich-text, markdown, code, image, smart-layer)
 * - Unicode hashtag support
 * - Edit history tracking
 * - Real-time Yjs collaboration
 * - Better Auth integration
 * - SQLite database with Drizzle ORM
 */

import Fastify from "fastify";
import fastifyCors from "@fastify/cors";
import fastifyWebsocket from "@fastify/websocket";
import * as Y from "yjs";
import * as awarenessProtocol from "y-protocols/awareness";
import * as syncProtocol from "y-protocols/sync";
import * as encoding from "lib0/encoding";
import * as decoding from "lib0/decoding";
import { eq } from "drizzle-orm";
import { db, schema } from "./db/index.js";
import { moduleRegistry } from "./services/ModuleRegistry.js";
import { DefaultNoteService } from "./services/NoteService.js";
import { initializeModules } from "./modules/index.js";
import { registerNoteRoutes } from "./routes/notes.js";
import { registerTagRoutes } from "./routes/tags.js";

// Environment configuration
const PORT = parseInt(process.env.PORT || "4444", 10);
const HOST = process.env.HOST || "0.0.0.0";
const CORS_ORIGIN = process.env.CORS_ORIGIN?.split(",") || [
  "http://localhost:5174",
  "http://localhost:5173",
];

// Initialize Fastify
const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || "info",
  },
  trustProxy: true,
});

// Register plugins
await fastify.register(fastifyCors, {
  origin: CORS_ORIGIN,
  credentials: true,
});

await fastify.register(fastifyWebsocket, {
  options: {
    maxPayload: 1048576, // 1MB
  },
});

// Initialize module system
moduleRegistry.initialize(fastify);
await initializeModules();

// Initialize note service
const noteService = new DefaultNoteService(db);
moduleRegistry.registerService("noteService", noteService);

// Register API routes
await registerNoteRoutes(fastify, noteService);
await registerTagRoutes(fastify, db);

// Yjs room management
interface Room {
  name: string;
  doc: Y.Doc;
  awareness: awarenessProtocol.Awareness;
  connections: Set<any>;
}

const rooms = new Map<string, Room>();

/**
 * Get or create a Yjs room
 */
function getRoom(roomName: string): Room {
  let room = rooms.get(roomName);

  if (!room) {
    const doc = new Y.Doc();
    const awareness = new awarenessProtocol.Awareness(doc);

    room = {
      name: roomName,
      doc,
      awareness,
      connections: new Set(),
    };

    rooms.set(roomName, room);

    // Load persisted state asynchronously
    loadRoomState(roomName, doc).catch((error) => {
      fastify.log.error(`Error loading room state: ${error}`);
    });

    // Auto-save on updates
    doc.on("update", (_update: Uint8Array) => {
      try {
        const state = Buffer.from(Y.encodeStateAsUpdate(doc)).toString(
          "base64"
        );

        db.insert(schema.documents)
          .values({
            id: roomName,
            tenantId: "default", // TODO: Extract from room name
            state,
            lastUpdated: new Date(),
            version: 0,
          })
          .onConflictDoUpdate({
            target: schema.documents.id,
            set: {
              state,
              lastUpdated: new Date(),
            },
          });
      } catch (error) {
        fastify.log.error(`Error saving room state: ${error}`);
      }
    });

    fastify.log.info(`Room created: ${roomName}`);
  }

  return room;
}

/**
 * Load persisted room state from database
 */
async function loadRoomState(roomName: string, doc: Y.Doc): Promise<void> {
  const saved = await db
    .select()
    .from(schema.documents)
    .where(eq(schema.documents.id, roomName))
    .limit(1);

  if (saved.length > 0 && saved[0].state) {
    const state = Buffer.from(saved[0].state, "base64");
    Y.applyUpdate(doc, new Uint8Array(state));
    fastify.log.info(`Loaded room state: ${roomName}`);
  }
}

/**
 * Health check
 */
fastify.get("/health", async () => {
  return {
    status: "ok",
    service: "Vue Notes Sync Server",
    version: "3.0.0",
    activeRooms: rooms.size,
    registeredModules: moduleRegistry.getAllModules().map((m) => ({
      id: m.id,
      name: m.name,
      version: m.version,
      supportedTypes: m.supportedTypes,
    })),
    registeredTypes: moduleRegistry.getRegisteredNoteTypes(),
    timestamp: new Date().toISOString(),
  };
});

/**
 * List active rooms
 */
fastify.get("/api/rooms", async () => {
  return {
    rooms: Array.from(rooms.entries()).map(([name, room]) => ({
      name,
      connections: room.connections.size,
    })),
  };
});

/**
 * Get edit history for a note
 * GET /api/notes/:noteId/history
 */
fastify.get<{
  Params: {
    noteId: string;
  };
}>("/api/notes/:noteId/history", async (request, reply) => {
  const { noteId } = request.params;

  try {
    const history = await db
      .select()
      .from(schema.noteEdits)
      .where(eq(schema.noteEdits.noteId, noteId))
      .orderBy(schema.noteEdits.timestamp);

    return {
      history: history.map((edit) => ({
        ...edit,
        timestamp: edit.timestamp.getTime(),
      })),
    };
  } catch (error) {
    fastify.log.error(`Get history error: ${error}`);
    reply.code(500);
    return { error: String(error) };
  }
});

/**
 * WebSocket endpoint for Yjs sync
 * WS /api/sync?room=roomName
 */
fastify.get("/api/sync", { websocket: true }, (connection, request) => {
  const url = new URL(request.url, `http://${request.headers.host}`);
  const roomName = url.searchParams.get("room") || "default";
  const room = getRoom(roomName);

  fastify.log.info(`WebSocket connected to room: ${roomName}`);
  room.connections.add(connection);

  // Send initial sync
  const encoder = encoding.createEncoder();
  encoding.writeVarUint(encoder, 0); // MESSAGE_SYNC
  syncProtocol.writeSyncStep1(encoder, room.doc);
  connection.send(encoding.toUint8Array(encoder));

  // Handle messages
  connection.on("message", (message: Buffer) => {
    try {
      const decoder = decoding.createDecoder(new Uint8Array(message));
      const messageType = decoding.readVarUint(decoder);
      const encoder = encoding.createEncoder();

      switch (messageType) {
        case 0: // MESSAGE_SYNC
          encoding.writeVarUint(encoder, 0);
          syncProtocol.readSyncMessage(decoder, encoder, room.doc, connection);
          if (encoding.length(encoder) > 1) {
            connection.send(encoding.toUint8Array(encoder));
          }
          break;

        case 1: // MESSAGE_AWARENESS
          awarenessProtocol.applyAwarenessUpdate(
            room.awareness,
            decoding.readVarUint8Array(decoder),
            connection
          );
          break;
      }
    } catch (error) {
      fastify.log.error(`WebSocket message error: ${error}`);
    }
  });

  // Handle disconnection
  connection.on("close", () => {
    room.connections.delete(connection);
    awarenessProtocol.removeAwarenessStates(
      room.awareness,
      [room.doc.clientID],
      null
    );
    fastify.log.info(`WebSocket disconnected from room: ${roomName}`);

    // Cleanup empty rooms
    if (room.connections.size === 0) {
      setTimeout(() => {
        if (room.connections.size === 0) {
          rooms.delete(roomName);
          fastify.log.info(`Room cleaned up: ${roomName}`);
        }
      }, 60000); // 1 minute delay
    }
  });

  // Broadcast awareness changes
  room.awareness.on("update", ({ added, updated, removed }: any) => {
    const changedClients = added.concat(updated).concat(removed);
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, 1); // MESSAGE_AWARENESS
    encoding.writeVarUint8Array(
      encoder,
      awarenessProtocol.encodeAwarenessUpdate(room.awareness, changedClients)
    );
    const message = encoding.toUint8Array(encoder);

    room.connections.forEach((conn) => {
      if (conn !== connection && conn.readyState === 1) {
        conn.send(message);
      }
    });
  });
});

/**
 * Start server
 */
try {
  await fastify.listen({ port: PORT, host: HOST });
  fastify.log.info(`
    🚀 Vue Notes Sync Server v3.0 started
    📡 WebSocket: ws://${HOST}:${PORT}/api/sync?room=<roomName>
    🌐 HTTP API: http://${HOST}:${PORT}/api/*
    💾 Database: SQLite (auto-configured)
    🔧 Modules: ${moduleRegistry.getAllModules().map((m) => m.name).join(", ")}
    📝 Note Types: ${moduleRegistry.getRegisteredNoteTypes().join(", ")}
  `);
} catch (error) {
  fastify.log.error(error);
  process.exit(1);
}

// Graceful shutdown
process.on("SIGTERM", async () => {
  fastify.log.info("SIGTERM received, shutting down gracefully...");
  await fastify.close();
  process.exit(0);
});

process.on("SIGINT", async () => {
  fastify.log.info("SIGINT received, shutting down gracefully...");
  await fastify.close();
  process.exit(0);
});
