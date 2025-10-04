/**
 * Lightweight WebSocket Sync Server for Vue Notes
 *
 * Features:
 * - WebSocket-based Yjs synchronization
 * - Multi-room support
 * - Horizontal scaling with Redis (optional)
 * - Health checks
 * - Graceful shutdown
 * - Production-ready
 */

import { WebSocketServer, WebSocket } from "ws";
import http from "http";
import * as Y from "yjs";
import * as awarenessProtocol from "y-protocols/awareness";
import * as syncProtocol from "y-protocols/sync";
import * as encoding from "lib0/encoding";
import * as decoding from "lib0/decoding";
import { createClient, RedisClientType } from "redis";

const PORT = process.env.PORT || 4444;
const USE_REDIS = process.env.REDIS_URL !== undefined;
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(",") || [
  "http://localhost:5173",
];
const PERSISTENCE_ENABLED = process.env.PERSISTENCE === "true";
const PERSISTENCE_DIR = process.env.PERSISTENCE_DIR || "./data";

interface Room {
  name: string;
  doc: Y.Doc;
  awareness: awarenessProtocol.Awareness;
  connections: Set<WebSocket>;
}

const rooms = new Map<string, Room>();
let redisClient: RedisClientType | null = null;
let redisSubscriber: RedisClientType | null = null;

// Message types
const MESSAGE_SYNC = 0;
const MESSAGE_AWARENESS = 1;

/**
 * Get or create a room
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

    // Load persisted state if available
    if (PERSISTENCE_ENABLED) {
      loadRoomState(roomName, doc);
    }

    // Setup persistence on updates
    doc.on("update", (update: Uint8Array) => {
      if (PERSISTENCE_ENABLED) {
        saveRoomState(roomName, Y.encodeStateAsUpdate(doc));
      }

      // Broadcast to Redis for multi-instance sync
      if (USE_REDIS && redisClient) {
        redisClient.publish(
          `yjs:${roomName}:update`,
          Buffer.from(update).toString("base64")
        );
      }
    });

    console.log(`Room created: ${roomName}`);
  }

  return room;
}

/**
 * Handle WebSocket connection
 */
function handleConnection(conn: WebSocket, req: http.IncomingMessage) {
  const url = new URL(req.url || "", `http://${req.headers.host}`);
  const roomName = url.searchParams.get("room") || "default";
  const room = getRoom(roomName);

  room.connections.add(conn);

  // Send initial sync
  const encoder = encoding.createEncoder();
  encoding.writeVarUint(encoder, MESSAGE_SYNC);
  syncProtocol.writeSyncStep1(encoder, room.doc);
  conn.send(encoding.toUint8Array(encoder));

  // Send awareness states
  const awarenessStates = room.awareness.getStates();
  if (awarenessStates.size > 0) {
    const awarenessEncoder = encoding.createEncoder();
    encoding.writeVarUint(awarenessEncoder, MESSAGE_AWARENESS);
    encoding.writeVarUint8Array(
      awarenessEncoder,
      awarenessProtocol.encodeAwarenessUpdate(
        room.awareness,
        Array.from(awarenessStates.keys())
      )
    );
    conn.send(encoding.toUint8Array(awarenessEncoder));
  }

  // Handle messages
  conn.on("message", (message: Buffer) => {
    const decoder = decoding.createDecoder(new Uint8Array(message));
    const messageType = decoding.readVarUint(decoder);

    try {
      switch (messageType) {
        case MESSAGE_SYNC:
          handleSyncMessage(decoder, room, conn);
          break;
        case MESSAGE_AWARENESS:
          handleAwarenessMessage(decoder, room, conn);
          break;
      }
    } catch (err) {
      console.error("Error handling message:", err);
    }
  });

  // Handle disconnect
  conn.on("close", () => {
    room.connections.delete(conn);
    awarenessProtocol.removeAwarenessStates(
      room.awareness,
      [room.doc.clientID],
      null
    );

    // Clean up empty rooms
    if (room.connections.size === 0) {
      setTimeout(() => {
        if (room.connections.size === 0) {
          rooms.delete(roomName);
          console.log(`Room cleaned up: ${roomName}`);
        }
      }, 60000); // Keep room alive for 1 minute
    }
  });

  console.log(
    `Client connected to room: ${roomName} (${room.connections.size} total)`
  );
}

/**
 * Handle sync protocol messages
 */
function handleSyncMessage(
  decoder: decoding.Decoder,
  room: Room,
  sender: WebSocket
) {
  const encoder = encoding.createEncoder();
  const syncMessageType = syncProtocol.readSyncMessage(
    decoder,
    encoder,
    room.doc,
    sender
  );

  if (encoding.length(encoder) > 1) {
    const responseEncoder = encoding.createEncoder();
    encoding.writeVarUint(responseEncoder, MESSAGE_SYNC);
    encoding.writeUint8Array(responseEncoder, encoding.toUint8Array(encoder));
    sender.send(encoding.toUint8Array(responseEncoder));
  }

  // Broadcast updates to other clients
  if (syncMessageType === syncProtocol.messageYjsSyncStep2) {
    const update = encoding.toUint8Array(encoder);
    broadcastMessage(room, update, sender);
  }
}

/**
 * Handle awareness protocol messages
 */
function handleAwarenessMessage(
  decoder: decoding.Decoder,
  room: Room,
  sender: WebSocket
) {
  awarenessProtocol.applyAwarenessUpdate(
    room.awareness,
    decoding.readVarUint8Array(decoder),
    sender
  );

  // Broadcast awareness to other clients
  const encoder = encoding.createEncoder();
  encoding.writeVarUint(encoder, MESSAGE_AWARENESS);
  encoding.writeVarUint8Array(
    encoder,
    awarenessProtocol.encodeAwarenessUpdate(room.awareness, [room.doc.clientID])
  );
  broadcastMessage(room, encoding.toUint8Array(encoder), sender);
}

