import { ref, onMounted, onUnmounted, readonly, Ref, watch } from "vue";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { IndexeddbPersistence } from "y-indexeddb";

export type SyncMode = 'offline' | 'websocket' | 'auto';

export interface CollaborationConfig {
  roomId: string;
  serverUrl?: string;
  enablePersistence?: boolean;
  username?: string;
  userColor?: string;
  mode?: SyncMode; // 'offline', 'websocket', or 'auto' (graceful degradation)
  autoReconnect?: boolean;
  reconnectInterval?: number;
}

export interface CollaborationState {
  isConnected: Ref<boolean>;
  isSynced: Ref<boolean>;
  isOnline: Ref<boolean>;
  activeUsers: Ref<number>;
  error: Ref<string | null>;
  mode: Ref<SyncMode>;
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
    serverUrl = import.meta.env.VITE_COLLAB_SERVER || "ws://localhost:4444",
    enablePersistence = true,
    username = "Anonymous",
    userColor = generateRandomColor(),
    mode = (import.meta.env.VITE_SYNC_MODE as SyncMode) || 'auto',
    autoReconnect = true,
    reconnectInterval = 5000,
  } = config;

  // Create Yjs document
  const doc = new Y.Doc();

  // State
  const isConnected = ref(false);
  const isSynced = ref(false);
  const isOnline = ref(navigator.onLine);
  const activeUsers = ref(0);
  const error = ref<string | null>(null);
  const currentMode = ref<SyncMode>(mode);

  // Providers
  let wsProvider: WebsocketProvider | null = null;
  let indexeddbProvider: IndexeddbPersistence | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  function setupWebSocketProvider() {
    // Skip WebSocket in offline mode
    if (currentMode.value === 'offline') {
      console.log('Running in offline-only mode');
      return;
    }

    // Check if server is available (in auto mode)
    if (currentMode.value === 'auto' && !isOnline.value) {
      console.log('Browser is offline, skipping WebSocket setup');
      return;
    }

    try {
      // Remove /api prefix - sync-server expects /sync directly
      const wsUrl = serverUrl.replace(/\/$/, ''); // Remove trailing slash
      const wsPath = `/sync?room=${roomId}`;
      const fullUrl = `${wsUrl}${wsPath}`;

      console.log(`Connecting to sync server: ${fullUrl}`);

      wsProvider = new WebsocketProvider(fullUrl, roomId, doc, {
        params: {
          username,
          color: userColor,
        },
        // Disable auto-reconnect if we're handling it manually
        connect: autoReconnect,
      });

      // Connection events
      wsProvider.on("status", (event: { status: string }) => {
        const wasConnected = isConnected.value;
        isConnected.value = event.status === "connected";
        
        if (event.status === "connected") {
          error.value = null;
          currentMode.value = 'websocket';
          console.log(`✅ Connected to sync server (room: ${roomId})`);
          
          // Clear reconnection timer on successful connect
          if (reconnectTimer) {
            clearTimeout(reconnectTimer);
            reconnectTimer = null;
          }
        } else if (event.status === "disconnected") {
          console.log(`❌ Disconnected from sync server`);
          
          // Gracefully degrade to offline mode
          if (currentMode.value === 'auto') {
            currentMode.value = 'offline';
            console.log('📴 Falling back to offline mode');
          }
          
          // Attempt reconnection if enabled
          if (autoReconnect && !wasConnected && isOnline.value) {
            scheduleReconnect();
          }
        }
      });

      wsProvider.on("sync", (synced: boolean) => {
        isSynced.value = synced;
        if (synced) {
          console.log(`🔄 Synced with server (room: ${roomId})`);
        }
      });

      // Track active users
      if (wsProvider.awareness) {
        wsProvider.awareness.on("change", () => {
          activeUsers.value = wsProvider?.awareness?.getStates().size || 0;
        });
      }

      // Error handling with graceful degradation
      wsProvider.on("connection-error", (err: Error) => {
        error.value = err.message;
        console.error("WebSocket connection error:", err);
        
        // Degrade to offline in auto mode
        if (currentMode.value === 'auto') {
          currentMode.value = 'offline';
          console.log('📴 Server unavailable, operating in offline mode');
        }
        
        // Schedule reconnection
        if (autoReconnect) {
          scheduleReconnect();
        }
      });

      wsProvider.on("connection-close", (event: CloseEvent) => {
        console.log('WebSocket closed:', event.code, event.reason);
        
        // Normal closure
        if (event.code === 1000) return;
        
        // Abnormal closure - try to reconnect
        if (autoReconnect && isOnline.value) {
          scheduleReconnect();
        }
      });

    } catch (err) {
      error.value = err instanceof Error ? err.message : "Unknown error";
      console.error("Failed to setup WebSocket provider:", err);
      
      // Degrade to offline mode on error
      if (currentMode.value === 'auto') {
        currentMode.value = 'offline';
        console.log('📴 Falling back to offline mode due to error');
      }
    }
  }

  function scheduleReconnect() {
    if (reconnectTimer) return; // Already scheduled
    
    console.log(`⏰ Scheduling reconnection in ${reconnectInterval}ms...`);
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      if (isOnline.value) {
        console.log('🔄 Attempting to reconnect...');
        setupWebSocketProvider();
      }
    }, reconnectInterval);
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
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    wsProvider?.destroy();
    indexeddbProvider?.destroy();
    doc.destroy();
  }

  function reconnect() {
    if (currentMode.value === 'offline') {
      console.log('Cannot reconnect in offline-only mode');
      return;
    }
    
    console.log('Manual reconnection requested...');
    wsProvider?.disconnect();
    wsProvider?.destroy();
    wsProvider = null;
    setupWebSocketProvider();
  }

  function switchToOfflineMode() {
    console.log('Switching to offline mode...');
    currentMode.value = 'offline';
    wsProvider?.disconnect();
  }

  function switchToOnlineMode() {
    if (!isOnline.value) {
      console.log('Cannot switch to online mode - browser is offline');
      return;
    }
    
    console.log('Switching to online mode...');
    currentMode.value = 'auto';
    setupWebSocketProvider();
  }

  // Monitor browser online/offline status
  function handleOnline() {
    console.log('🌐 Browser is online');
    isOnline.value = true;
    
    // Try to reconnect if in auto mode
    if (currentMode.value === 'auto' && !isConnected.value) {
      setupWebSocketProvider();
    }
  }

  function handleOffline() {
    console.log('📴 Browser is offline');
    isOnline.value = false;
    
    // Gracefully degrade to offline mode
    if (currentMode.value === 'auto') {
      currentMode.value = 'offline';
    }
  }

  onMounted(() => {
    // Always setup IndexedDB for offline persistence
    setupIndexedDBProvider();
    
    // Setup WebSocket if not in offline-only mode
    if (currentMode.value !== 'offline') {
      setupWebSocketProvider();
    } else {
      console.log('🔒 Running in offline-only mode - no server connection');
    }

    // Listen for browser online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Watch for mode changes
    watch(currentMode, (newMode, oldMode) => {
      console.log(`Mode changed: ${oldMode} → ${newMode}`);
    });
  });

  onUnmounted(() => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
    destroy();
  });

  return {
    doc,
    provider: readonly(wsProvider),
    indexeddbProvider: readonly(indexeddbProvider),
    state: {
      isConnected: readonly(isConnected),
      isSynced: readonly(isSynced),
      isOnline: readonly(isOnline),
      activeUsers: readonly(activeUsers),
      error: readonly(error),
      mode: readonly(currentMode),
    },
    // Control methods
    reconnect,
    switchToOfflineMode,
    switchToOnlineMode,
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
export function getSharedType<T = any>(
  doc: Y.Doc,
  key: string,
  type: "map" | "array" | "text" = "map"
): T {
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
