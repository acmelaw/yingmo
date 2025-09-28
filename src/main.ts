import { createApp } from "vue";
import { createPinia } from "pinia";
import { createI18n } from "vue-i18n";
import App from "./App.vue";
import "./style.css";

const messages = {
  en: {
    appName: "ChatApp",
    placeholder: "Write a note…",
    empty: "No notes yet. Start typing to add your first note.",
    writing: "Typing…",
    delete: "Delete",
    confirmDelete: "Delete this note?",
    cancel: "Cancel",
  },
};

const i18n = createI18n({
  legacy: false,
  locale: "en",
  messages,
});

createApp(App).use(createPinia()).use(i18n).mount("#app");
