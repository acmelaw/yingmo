import "@unocss/reset/tailwind.css";
import "uno.css";
import "./style.css";

import { createApp } from "vue";
import { createPinia } from "pinia";
import { createI18n } from "vue-i18n";
import { createHead } from "@unhead/vue";

import App from "./App.vue";

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

const app = createApp(App);

app.use(createPinia());
app.use(createHead());
app.use(i18n);

app.mount("#app");
