<!--
  Vue Notes - WhatsApp-inspired Note Taking
  Quick like Google Keep, Deep like Notion, Familiar like WhatsApp
-->
<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { storeToRefs } from "pinia";
import { useI18n } from "vue-i18n";
import { useHead } from "@unhead/vue";

// Components
import NoteShell from "./components/NoteShell.vue";
import ServerSelector from "./components/ServerSelector.vue";

// Stores
import { useSettingsStore } from "./stores/settings";
import { useNotesStore } from "./stores/notes";

// Core
import { initializeModules } from "./core/initModules";

// === Setup ===
const { t } = useI18n();
const settings = useSettingsStore();
const notes = useNotesStore();

const { syncEnabled } = storeToRefs(settings);

const showServerSelector = ref(false);
const modulesReady = ref(false);
const loadError = ref<string | null>(null);

// === Meta ===
useHead(() => ({
  title: t("appName") || "Notes",
  meta: [
    {
      name: "theme-color",
      content: settings.isDarkMode ? "#0B141A" : "#ECE5DD",
    },
  ],
}));

// === Lifecycle ===
onMounted(async () => {
  // Show server selector on first run
  if (!settings.syncEnabled && settings.servers.length === 0) {
    showServerSelector.value = true;
  }

  // Initialize all note modules
  try {
    await initializeModules();
    modulesReady.value = true;
  } catch (err) {
    loadError.value = err instanceof Error ? err.message : "Failed to load";
    console.error("Module init failed:", err);
    // Still show the app
    modulesReady.value = true;
  }
});

// === Handlers ===
function handleServerConnected() {
  showServerSelector.value = false;
}

function handleOfflineMode() {
  showServerSelector.value = false;
  settings.syncEnabled = false;
}

function openServerSelector() {
  showServerSelector.value = true;
}
</script>

<template>
  <div class="h-screen w-screen overflow-hidden bg-bg-primary dark:bg-dark-bg-primary">
    <!-- Loading Screen -->
    <div
      v-if="!modulesReady"
      class="flex items-center justify-center h-full"
    >
      <div class="text-center space-y-6 px-4 animate-slide-up-fade">
        <div class="text-8xl animate-pulse">💬</div>
        <div class="space-y-2">
          <h1 class="text-2xl font-black uppercase tracking-wider">
            Loading Notes
          </h1>
          <p class="text-sm opacity-60 font-bold">
            Preparing your workspace...
          </p>
        </div>
      </div>
    </div>

    <!-- Main App Shell -->
    <NoteShell
      v-else
      @open-server-selector="openServerSelector"
    />

    <!-- Server Selector Modal -->
    <Teleport to="body">
      <ServerSelector
        v-model="showServerSelector"
        @connected="handleServerConnected"
        @offline="handleOfflineMode"
      />
    </Teleport>

    <!-- Error Toast (if load failed but still showing app) -->
    <div
      v-if="loadError"
      class="fixed bottom-4 right-4 z-100 max-w-sm p-4 bg-semantic-error text-white border-3 border-base-black shadow-hard-xl rounded-lg"
    >
      <p class="text-sm font-bold">⚠️ {{ loadError }}</p>
    </div>
  </div>
</template>
