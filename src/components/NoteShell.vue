/**
 * Refactored main shell component with modular architecture
 */

<script setup lang="ts">
import { computed, nextTick, ref, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useHead } from '@unhead/vue';
import { storeToRefs } from 'pinia';

import Composer, { type ComposerAction, type ComposerActionContext } from './Composer.vue';
import NoteCard from './NoteCard.vue';
import { useNotesStore } from '../stores/notes';
import { useSettingsStore } from '../stores/settings';
import { useDataExport } from '../composables/useDataExport';
import { usePlatform } from '../composables/usePlatform';
import { initializeModules } from '../core/initModules';
import { moduleRegistry } from '../core/ModuleRegistry';
import { useAuthStore } from '@/stores/auth';

const emit = defineEmits<{
  (e: 'open-server-selector'): void;
}>();

const { t } = useI18n();
const store = useNotesStore();
const settingsStore = useSettingsStore();
const authStore = useAuthStore();
const { exportToJSON, exportToText, importFromFile } = useDataExport();
const { platformName } = usePlatform();

const notes = computed(() => store.filteredNotes);
const categories = computed(() => store.categories);

const { hasRemoteSession, shouldSync, syncing, lastSyncedAt, syncError } = storeToRefs(store);
const { syncEnabled, currentServer } = storeToRefs(settingsStore);

const containerRef = ref<HTMLElement | null>(null);
const composerOpen = ref(true);
const composerFocusKey = ref(1);
const showSettings = ref(false);
const modulesInitialized = ref(false);

const appTitle = computed(() => `${t('appName')} - ${platformName.value}`);
const empty = computed(() => notes.value.length === 0);
const fabLabel = computed(() => t('openComposer'));

