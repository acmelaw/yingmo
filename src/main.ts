import "@unocss/reset/tailwind.css";
import "uno.css";
import "./design-tokens.css";
import "./style.css";
import "quasar/src/css/index.sass";
import "@quasar/extras/material-icons/material-icons.css";

import { createApp, watch } from "vue";
import { createPinia } from "pinia";
import { createI18n } from "vue-i18n";
import { createHead } from "@unhead/vue";
import { Quasar, Dialog, Notify, Loading, LoadingBar } from "quasar";

import App from "./App.vue";
import { useSettingsStore } from "./stores/settings";

// Initialize modules
import "./core/initModules";

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
    hashtag: "Add Tag",
    openComposer: "Open composer",
    closeComposer: "Hide composer",
    insertCheck: "Add check",
    send: "Send",
    edit: "Edit",
    edited: "Edited",
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
    justNow: "Just now",
    syncDisabled: "Sync disabled",
    syncAwaitingAuth: "Awaiting authentication",
    syncInProgress: "Syncing…",
    syncError: "Error",
    lastSynced: "Last synced",
    syncReady: "Ready to sync",
    syncDescription: "Connect to your sync server for collaboration and backup",
    changeServer: "Change Server",
    connectServer: "Connect to Server",
    noServerConnected: "No server connected",
    syncing: "Syncing…",
    syncNow: "Sync Now",
    retry: "Retry",
    done: "Done",
  },
};

const i18n = createI18n({
  legacy: false,
  locale: "en",
  messages,
});

const pinia = createPinia();

const app = createApp(App);

app.use(pinia);
app.use(createHead());
app.use(i18n);
app.use(Quasar, {
  plugins: {
    Dialog,
    Notify,
    Loading,
    LoadingBar,
  },
});

app.mount("#app");

// Setup theme system
const settingsStore = useSettingsStore(pinia);

// Apply initial theme
if (settingsStore.isDarkMode) {
  document.documentElement.classList.add("dark");
} else {
  document.documentElement.classList.remove("dark");
}

// Watch for theme changes
watch(
  () => settingsStore.isDarkMode,
  (isDark) => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }
);
