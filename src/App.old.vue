<script setup lang="ts">
import { computed, onMounted, ref, watchEffect } from "vue";
import { storeToRefs } from "pinia";
import { useI18n } from "vue-i18n";
import { useHead } from "@unhead/vue";

import BladeLayout from "./layouts/BladeLayout.vue";
import RoomSidebar from "./widgets/RoomSidebar.vue";
import NoteStream from "./widgets/NoteStream.vue";
import NoteTypeTransformDialog from "./components/NoteTypeTransformDialog.vue";
import ServerSelector from "./components/ServerSelector.vue";
import { Button } from "./components/ui";

import type { UseNotesFilters } from "./composables/useNotes";
import type { NoteType } from "./types/note";
import { moduleRegistry } from "./core/ModuleRegistry";
import { initializeModules } from "./core/initModules";
import { useSettingsStore } from "./stores/settings";
import { useNotesStore } from "./stores/notes";

// === Stores & Composables ===
const settings = useSettingsStore();
const notesStore = useNotesStore();
const { t } = useI18n();

const { syncing, shouldSync, hasRemoteSession, syncError, lastSyncedAt, notes } =
  storeToRefs(notesStore);
const { syncEnabled, currentServer } = storeToRefs(settings);

// === Local State ===
const showServerSelector = ref(false);
const modulesInitialized = ref(false);
const initError = ref<string | null>(null);
const showTransformDialog = ref(false);
const transformingNoteId = ref<string | null>(null);
const activeFilters = ref<UseNotesFilters>({});
const searchQuery = ref("");
const activeRoomId = ref("inbox");

// === Computed ===
const appTitle = computed(() => t("appName") || "Notes");

const syncStatus = computed(() => {
  if (!syncEnabled.value) return { text: "Offline", icon: "○", variant: "muted" };
  if (!hasRemoteSession.value) return { text: "Disconnected", icon: "○", variant: "warning" };
  if (syncing.value) return { text: "Syncing...", icon: "⏳", variant: "info" };
  if (syncError.value) return { text: "Error", icon: "⚠️", variant: "error" };
  if (lastSyncedAt.value) {
    const minutes = Math.max(1, Math.round((Date.now() - lastSyncedAt.value) / 60000));
    return { text: `${minutes}m ago`, icon: "✓", variant: "success" };
  }
  return { text: "Ready", icon: "✓", variant: "success" };
});

const transformingNote = computed(() =>
  notes.value.find((note) => note.id === transformingNoteId.value) ?? null
);

const availableNoteTypes = computed<NoteType[]>(() => {
  const modules = moduleRegistry.getAllModules();
  const types = new Set<NoteType>();

  modules
    .filter((m) => m.capabilities?.canCreate)
    .forEach((m) => m.supportedTypes.forEach((type) => types.add(type)));

  modules
    .filter((m) => m.capabilities?.canTransform && m.supportedTypes.length === 0)
    .forEach((m) => types.add(m.id as NoteType));

  const result = Array.from(types);
  return result.length > 0 ? result : ["text"];
});

// === Head Management ===
useHead(() => ({
  title: appTitle.value,
  meta: [
    {
      name: "theme-color",
      content: settings.isDarkMode ? "#0B141A" : "#ECE5DD",
    },
  ],
}));

// === Lifecycle ===
onMounted(async () => {
  // Check if server selector should be shown
  if (!settings.syncEnabled && settings.servers.length === 0) {
    showServerSelector.value = true;
  }

  // Initialize modules
  try {
    await initializeModules();
  } catch (error) {
    console.error("Failed to initialize modules:", error);
    initError.value = error instanceof Error ? error.message : "Unknown error";
  } finally {
    modulesInitialized.value = true;
  }
});

// === Event Handlers ===
function openServerSelector() {
  showServerSelector.value = true;
}

function handleConnected() {
  showServerSelector.value = false;
  console.log("Connected to server");
}

function handleOffline() {
  showServerSelector.value = false;
  settings.syncEnabled = false;
  console.log("Continuing in offline mode");
}

async function handleManualSync() {
  if (!shouldSync.value || syncing.value) return;
  
  try {
    await notesStore.syncFromServer();
    if (typeof notesStore.syncPendingNotes === "function") {
      await notesStore.syncPendingNotes();
    }
  } catch (error) {
    console.error("Manual sync failed:", error);
  }
}

function handleSelectRoom(payload: { id: string; filters: UseNotesFilters }) {
  activeFilters.value = { ...payload.filters };
  activeRoomId.value = payload.id;
}

