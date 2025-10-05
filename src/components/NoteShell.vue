/**
 * Neo-Brutalist WhatsApp-Style Messenger Shell
 * Improved UX with proper centering and shadcn-style components
 * 
 * USER FLOW:
 * 1. User lands on chat interface (centered, max-width for readability)
 * 2. Header shows app name + quick actions (settings, sync status)
 * 3. Search bar for filtering notes
 * 4. Messages scroll area (vertically centered when empty)
 * 5. Composer fixed at bottom (always accessible)
 * 6. Settings panel slides down from top
 * 7. Transform dialog overlays center screen
 */

<script setup lang="ts">
import { computed, nextTick, ref, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useHead } from '@unhead/vue';
import { storeToRefs } from 'pinia';

import Composer from './Composer.vue';
import NoteCard from './NoteCard.vue';
import NoteTypeTransformDialog from './NoteTypeTransformDialog.vue';
import { Button, Badge, Input, Select, Switch, Separator, Card } from './ui';
import { useNotesStore } from '../stores/notes';
import { useSettingsStore } from '../stores/settings';
import { useDataExport } from '../composables/useDataExport';
import { usePlatform } from '../composables/usePlatform';
import { initializeModules } from '../core/initModules';
import { moduleRegistry } from '../core/ModuleRegistry';
import { useAuthStore } from '@/stores/auth';
import type { NoteType } from '@/types/note';

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
const { hasRemoteSession, shouldSync, syncing, lastSyncedAt, syncError } = storeToRefs(store);
const { syncEnabled, currentServer } = storeToRefs(settingsStore);

const containerRef = ref<HTMLElement | null>(null);
const composerOpen = ref(true);
const composerFocusKey = ref(1);
const showSettings = ref(false);
const modulesInitialized = ref(false);
const showTransformDialog = ref(false);
const transformingNoteId = ref<string | null>(null);
const searchQuery = ref('');

const appTitle = computed(() => t('appName') || 'Notes');
const empty = computed(() => notes.value.length === 0);