/**
 * Broadcast message to all clients in room except sender
 */
function broadcastMessage(room: Room, message: Uint8Array, sender?: WebSocket) {
  room.connections.forEach((conn) => {
    if (conn !== sender && conn.readyState === WebSocket.OPEN) {
      conn.send(message);
    }
  });
}

/**
 * Load room state from persistence
 */
async function loadRoomState(roomName: string, doc: Y.Doc) {
  try {
    const fs = await import("fs/promises");
    const path = await import("path");
    const filePath = path.join(PERSISTENCE_DIR, `${roomName}.yjs`);

    const data = await fs.readFile(filePath);
    Y.applyUpdate(doc, new Uint8Array(data));
    console.log(`Loaded state for room: ${roomName}`);
  } catch (err) {
    // File doesn't exist or error reading - that's OK
  }
}

/**
 * Save room state to persistence
 */
async function saveRoomState(roomName: string, update: Uint8Array) {
  try {
    const fs = await import("fs/promises");
    const path = await import("path");

    await fs.mkdir(PERSISTENCE_DIR, { recursive: true });
    const filePath = path.join(PERSISTENCE_DIR, `${roomName}.yjs`);
    await fs.writeFile(filePath, update);
  } catch (err) {
    console.error("Error saving room state:", err);
  }
}

/**
 * Setup Redis for horizontal scaling
 */
async function setupRedis() {
  if (!USE_REDIS) return;

  try {
    // Publisher client
    redisClient = createClient({ url: REDIS_URL });
    await redisClient.connect();

    // Subscriber client
    redisSubscriber = createClient({ url: REDIS_URL });
    await redisSubscriber.connect();

    // Subscribe to all room updates
    await redisSubscriber.pSubscribe("yjs:*:update", (message, channel) => {
      const roomName = channel.split(":")[1];
      const room = rooms.get(roomName);

      if (room) {
        const update = Buffer.from(message, "base64");
        // Apply update without re-broadcasting to Redis
        Y.applyUpdate(room.doc, new Uint8Array(update), "redis");
      }
    });

    console.log("Redis connection established for horizontal scaling");
  } catch (err) {
    console.error("Redis connection failed:", err);
    console.warn("Running without Redis - single instance only");
  }
}

/**
 * Create HTTP server for health checks
 */
const server = http.createServer((req, res) => {
  const url = new URL(req.url || "", `http://${req.headers.host}`);

  // CORS headers
  const origin = req.headers.origin || "";
  if (ALLOWED_ORIGINS.includes(origin) || ALLOWED_ORIGINS.includes("*")) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  }

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  // Health check endpoint
  if (url.pathname === "/health") {
    const stats = {
      status: "ok",
      rooms: rooms.size,
      connections: Array.from(rooms.values()).reduce(
        (sum, room) => sum + room.connections.size,
        0
      ),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString(),
    };

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(stats, null, 2));
    return;
  }

  // Metrics endpoint (Prometheus format)
  if (url.pathname === "/metrics") {
    const metrics = [
      `# HELP yjs_rooms_total Total number of active rooms`,
      `# TYPE yjs_rooms_total gauge`,
      `yjs_rooms_total ${rooms.size}`,
      ``,
      `# HELP yjs_connections_total Total number of active connections`,
      `# TYPE yjs_connections_total gauge`,
      `yjs_connections_total ${Array.from(rooms.values()).reduce(
        (sum, room) => sum + room.connections.size,
        0
      )}`,
      ``,
      `# HELP yjs_memory_bytes Memory usage in bytes`,
      `# TYPE yjs_memory_bytes gauge`,
      `yjs_memory_bytes ${process.memoryUsage().heapUsed}`,
    ].join("\n");

    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end(metrics);
    return;
  }

  res.writeHead(404);
  res.end("Not Found");
});

/**
 * Create WebSocket server
 */
const wss = new WebSocketServer({
  server,
  path: "/sync",
});

wss.on("connection", handleConnection);

/**
 * Graceful shutdown
 */
async function shutdown() {
  console.log("Shutting down gracefully...");

  // Close all WebSocket connections
  wss.clients.forEach((client) => {
    client.close(1000, "Server shutting down");
  });

  // Save all room states
  if (PERSISTENCE_ENABLED) {
    for (const [roomName, room] of rooms) {
      await saveRoomState(roomName, Y.encodeStateAsUpdate(room.doc));
    }
  }

  // Close Redis connections
  if (redisClient) await redisClient.quit();
  if (redisSubscriber) await redisSubscriber.quit();

  // Close HTTP server
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });

  // Force exit after 10 seconds
  setTimeout(() => {
    console.error("Forced shutdown");
    process.exit(1);
  }, 10000);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

/**
 * Start server
 */
async function start() {
  await setupRedis();

  server.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════╗
║  Vue Notes Sync Server                             ║
║                                                    ║
║  WebSocket: ws://localhost:${PORT}/sync              ║
║  Health:    http://localhost:${PORT}/health          ║
║  Metrics:   http://localhost:${PORT}/metrics         ║
║                                                    ║
║  Redis:     ${
      USE_REDIS ? "Enabled" : "Disabled"
    }                               ║
║  Persist:   ${
      PERSISTENCE_ENABLED ? "Enabled" : "Disabled"
    }                               ║
╚════════════════════════════════════════════════════╝
    `);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