function handleSearch(query: string) {
  searchQuery.value = query;
}

function handleRequestTransform(noteId: string) {
  transformingNoteId.value = noteId;
  showTransformDialog.value = true;
}

function closeTransformDialog() {
  showTransformDialog.value = false;
  transformingNoteId.value = null;
}

async function handleTransform(toType: NoteType | string) {
  if (!transformingNoteId.value) return;
  const note = transformingNote.value;
  if (!note) return;

  try {
    await notesStore.update(transformingNoteId.value, {
      viewAs: toType === note.type ? undefined : (toType as any),
    });
  } catch (error) {
    console.error("Failed to transform note:", error);
  } finally {
    closeTransformDialog();
  }
}

</script>

<template>
  <div class="h-screen w-screen overflow-hidden bg-bg-primary dark:bg-dark-bg-primary">
    <!-- Loading State -->
    <div
      v-if="!modulesInitialized"
      class="flex items-center justify-center h-full"
    >
      <div class="text-center space-y-6 px-4">
        <div class="text-7xl sm:text-8xl animate-pulse">🔄</div>
        <div class="space-y-2">
          <h2 class="text-xl sm:text-2xl font-black uppercase tracking-wider">
            Loading Modules
          </h2>
          <p v-if="initError" class="text-sm text-semantic-error font-bold">
            {{ initError }}
          </p>
        </div>
      </div>
    </div>

    <!-- Main App -->
    <BladeLayout v-else>
      <!-- Header -->
      <template #header>
        <div class="w-full flex items-center justify-between gap-3 sm:gap-4">
          <div class="flex-1 min-w-0">
            <h1 class="text-base sm:text-lg md:text-xl font-black uppercase tracking-wide truncate">
              {{ appTitle }}
            </h1>
            <p class="text-2xs sm:text-xs font-bold opacity-60 truncate">
              <span :class="{
                'text-semantic-success': syncStatus.variant === 'success',
                'text-semantic-error': syncStatus.variant === 'error',
                'text-semantic-warning': syncStatus.variant === 'warning',
                'text-semantic-info': syncStatus.variant === 'info',
              }">
                {{ syncStatus.icon }} {{ syncStatus.text }}
              </span>
              <span v-if="currentServer" class="hidden sm:inline">
                • {{ currentServer }}
              </span>
            </p>
          </div>
          <div class="shrink-0 flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              :disabled="syncing || !shouldSync"
              @click="handleManualSync"
            >
              <span :class="{ 'animate-spin': syncing }">🔄</span>
              <span class="hidden sm:inline">Sync</span>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              @click="openServerSelector"
            >
              🌐
              <span class="hidden sm:inline">Server</span>
            </Button>
          </div>
        </div>
      </template>

      <!-- Left Sidebar: Rooms -->
      <template #left>
        <RoomSidebar
          :active-room-id="activeRoomId"
          @select-room="handleSelectRoom"
          @search="handleSearch"
        />
      </template>

      <!-- Center: Notes Stream -->
      <NoteStream
        :filters="activeFilters"
        :search="searchQuery"
        :available-types="availableNoteTypes"
        @request-transform="handleRequestTransform"
      />

      <!-- Right Sidebar: Future insights/presence -->
      <template #right>
        <div class="flex-1 flex flex-col overflow-hidden bg-bg-secondary dark:bg-dark-bg-secondary">
          <div class="shrink-0 p-4 border-b-2 border-base-black dark:border-white">
            <h2 class="text-sm font-black uppercase tracking-wide opacity-70">
              Insights
            </h2>
          </div>
          <div class="flex-1 overflow-y-auto p-4 space-y-4">
            <div class="text-center py-8 px-4 space-y-3">
              <div class="text-4xl opacity-40">📊</div>
              <p class="text-xs font-bold opacity-60">
                Advanced analytics and collaborative presence coming soon
              </p>
            </div>
          </div>
        </div>
      </template>
    </BladeLayout>

    <!-- Modals -->
    <Teleport to="body">
      <!-- Server Selector -->
      <ServerSelector
        v-model="showServerSelector"
        @connected="handleConnected"
        @offline="handleOffline"
      />

      <!-- Transform Dialog -->
      <NoteTypeTransformDialog
        v-if="showTransformDialog && transformingNote"
        :current-type="transformingNote.type"
        :available-types="availableNoteTypes"
        @transform="handleTransform"
        @close="closeTransformDialog"
      />
    </Teleport>
  </div>
</template>