const remoteStatus = computed(() => {
  if (!syncEnabled.value) return { text: 'Offline', color: 'opacity-50' };
  if (!hasRemoteSession.value) return { text: 'Not connected', color: 'opacity-50' };
  if (syncing.value) return { text: 'Syncing...', color: 'text-accent-cyan' };
  if (syncError.value) return { text: 'Error', color: 'text-semantic-error' };
  if (lastSyncedAt.value) return { text: `Synced ${formatRelativeTime(lastSyncedAt.value)}`, color: 'text-semantic-success' };
  return { text: 'Ready', color: 'text-semantic-success' };
});

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  if (diff < 5_000) return 'now';
  const seconds = Math.floor(diff / 1_000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const availableNoteTypes = computed<NoteType[]>(() => {
  const modules = moduleRegistry.getAllModules();
  const types: NoteType[] = [];
  modules
    .filter(m => m.capabilities?.canCreate)
    .forEach(m => types.push(...(m.supportedTypes as NoteType[])));
  modules
    .filter(m => m.capabilities?.canTransform && m.supportedTypes.length === 0)
    .forEach(m => types.push(m.id as NoteType));
  return types;
});

const themeOptions = computed(() => [
  { value: 'light', label: '☀️ Light' },
  { value: 'dark', label: '🌙 Dark' },
  { value: 'auto', label: '🔄 Auto' },
]);

const fontSizeOptions = computed(() => [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
]);

useHead(() => ({
  title: appTitle.value,
  meta: [
    { name: 'theme-color', content: settingsStore.isDarkMode ? '#0B141A' : '#ECE5DD' }
  ]
}));

onMounted(async () => {
  await initializeModules();
  modulesInitialized.value = true;
});

watch(
  () => store.filteredNotes.length,
  () => {
    if (modulesInitialized.value) scrollToLatest();
  }
);

watch(searchQuery, (newQuery) => {
  store.searchQuery = newQuery;
});

function scrollToLatest() {
  if (containerRef.value) {
    containerRef.value.scrollTo({ top: containerRef.value.scrollHeight, behavior: 'smooth' });
  }
}

async function handleAdd(text: string, type: NoteType = 'text') {
  if (!text.trim()) return;
  let noteData: Record<string, any>;
  switch (type) {
    case 'text':
      noteData = { content: text.trim(), text: text.trim() };
      break;
    case 'markdown':
      noteData = { content: text.trim() };
      break;
    case 'code':
      noteData = { content: text.trim(), metadata: { language: 'javascript' } };
      break;
    case 'rich-text':
      noteData = {
        content: `<p>${text.trim()}</p>`,
        metadata: {
          format: 'html',
          tiptapContent: {
            type: 'doc',
            content: [{ type: 'paragraph', content: [{ type: 'text', text: text.trim() }] }]
          }
        }
      };
      break;
    case 'image':
      noteData = { content: text.trim(), metadata: { alt: text.trim() } };
      break;
    case 'smart-layer':
      noteData = {
        content: text.trim(),
        metadata: { source: { type: 'text', data: text.trim() }, layers: [] }
      };
      break;
    default:
      noteData = { content: text.trim() };
  }
  await store.create(type, noteData);
  nextTick(() => scrollToLatest());
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

function handleTransform(noteId: string) {
  transformingNoteId.value = noteId;
  showTransformDialog.value = true;
}

async function transformNote(toType: NoteType | string) {
  if (!transformingNoteId.value) return;
  const note = store.notes.find(n => n.id === transformingNoteId.value);
  if (!note) return;
  try {
    await store.update(transformingNoteId.value, {
      viewAs: toType === note.type ? undefined : toType as any
    });
    showTransformDialog.value = false;
    transformingNoteId.value = null;
  } catch (error) {
    console.error('Failed to transform note:', error);
  }
}

async function manualSync() {
  if (!shouldSync.value || syncing.value) return;
  try {
    await store.syncFromServer();
  } catch (error) {
    console.error('Manual sync failed:', error);
  }
}

function openServerSelector() {
  emit('open-server-selector');
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
  }
}
</script>

<template>
  <!-- Loading Screen (Centered) -->
  <div v-if="!modulesInitialized" class="flex items-center justify-center min-h-screen bg-bg-primary dark:bg-dark-bg-primary">
    <div class="text-center space-y-4">
      <div class="text-6xl animate-pulse">🔄</div>
      <div class="text-lg sm:text-xl font-black uppercase tracking-wider">Loading modules...</div>
    </div>
  </div>

  <!-- Main Messenger Container (Centered with max-width) -->
  <div v-else class="chat-container">
    <!-- Header (WhatsApp-style, properly centered content) -->
    <header class="chat-header">
      <div class="w-full max-w-5xl mx-auto flex items-center justify-between gap-3">
        <!-- Left: App Title + Stats -->
        <div class="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          <h1 class="text-lg sm:text-xl md:text-2xl font-black uppercase tracking-wider truncate">
            {{ appTitle }}
          </h1>
          <Badge v-if="notes.length > 0" variant="default" class="hidden sm:inline-flex">
            {{ notes.length }}
          </Badge>
        </div>
        
        <!-- Right: Sync Status + Settings -->
        <div class="flex items-center gap-2 shrink-0">
          <!-- Sync Indicator -->
          <div
            v-if="syncEnabled"
            class="hidden md:flex items-center gap-1.5 px-2 py-1 text-2xs font-bold border-2 border-base-black dark:border-white rounded bg-base-white dark:bg-dark-bg-primary"
            :class="remoteStatus.color"
          >
            <span v-if="syncing">⏳</span>
            <span v-else-if="syncError">⚠️</span>
            <span v-else-if="hasRemoteSession">✓</span>
            <span v-else>○</span>
            <span>{{ remoteStatus.text }}</span>
          </div>

          <!-- Settings Button -->
          <Button
            variant="ghost"
            size="icon"
            @click="showSettings = !showSettings"
            :title="showSettings ? 'Close settings' : 'Open settings'"
          >
            {{ showSettings ? '✕' : '⚙️' }}
          </Button>
        </div>
      </div>
    </header>

    <!-- Settings Panel (Expandable, centered content) -->
    <Transition
      enter-active-class="transition-all duration-200 ease-out"
      leave-active-class="transition-all duration-150 ease-in"
      enter-from-class="opacity-0 -translate-y-2 max-h-0"
      enter-to-class="opacity-100 translate-y-0 max-h-screen"
      leave-from-class="opacity-100 translate-y-0 max-h-screen"
      leave-to-class="opacity-0 -translate-y-2 max-h-0"
    >
      <div
        v-if="showSettings"
        class="bg-bg-secondary dark:bg-dark-bg-secondary border-b-2 sm:border-b-3 border-base-black dark:border-white overflow-hidden"
      >
        <div class="w-full max-w-5xl mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
          <!-- Sync Section -->
          <Card>
            <div class="p-4 sm:p-6 space-y-4">
              <div class="flex items-center justify-between gap-4">
                <div class="flex-1 min-w-0">
                  <h3 class="font-black text-sm sm:text-base uppercase flex items-center gap-2">
                    🌐 Server Sync
                  </h3>
                  <p class="text-2xs sm:text-xs mt-1 opacity-75 font-bold">
                    {{ remoteStatus.text }}{{ currentServer ? ` • ${currentServer}` : '' }}
                  </p>
                </div>
                <Switch v-model="settingsStore.syncEnabled" />
              </div>

              <Separator />

              <div class="flex flex-wrap gap-2">
                <Button variant="secondary" size="sm" @click="openServerSelector">
                  {{ currentServer ? '📡 Change Server' : '🔌 Connect Server' }}
                </Button>
                <Button
                  v-if="shouldSync"
                  variant="primary"
                  size="sm"
                  :disabled="syncing"
                  @click="manualSync"
                >
                  {{ syncing ? '⏳ Syncing...' : '🔄 Sync Now' }}
                </Button>
              </div>

              <p v-if="authStore.state.email" class="text-2xs sm:text-xs opacity-60 font-bold truncate">
                Logged in: {{ authStore.state.email }}
              </p>
            </div>
          </Card>

          <!-- Appearance Section -->
          <Card>
            <div class="p-4 sm:p-6 space-y-4">
              <h3 class="font-black text-sm sm:text-base uppercase">🎨 Appearance</h3>
              
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div class="space-y-2">
                  <label class="block text-xs sm:text-sm font-black uppercase opacity-75">Theme</label>
                  <Select v-model="settingsStore.theme" :options="themeOptions" />
                </div>
                <div class="space-y-2">
                  <label class="block text-xs sm:text-sm font-black uppercase opacity-75">Font Size</label>
                  <Select v-model="settingsStore.fontSize" :options="fontSizeOptions" />
                </div>
              </div>
            </div>
          </Card>

          <!-- Module Types -->
          <Card>
            <div class="p-4 sm:p-6 space-y-3">
              <h3 class="font-black text-sm sm:text-base uppercase">📦 Available Types ({{ availableNoteTypes.length }})</h3>
              <div class="flex flex-wrap gap-1.5 sm:gap-2">
                <Badge v-for="type in availableNoteTypes" :key="type" variant="type">
                  {{ type }}
                </Badge>
              </div>
            </div>
          </Card>

          <!-- Data Management -->
          <Card>
            <div class="p-4 sm:p-6 space-y-3">
              <h3 class="font-black text-sm sm:text-base uppercase">💾 Data Management</h3>
              <div class="flex flex-wrap gap-2">
                <Button variant="secondary" size="sm" @click="handleExportJSON">
                  📥 Export JSON
                </Button>
                <Button variant="secondary" size="sm" @click="handleExportText">
                  📝 Export Text
                </Button>
                <Button variant="secondary" size="sm" @click="handleImport">
                  📤 Import
                </Button>
              </div>
              <p class="text-2xs sm:text-xs opacity-60 font-bold">
                Total: {{ store.totalNotes }} notes • Active: {{ store.activeNotes }}
              </p>
            </div>
          </Card>
        </div>
      </div>
    </Transition>

    <!-- Search Bar (Centered content) -->
    <div class="bg-bg-secondary dark:bg-dark-bg-secondary border-b-2 border-base-black dark:border-white">
      <div class="w-full max-w-5xl mx-auto p-2 sm:p-3">
        <Input
          v-model="searchQuery"
          type="search"
          placeholder="🔍 Search notes..."
          size="md"
        />
      </div>
    </div>

    <!-- Messages Area (Centered, properly aligned when empty) -->
    <main ref="containerRef" class="flex-1 overflow-y-auto bg-bg-primary dark:bg-dark-bg-primary">
      <div class="w-full max-w-5xl mx-auto p-3 sm:p-4 md:p-6">
        <!-- Empty State (Vertically & Horizontally Centered) -->
        <div v-if="empty" class="flex items-center justify-center min-h-[50vh]">
          <div class="text-center space-y-3 sm:space-y-4 p-6">
            <div class="text-5xl sm:text-6xl">💬</div>
            <h2 class="text-base sm:text-lg md:text-xl font-black uppercase">{{ t('empty') || 'No notes yet' }}</h2>
            <p class="text-xs sm:text-sm opacity-75 max-w-md mx-auto">
              Start typing in the message bar below to create your first note!
            </p>
          </div>
        </div>

        <!-- Notes List -->
        <TransitionGroup
          v-else
          name="message"
          tag="div"
          class="space-y-2 sm:space-y-3"
          enter-active-class="transition-all duration-200 ease-out"
          leave-active-class="transition-all duration-150 ease-in"
          enter-from-class="opacity-0 translate-y-4"
          leave-to-class="opacity-0 -translate-y-2 scale-95"
        >
          <NoteCard
            v-for="note in notes"
            :key="note.id"
            :note="note"
            @delete="handleDelete(note.id)"
            @update="(updates) => handleUpdate(note.id, updates)"
            @archive="handleArchive(note.id)"
            @transform="handleTransform(note.id)"
          />
        </TransitionGroup>
      </div>
    </main>

    <!-- Composer (Fixed bottom, centered content) -->
    <div v-if="composerOpen" class="shrink-0 border-t-2 sm:border-t-3 border-base-black dark:border-white bg-bg-secondary dark:bg-dark-bg-secondary">
      <div class="w-full max-w-5xl mx-auto">
        <Composer
          :available-types="availableNoteTypes"
          :focus-key="composerFocusKey"
          @submit="handleAdd"
        />
      </div>
    </div>

    <!-- Transform Dialog (Centered overlay) -->
    <NoteTypeTransformDialog
      v-if="showTransformDialog && transformingNoteId"
      :current-type="store.notes.find(n => n.id === transformingNoteId)?.type || 'text'"
      :available-types="availableNoteTypes"
      @transform="transformNote"
      @close="showTransformDialog = false; transformingNoteId = null"
    />
  </div>
</template>
