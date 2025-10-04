import "@unocss/reset/tailwind.css";
import "@quasar/extras/material-icons/material-icons.css";
import "quasar/src/css/index.sass";
import "uno.css";
import "./style.css";

import { createApp, watch } from "vue";
import { createPinia } from "pinia";
import { createI18n } from "vue-i18n";
import { createHead } from "@unhead/vue";
import { Quasar } from "quasar";

import App from "./App.vue";
import { useSettingsStore } from "./stores/settings";

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

const pinia = createPinia();

const app = createApp(App);

app.use(pinia);
app.use(createHead());
app.use(i18n);
app.use(Quasar, {
  config: {
    dark: false,
  },
});

app.mount("#app");

const settingsStore = useSettingsStore(pinia);
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
