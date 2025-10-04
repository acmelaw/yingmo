import { computed } from "vue";
import { useStorage, usePreferredDark } from "@vueuse/core";
import { acceptHMRUpdate, defineStore } from "pinia";

export interface ServerConfig {
  url: string;
  name: string;
  lastConnected?: number;
}

export interface Settings {
  theme: "light" | "dark" | "auto";
  fontSize: "small" | "medium" | "large";
  language: string;
  autoSave: boolean;
  showTimestamps: boolean;
  compactMode: boolean;
  // Server connection settings
  syncEnabled: boolean;
  currentServer?: string; // URL of current server
  servers: ServerConfig[]; // List of known servers
}

const STORAGE_KEY = "vue-notes.settings";

export const useSettingsStore = defineStore("settings", () => {
  const prefersDark = usePreferredDark();

  const settings = useStorage<Settings>(STORAGE_KEY, {
    theme: "auto",
    fontSize: "medium",
    language: "en",
    autoSave: true,
    showTimestamps: true,
    compactMode: false,
    syncEnabled: false,
    currentServer: undefined,
    servers: [],
  });

  // Ensure servers array exists (migration for old data)
  if (!settings.value.servers) {
    settings.value.servers = [];
  }
  if (settings.value.syncEnabled === undefined) {
    settings.value.syncEnabled = false;
  }

  const isDarkMode = computed(() => {
    if (settings.value.theme === "auto") {
      return prefersDark.value;
    }
    return settings.value.theme === "dark";
  });

  const theme = computed({
    get: () => settings.value.theme,
    set: (value: "light" | "dark" | "auto") => {
      settings.value.theme = value;
    },
  });

  const fontSize = computed({
    get: () => settings.value.fontSize,
    set: (value: "small" | "medium" | "large") => {
      settings.value.fontSize = value;
    },
  });

  const language = computed({
    get: () => settings.value.language,
    set: (value: string) => {
      settings.value.language = value;
    },
  });

  const autoSave = computed({
    get: () => settings.value.autoSave,
    set: (value: boolean) => {
      settings.value.autoSave = value;
    },
  });

  const showTimestamps = computed({
    get: () => settings.value.showTimestamps,
    set: (value: boolean) => {
      settings.value.showTimestamps = value;
    },
  });

  const compactMode = computed({
    get: () => settings.value.compactMode,
    set: (value: boolean) => {
      settings.value.compactMode = value;
    },
  });

  const syncEnabled = computed({
    get: () => settings.value.syncEnabled,
    set: (value: boolean) => {
      settings.value.syncEnabled = value;
    },
  });

  const currentServer = computed({
    get: () => settings.value.currentServer,
    set: (value: string | undefined) => {
      settings.value.currentServer = value;
    },
  });

  const servers = computed(() => settings.value?.servers || []);

  function addServer(server: ServerConfig) {
    // Ensure servers array exists
    if (!settings.value.servers) {
      settings.value.servers = [];
    }

    const existing = settings.value.servers.findIndex(
      (s) => s.url === server.url
    );
    if (existing >= 0) {
      settings.value.servers[existing] = server;
    } else {
      settings.value.servers.push(server);
    }
  }

  function removeServer(url: string) {
    // Ensure servers array exists
    if (!settings.value.servers) {
      settings.value.servers = [];
      return;
    }

    settings.value.servers = settings.value.servers.filter(
      (s) => s.url !== url
    );
    if (settings.value.currentServer === url) {
      settings.value.currentServer = undefined;
    }
  }

  function setCurrentServer(url: string) {
    // Ensure servers array exists
    if (!settings.value.servers) {
      settings.value.servers = [];
      return;
    }

    const server = settings.value.servers.find((s) => s.url === url);
    if (server) {
      server.lastConnected = Date.now();
      settings.value.currentServer = url;
    }
  }

  function reset() {
    settings.value = {
      theme: "auto",
      fontSize: "medium",
      language: "en",
      autoSave: true,
      showTimestamps: true,
      compactMode: false,
      syncEnabled: false,
      currentServer: undefined,
      servers: [],
    };
  }

  return {
    settings,
    isDarkMode,
    theme,
    fontSize,
    language,
    autoSave,
    showTimestamps,
    compactMode,
    syncEnabled,
    currentServer,
    servers,
    addServer,
    removeServer,
    setCurrentServer,
    reset,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useSettingsStore, import.meta.hot));
}
