import { computed } from "vue";
import { useStorage, usePreferredDark } from "@vueuse/core";
import { acceptHMRUpdate, defineStore } from "pinia";

export interface Settings {
  theme: "light" | "dark" | "auto";
  fontSize: "small" | "medium" | "large";
  language: string;
  autoSave: boolean;
  showTimestamps: boolean;
  compactMode: boolean;
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
  });

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

  function reset() {
    settings.value = {
      theme: "auto",
      fontSize: "medium",
      language: "en",
      autoSave: true,
      showTimestamps: true,
      compactMode: false,
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
    reset,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useSettingsStore, import.meta.hot));
}
