import { ref, onMounted, onUnmounted, readonly, Ref } from "vue";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { IndexeddbPersistence } from "y-indexeddb";

export interface CollaborationConfig {
  roomId: string;
  serverUrl?: string;
  enablePersistence?: boolean;
  username?: string;
  userColor?: string;
}

export interface CollaborationState {
  isConnected: Ref<boolean>;
  isSynced: Ref<boolean>;
  activeUsers: Ref<number>;
  error: Ref<string | null>;
}

/**
 * Composable for Yjs collaboration
 * 
 * Usage:
 * const { doc, provider, state } = useCollaboration({
 *   roomId: 'note-123',
 *   serverUrl: 'ws://localhost:8000'
 * })
 */
export function useCollaboration(config: CollaborationConfig) {
  const {
    roomId,
    serverUrl = import.meta.env.VITE_COLLAB_SERVER || "ws://localhost:8000",
    enablePersistence = true,
    username = "Anonymous",
    userColor = generateRandomColor(),
  } = config;

  // Create Yjs document
  const doc = new Y.Doc();
  
  // State
  const isConnected = ref(false);
  const isSynced = ref(false);
  const activeUsers = ref(0);
  const error = ref<string | null>(null);

  // Providers
  let wsProvider: WebsocketProvider | null = null;
  let indexeddbProvider: IndexeddbPersistence | null = null;

  function setupWebSocketProvider() {
    try {
      const wsUrl = `${serverUrl}/api/sync/${roomId}`;
      
      wsProvider = new WebsocketProvider(wsUrl, roomId, doc, {
        params: {
          username,
          color: userColor,
        },
      });

      // Connection events
      wsProvider.on("status", (event: { status: string }) => {
        isConnected.value = event.status === "connected";
        if (event.status === "connected") {
          error.value = null;
        }
      });

      wsProvider.on("sync", (synced: boolean) => {
        isSynced.value = synced;
      });

      // Track active users
      if (wsProvider.awareness) {
        wsProvider.awareness.on("change", () => {
          activeUsers.value = wsProvider?.awareness?.getStates().size || 0;
        });
      }

      // Error handling
      wsProvider.on("connection-error", (err: Error) => {
        error.value = err.message;
        console.error("WebSocket connection error:", err);
      });

    } catch (err) {
      error.value = err instanceof Error ? err.message : "Unknown error";
      console.error("Failed to setup WebSocket provider:", err);
    }
  }

  function setupIndexedDBProvider() {
    if (!enablePersistence) return;

    try {
      indexeddbProvider = new IndexeddbPersistence(roomId, doc);

      indexeddbProvider.on("synced", () => {
        console.log(`Local persistence synced for room: ${roomId}`);
      });
    } catch (err) {
      console.error("Failed to setup IndexedDB provider:", err);
    }
  }

  function destroy() {
    wsProvider?.destroy();
    indexeddbProvider?.destroy();
    doc.destroy();
  }

  onMounted(() => {
    setupIndexedDBProvider();
    setupWebSocketProvider();
  });

  onUnmounted(() => {
    destroy();
  });

  return {
    doc,
    provider: readonly(wsProvider),
    indexeddbProvider: readonly(indexeddbProvider),
    state: {
      isConnected: readonly(isConnected),
      isSynced: readonly(isSynced),
      activeUsers: readonly(activeUsers),
      error: readonly(error),
    },
    destroy,
  };
}

/**
 * Generate random color for user cursor
 */
function generateRandomColor(): string {
  const colors = [
    "#ff6b6b",
    "#4ecdc4",
    "#45b7d1",
    "#f9ca24",
    "#6c5ce7",
    "#a29bfe",
    "#fd79a8",
    "#fdcb6e",
    "#00b894",
    "#e17055",
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Helper to get shared type from Yjs document
 */
export function getSharedType<T = any>(doc: Y.Doc, key: string, type: "map" | "array" | "text" = "map"): T {
  switch (type) {
    case "map":
      return doc.getMap(key) as T;
    case "array":
      return doc.getArray(key) as T;
    case "text":
      return doc.getText(key) as T;
    default:
      return doc.getMap(key) as T;
  }
}