const remoteStatus = computed(() => {
  if (!syncEnabled.value) {
    return t('syncDisabled') || 'Sync disabled';
  }
  if (!hasRemoteSession.value) {
    return t('syncAwaitingAuth') || 'Awaiting authentication';
  }
  if (syncing.value) {
    return t('syncInProgress') || 'Syncing…';
  }
  if (syncError.value) {
    return `${t('syncError') || 'Error'}: ${syncError.value}`;
  }
  if (lastSyncedAt.value) {
    return `${t('lastSynced') || 'Last synced'} ${formatRelativeTime(lastSyncedAt.value)}`;
  }
  return t('syncReady') || 'Ready to sync';
});

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  if (diff < 5_000) return t('justNow') || 'just now';
  const seconds = Math.floor(diff / 1_000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// Get available note types from registered modules
const availableNoteTypes = computed(() => {
  const modules = moduleRegistry.getAllModules();
  return modules
    .filter(m => m.capabilities?.canCreate)
    .flatMap(m => m.supportedTypes);
});

const composerActions = computed<ComposerAction[]>(() => [
  {
    id: 'check',
    label: t('insertCheck'),
    icon: '✅',
    onTrigger: (ctx: ComposerActionContext) => {
      ctx.append(' ✅');
      ctx.focus();
    }
  }
]);

useHead(() => ({
  title: appTitle.value,
  meta: [
    {
      name: 'description',
      content: t('empty')
    },
    {
      name: 'theme-color',
      content: settingsStore.isDarkMode ? '#1a1a1a' : '#fdfcfa'
    }
  ]
}));

onMounted(async () => {
  await initializeModules();
  modulesInitialized.value = true;
});

watch(
  () => store.filteredNotes.length,
  () => {
    if (modulesInitialized.value) {
      scrollToLatest();
    }
  }
);

function scrollToLatest() {
  if (containerRef.value) {
    containerRef.value.scrollTo({
      top: containerRef.value.scrollHeight,
      behavior: 'smooth'
    });
  }
}

async function handleAdd(text: string) {
  if (!text.trim()) return;

  // Create text note via modular system
  await store.create('text', { text: text.trim() });

  nextTick(() => {
    scrollToLatest();
  });
}

async function handleUpdate(noteId: string, updates: any) {
  await store.update(noteId, updates);
}

async function handleDelete(id: string) {
  await store.remove(id);
}

async function handleArchive(id: string) {
  await store.archive(id);
}

function closeComposer() {
  composerOpen.value = false;
}

function openComposer() {
  composerOpen.value = true;
  nextTick(() => {
    composerFocusKey.value += 1;
  });
}

function toggleSettings() {
  showSettings.value = !showSettings.value;
}

function openServerSelector() {
  emit('open-server-selector');
}

async function manualSync() {
  if (!shouldSync.value || syncing.value) return;
  try {
    await store.syncFromServer();
  } catch (error) {
    console.error('Manual sync failed:', error);
  }
}

async function handleExportJSON() {
  await exportToJSON();
}

async function handleExportText() {
  await exportToText();
}

async function handleImport() {
  const success = await importFromFile();
  if (success) {
    alert('Import successful!');
  } else {
    alert('Import failed. Please check the file format.');
  }
}

function handleClearAll() {
  if (confirm(t('confirmClearAll'))) {
    store.clearAll();
  }
}
</script>

<template>
  <div class="relative min-h-screen bg-bg text-ink dark:bg-gray-900 dark:text-gray-100">
    <div v-if="!modulesInitialized" class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <div class="text-2xl mb-4">🔄</div>
        <div>Loading modules...</div>
      </div>
    </div>

    <div v-else class="mx-auto flex min-h-screen flex-col px-4 pb-28 pt-6 md:px-8">
      <div class="relative mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4">
        <header
          class="surface sticky top-4 z-30 flex items-center justify-between gap-3 px-4 py-3 md:px-6 md:py-4"
        >
          <h1 class="text-lg font-semibold tracking-wide">{{ appTitle }}</h1>
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="chip-brutal h-10 w-10 rounded-full text-lg"
              :aria-label="t('settings')"
              @click="toggleSettings"
            >
              ⚙️
            </button>
            <button
              type="button"
              class="chip-brutal hidden h-10 rounded-full px-4 text-sm font-semibold md:inline-flex md:items-center md:gap-2"
              :aria-label="composerOpen ? t('closeComposer') : t('openComposer')"
              @click="composerOpen ? closeComposer() : openComposer()"
            >
              <span aria-hidden="true">{{ composerOpen ? '−' : '+' }}</span>
              <span>{{ composerOpen ? t('closeComposer') : t('openComposer') }}</span>
            </button>
          </div>
        </header>

        <Transition name="fade">
          <div v-if="showSettings" class="surface p-4 md:p-6">
            <h2 class="mb-4 text-base font-semibold">{{ t('settings') }}</h2>

            <div class="mb-6 space-y-3">
              <div class="flex items-start justify-between gap-3">
                <div class="flex-1">
                  <label class="block text-sm font-medium uppercase tracking-wide">🌐 Server Sync</label>
                  <p class="text-xs opacity-70">
                    {{ t('syncDescription') || 'Connect to your sync server for collaboration and backup.' }}
                  </p>
                  <p
                    class="mt-2 text-xs font-semibold"
                    :class="store.syncError ? 'text-red-500' : 'text-ink/70 dark:text-white/70'"
                  >
                    {{ remoteStatus }}
                  </p>
                </div>
                <label class="relative inline-flex cursor-pointer items-center">
                  <input type="checkbox" v-model="settingsStore.syncEnabled" class="peer sr-only" />
                  <div
                    class="h-6 w-11 rounded-full border-2 border-ink/80 bg-gray-300 transition peer-checked:bg-accent dark:border-white/60 dark:bg-white/10"
                  >
                    <span
                      class="absolute top-[2px] left-[2px] h-5 w-5 rounded-full bg-white transition-all peer-checked:translate-x-full"
                    ></span>
                  </div>
                </label>
              </div>

              <div class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <button
                  class="chip-brutal px-4 py-2 text-sm font-semibold"
                  type="button"
                  @click="openServerSelector"
                >
                  <span v-if="currentServer">📡 {{ t('changeServer') || 'Change Server' }}</span>
                  <span v-else>🔌 {{ t('connectServer') || 'Connect to Server' }}</span>
                </button>
                <div class="text-xs opacity-60">
                  <template v-if="currentServer">
                    {{ currentServer }}
                    <template v-if="authStore.state.email">
                      • {{ authStore.state.email }}
                    </template>
                  </template>
                  <template v-else>
                    {{ t('noServerConnected') || 'No server connected' }}
                  </template>
                </div>
              </div>

              <div class="flex flex-wrap gap-2">
                <button
                  class="chip-brutal px-3 py-1 text-xs font-semibold"
                  type="button"
                  :disabled="!shouldSync || syncing"
                  @click="manualSync"
                >
                  <span v-if="syncing">⏳ {{ t('syncing') || 'Syncing…' }}</span>
                  <span v-else>🔄 {{ t('syncNow') || 'Sync Now' }}</span>
                </button>
                <button
                  v-if="syncError"
                  class="chip-brutal px-3 py-1 text-xs font-semibold"
                  type="button"
                  @click="manualSync"
                >
                  {{ t('retry') || 'Retry' }}
                </button>
              </div>
            </div>

            <div class="mb-4 flex flex-col gap-3">
              <div class="flex items-center justify-between">
                <label class="text-sm font-medium">{{ t('theme') }}</label>
                <select v-model="settingsStore.theme" class="surface rounded px-3 py-2 text-sm">
                  <option value="light">{{ t('light') }}</option>
                  <option value="dark">{{ t('dark') }}</option>
                  <option value="auto">{{ t('auto') }}</option>
                </select>
              </div>

              <div class="flex items-center justify-between">
                <label class="text-sm font-medium">{{ t('fontSize') }}</label>
                <select v-model="settingsStore.fontSize" class="surface rounded px-3 py-2 text-sm">
                  <option value="small">{{ t('small') }}</option>
                  <option value="medium">{{ t('medium') }}</option>
                  <option value="large">{{ t('large') }}</option>
                </select>
              </div>
            </div>

            <div class="mb-4">
              <h3 class="text-sm font-medium mb-2">Available Note Types</h3>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="type in availableNoteTypes"
                  :key="type"
                  class="chip-brutal px-3 py-1 text-xs"
                >
                  {{ type }}
                </span>
              </div>
            </div>

            <div class="flex flex-wrap gap-2 border-t pt-4 dark:border-gray-700">
              <button @click="handleExportJSON" class="chip-brutal px-4 py-2 text-sm">
                📥 {{ t('exportJSON') }}
              </button>
              <button @click="handleExportText" class="chip-brutal px-4 py-2 text-sm">
                📝 {{ t('exportText') }}
              </button>
              <button @click="handleImport" class="chip-brutal px-4 py-2 text-sm">
                📤 {{ t('importData') }}
              </button>
              <button @click="handleClearAll" class="chip-brutal px-4 py-2 text-sm text-red-600">
                🗑️ {{ t('clearAll') }}
              </button>
            </div>

            <div class="mt-4 text-xs opacity-70">
              Total: {{ store.totalNotes }} notes | Active: {{ store.activeNotes }}
            </div>
          </div>
        </Transition>

        <div class="surface px-4 py-3">
          <input
            v-model="store.searchQuery"
            type="search"
            :placeholder="t('search')"
            class="w-full bg-transparent text-sm outline-none"
          />
        </div>

        <main class="surface flex min-h-0 flex-1 flex-col gap-4 p-4 md:p-6">
          <div ref="containerRef" class="scroll-y pb-40" :data-empty="empty">
            <TransitionGroup name="fade" tag="div" class="flex flex-col gap-3">
              <NoteCard
                v-for="note in notes"
                :key="note.id"
                :note="note"
                @delete="handleDelete(note.id)"
                @update="(updates) => handleUpdate(note.id, updates)"
                @archive="handleArchive(note.id)"
              />
            </TransitionGroup>
            <p v-if="empty" class="py-8 text-center text-sm opacity-70">
              {{ t('empty') }}
            </p>
          </div>
        </main>
      </div>
    </div>

    <Transition name="fade">
      <div v-if="composerOpen && modulesInitialized" class="fixed inset-x-4 bottom-6 z-40 flex justify-center md:bottom-8">
        <Composer
          :actions="composerActions"
          :focus-key="composerFocusKey"
          class="w-full max-w-3xl md:w-[36rem]"
          @submit="handleAdd"
          @close="closeComposer"
        />
      </div>
    </Transition>

    <Transition name="fade">
      <button
        v-if="!composerOpen && modulesInitialized"
        class="fab-brutal fixed bottom-6 right-6 z-40 md:bottom-8 md:right-10"
        type="button"
        :aria-label="fabLabel"
        @click="openComposer"
      >
        +
      </button>
    </Transition>
  </div>
</template>
