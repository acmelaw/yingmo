import "@unocss/reset/tailwind.css";
import "uno.css";
import "./style.css";

import { createApp } from "vue";
import { createPinia } from "pinia";
import { createI18n } from "vue-i18n";
import { createHead } from "@unhead/vue";

import App from "./App.vue";

// Register service worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("SW registered:", registration);
      })
      .catch((error) => {
        console.log("SW registration failed:", error);
      });
  });
}

const messages = {
  en: {
    appName: "Vue Notes",
    placeholder: "Write a note…",
    empty: "No notes yet. Start typing to add your first note.",
    writing: "Typing…",
    delete: "Delete",
    confirmDelete: "Delete this note?",
    cancel: "Cancel",
    emoji: "Emoji",
    openComposer: "Open composer",
    closeComposer: "Hide composer",
    insertCheck: "Add check",
    send: "Send",
    edit: "Edit",
    save: "Save",
    search: "Search notes…",
    category: "Category",
    tags: "Tags",
    settings: "Settings",
    export: "Export",
    import: "Import",
    exportJSON: "Export as JSON",
    exportText: "Export as Text",
    importData: "Import Data",
    theme: "Theme",
    light: "Light",
    dark: "Dark",
    auto: "Auto",
    fontSize: "Font Size",
    small: "Small",
    medium: "Medium",
    large: "Large",
    archive: "Archive",
    unarchive: "Unarchive",
    archived: "Archived",
    allNotes: "All Notes",
    clearAll: "Clear All",
    confirmClearAll: "Are you sure you want to delete all notes?",
  },
};

const i18n = createI18n({
  legacy: false,
  locale: "en",
  messages,
});

const app = createApp(App);

app.use(createPinia());
app.use(createHead());
app.use(i18n);

app.mount("#app");

// Apply dark mode class to document
import { watch } from "vue";
import { useSettingsStore } from "./stores/settings";

const settingsStore = useSettingsStore();
watch(
  () => settingsStore.isDarkMode,
  (isDark) => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  },
  { immediate: true }
);
