/**
 * Server Connection Manager
 * Handles backend server discovery, connection, and health checking
 * Similar to Jellyfin's server selection system
 */

import { ref, computed, watch } from "vue";
import { useSettingsStore } from "@/stores/settings";
import type { ServerConfig } from "@/stores/settings";

export interface ServerHealth {
  status: "ok" | "error";
  service: string;
  version: string;
  activeRooms: number;
  registeredModules: Array<{
    id: string;
    name: string;
    version: string;
    supportedTypes: string[];
  }>;
  registeredTypes: string[];
  timestamp: string;
}

export interface ConnectionState {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  server?: ServerConfig;
  health?: ServerHealth;
}

export function useServerConnection() {
  const settings = useSettingsStore();
  
  const state = ref<ConnectionState>({
    connected: false,
    connecting: false,
    error: null,
  });

  const currentServerConfig = computed(() => {
    if (!settings.currentServer) return null;
    return settings.servers.find((s) => s.url === settings.currentServer) || null;
  });

  /**
   * Test server connection and get health info
   */
  async function testServer(url: string): Promise<ServerHealth> {
    const healthUrl = url.replace(/\/$/, "") + "/health";
    
    const response = await fetch(healthUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}: ${response.statusText}`);
    }

    const health = await response.json();
    return health as ServerHealth;
  }

  /**
   * Connect to a server
   */
  async function connect(url: string, name?: string): Promise<boolean> {
    state.value.connecting = true;
    state.value.error = null;

    try {
      // Test the connection
      const health = await testServer(url);

      // Save server configuration
      const serverConfig: ServerConfig = {
        url,
        name: name || health.service || "Vue Notes Server",
        lastConnected: Date.now(),
      };

      settings.addServer(serverConfig);
      settings.setCurrentServer(url);
      settings.syncEnabled = true;

      state.value.connected = true;
      state.value.server = serverConfig;
      state.value.health = health;
      state.value.error = null;

      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to connect to server";
      state.value.error = errorMessage;
      state.value.connected = false;
      return false;
    } finally {
      state.value.connecting = false;
    }
  }

  /**
   * Disconnect from current server
   */
  function disconnect() {
    settings.syncEnabled = false;
    settings.currentServer = undefined;
    state.value.connected = false;
    state.value.server = undefined;
    state.value.health = undefined;
    state.value.error = null;
  }

  /**
   * Reconnect to current server
   */
  async function reconnect(): Promise<boolean> {
    if (!settings.currentServer) return false;
    return connect(settings.currentServer);
  }

  /**
   * Remove a saved server
   */
  function removeServer(url: string) {
    if (settings.currentServer === url) {
      disconnect();
    }
    settings.removeServer(url);
  }

  /**
   * Auto-detect server on local network
   */
  async function autoDiscover(): Promise<ServerConfig[]> {
    const commonPorts = [4444, 8080, 3000, 4000];
    const commonHosts = ["localhost", "127.0.0.1"];
    const protocols = ["http", "https"];

    const discovered: ServerConfig[] = [];

    for (const protocol of protocols) {
      for (const host of commonHosts) {
        for (const port of commonPorts) {
          const url = `${protocol}://${host}:${port}`;
          try {
            const health = await testServer(url);
            discovered.push({
              url,
              name: health.service || "Discovered Server",
              lastConnected: 0,
            });
          } catch {
            // Server not found at this address
          }
        }
      }
    }

    return discovered;
  }

  /**
   * Refresh health status
   */
  async function refreshHealth(): Promise<void> {
    if (!settings.currentServer) return;

    try {
      const health = await testServer(settings.currentServer);
      state.value.health = health;
      state.value.connected = true;
      state.value.error = null;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Health check failed";
      state.value.error = errorMessage;
      state.value.connected = false;
    }
  }

  // Auto-connect to last server on mount
  if (settings.syncEnabled && settings.currentServer && !state.value.connected) {
    reconnect().catch((err) => {
      console.warn("Auto-reconnect failed:", err);
    });
  }

  // Watch for sync enabled changes
  watch(
    () => settings.syncEnabled,
    (enabled) => {
      if (!enabled && state.value.connected) {
        disconnect();
      } else if (enabled && !state.value.connected && settings.currentServer) {
        reconnect().catch((err) => {
          console.warn("Reconnect failed:", err);
        });
      }
    }
  );

  return {
    state: computed(() => state.value),
    currentServerConfig,
    savedServers: computed(() => settings.servers),
    connect,
    disconnect,
    reconnect,
    removeServer,
    autoDiscover,
    refreshHealth,
  };
}
