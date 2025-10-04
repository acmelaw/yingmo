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
import ModulePicker from './ModulePicker.vue';
import NoteTypeTransformDialog from './NoteTypeTransformDialog.vue';
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
const categories = computed(() => store.categories);

const { hasRemoteSession, shouldSync, syncing, lastSyncedAt, syncError } = storeToRefs(store);
const { syncEnabled, currentServer } = storeToRefs(settingsStore);

const containerRef = ref<HTMLElement | null>(null);
const composerOpen = ref(true);
const composerFocusKey = ref(1);
const showSettings = ref(false);
const modulesInitialized = ref(false);
const showModulePicker = ref(false);
const showTransformDialog = ref(false);
const transformingNoteId = ref<string | null>(null);

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

// Get available note types/view modes from registered modules
const availableNoteTypes = computed<NoteType[]>(() => {
  const modules = moduleRegistry.getAllModules();
  const types: NoteType[] = [];
  
  // Add note types that can be created
  modules
    .filter(m => m.capabilities?.canCreate)
    .forEach(m => types.push(...(m.supportedTypes as NoteType[])));
    
  // Add view-only modules (like caesar-cipher)
  modules
    .filter(m => m.capabilities?.canTransform && m.supportedTypes.length === 0)
    .forEach(m => types.push(m.id as NoteType));
    
  return types;
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

async function handleAdd(text: string, type: NoteType = 'text') {
  if (!text.trim()) return;

  // UNIFIED: All notes use `content` + `metadata`
  let noteData: Record<string, any>;
  
  switch (type) {
    case 'text':
      noteData = { content: text.trim() };
      break;
    case 'markdown':
      noteData = { content: text.trim() };
      break;
    case 'code':
      noteData = { 
        content: text.trim(), 
        metadata: { language: 'javascript' }
      };
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
      // For image type from composer, treat text as URL
      noteData = { 
        content: text.trim(), // URL
        metadata: { alt: text.trim() }
      };
      break;
    case 'smart-layer':
      // For smart layer, wrap text as source data
      noteData = { 
        content: text.trim(),
        metadata: {
          source: { type: 'text', data: text.trim() },
          layers: []
        }
      };
      break;
    default:
      noteData = { content: text.trim() };
  }

  await store.create(type, noteData);

  nextTick(() => {
    scrollToLatest();
  });
}

function getDefaultDataForType(type: NoteType): Record<string, any> {
  // UNIFIED: All use content + metadata
  switch (type) {
    case 'markdown':
      return { content: '' };
    case 'code':
      return { content: '', metadata: { language: 'javascript' } };
    case 'rich-text':
      return { 
        content: '', 
        metadata: { 
          format: 'html',
          tiptapContent: { type: 'doc', content: [] }
        }
      };
    case 'image':
      return { content: '', metadata: {} };
    case 'smart-layer':
      return { 
        content: '', 
        metadata: { 
          source: { type: 'text', data: '' }, 
          layers: [] 
        }
      };
    default:
      return { content: '' };
  }
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
    // LOSSLESS transformation - only change the VIEW, not the data
    // This preserves all original data and can be reversed without corruption
    await store.update(transformingNoteId.value, {
      viewAs: toType === note.type ? undefined : toType as any
    });

    showTransformDialog.value = false;
    transformingNoteId.value = null;
  } catch (error) {
    console.error('Failed to transform note:', error);
  }
}

function handleCreateAdvanced(type: NoteType) {
  showModulePicker.value = false;
  // Create note with empty data for the selected type
  const defaultData = getDefaultDataForType(type);
  store.create(type, defaultData);
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
  <!-- NEO-BRUTALIST MESSENGER UI -->
  <div class="messenger-shell">
    <div v-if="!modulesInitialized" class="loading-screen">
      <div class="loading-content">
        <div class="loading-icon">🔄</div>
        <div class="loading-text">Loading modules...</div>
      </div>
    </div>

    <div v-else class="messenger-container">
      <!-- HEADER - Neo-Brutal -->
      <header class="messenger-header">
        <h1 class="app-title">{{ appTitle }}</h1>
        <div class="header-actions">
          <button
            type="button"
            class="header-btn"
            :aria-label="t('settings')"
            @click="toggleSettings"
          >
            ⚙️
          </button>
        </div>
      </header>

      <!-- SETTINGS PANEL -->
      <Transition name="slide-down">
        <div v-if="showSettings" class="settings-panel">
          <h2 class="settings-title">{{ t('settings') }}</h2>

          <div class="settings-section">
            <div class="setting-item">
              <div class="setting-info">
                <label class="setting-label">🌐 Server Sync</label>
                <p class="setting-desc">
                  {{ t('syncDescription') || 'Connect to your sync server for collaboration and backup.' }}
                </p>
                <p class="setting-status" :class="{ error: store.syncError }">
                  {{ remoteStatus }}
                </p>
              </div>
              <label class="toggle-switch">
                <input type="checkbox" v-model="settingsStore.syncEnabled" class="toggle-input" />
                <div class="toggle-track">
                  <span class="toggle-thumb"></span>
                </div>
              </label>
            </div>

            <div class="setting-buttons">
              <button class="setting-btn" type="button" @click="openServerSelector">
                <span v-if="currentServer">📡 {{ t('changeServer') || 'Change Server' }}</span>
                <span v-else>🔌 {{ t('connectServer') || 'Connect to Server' }}</span>
              </button>
              <div class="server-info">
                <template v-if="currentServer">
                  {{ currentServer }}
                  <template v-if="authStore.state.email"> • {{ authStore.state.email }}</template>
                </template>
                <template v-else>{{ t('noServerConnected') || 'No server connected' }}</template>
              </div>
            </div>

            <div class="sync-actions">
              <button class="sync-btn" type="button" :disabled="!shouldSync || syncing" @click="manualSync">
                <span v-if="syncing">⏳ {{ t('syncing') || 'Syncing…' }}</span>
                <span v-else>🔄 {{ t('syncNow') || 'Sync Now' }}</span>
              </button>
              <button v-if="syncError" class="sync-btn" type="button" @click="manualSync">
                {{ t('retry') || 'Retry' }}
              </button>
            </div>
          </div>

          <div class="settings-section">
            <div class="setting-row">
              <label class="setting-label">{{ t('theme') }}</label>
              <select v-model="settingsStore.theme" class="setting-select">
                <option value="light">{{ t('light') }}</option>
                <option value="dark">{{ t('dark') }}</option>
                <option value="auto">{{ t('auto') }}</option>
              </select>
            </div>

            <div class="setting-row">
              <label class="setting-label">{{ t('fontSize') }}</label>
              <select v-model="settingsStore.fontSize" class="setting-select">
                <option value="small">{{ t('small') }}</option>
                <option value="medium">{{ t('medium') }}</option>
                <option value="large">{{ t('large') }}</option>
              </select>
            </div>
          </div>

          <div class="settings-section">
            <h3 class="section-subtitle">Available Note Types</h3>
            <div class="note-types-grid">
              <span v-for="type in availableNoteTypes" :key="type" class="note-type-badge">
                {{ type }}
              </span>
            </div>
          </div>

          <div class="settings-actions">
            <button @click="handleExportJSON" class="action-btn-small">📥 {{ t('exportJSON') }}</button>
            <button @click="handleExportText" class="action-btn-small">📝 {{ t('exportText') }}</button>
            <button @click="handleImport" class="action-btn-small">📤 {{ t('importData') }}</button>
            <button @click="handleClearAll" class="action-btn-small danger">🗑️ {{ t('clearAll') }}</button>
          </div>

          <div class="stats-info">
            Total: {{ store.totalNotes }} notes | Active: {{ store.activeNotes }}
          </div>
        </div>
      </Transition>

      <!-- SEARCH BAR -->
      <div class="search-bar">
        <input
          v-model="store.searchQuery"
          type="search"
          :placeholder="t('search')"
          class="search-input"
        />
      </div>

      <!-- MESSAGE THREAD AREA -->
      <main class="message-thread">
        <div ref="containerRef" class="messages-container" :data-empty="empty">
          <TransitionGroup name="message-pop" tag="div" class="messages-list">
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
          <p v-if="empty" class="empty-state">
            {{ t('empty') }}
          </p>
        </div>
      </main>

      <!-- COMPOSER - Fixed at bottom like WhatsApp -->
      <Transition name="slide-up">
        <div v-if="composerOpen && modulesInitialized" class="composer-container">
          <Composer
            :actions="composerActions"
            :available-types="availableNoteTypes"
            :focus-key="composerFocusKey"
            @submit="handleAdd"
            @close="closeComposer"
          />
        </div>
      </Transition>

      <!-- FAB - When composer closed -->
      <Transition name="scale">
        <button
          v-if="!composerOpen && modulesInitialized"
          class="fab-button"
          type="button"
          :aria-label="fabLabel"
          @click="openComposer"
        >
          +
        </button>
      </Transition>
    </div>

    <!-- Module Picker Dialog -->
    <Transition name="fade">
      <div v-if="showModulePicker" class="modal-overlay">
        <ModulePicker @select="handleCreateAdvanced" @close="showModulePicker = false" />
      </div>
    </Transition>

    <!-- Transform Dialog -->
    <Transition name="fade">
      <NoteTypeTransformDialog
        v-if="showTransformDialog && transformingNoteId"
        :current-type="store.notes.find(n => n.id === transformingNoteId)?.type || 'text'"
        :available-types="availableNoteTypes"
        @transform="transformNote"
        @close="showTransformDialog = false; transformingNoteId = null"
      />
    </Transition>
  </div>
</template>

<style scoped>
/* === NEO-BRUTALIST MESSENGER SHELL === */

/* Container */
.messenger-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--brutal-bg);
  color: var(--brutal-text);
  transition: background-color var(--transition-brutal), color var(--transition-brutal);
}

/* Loading screen */
.loading-screen {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
}

.loading-content {
  text-align: center;
  font-size: var(--text-lg);
  font-weight: var(--font-black);
  color: var(--brutal-text);
}

.loading-icon {
  font-size: 2rem;
  margin-bottom: 1rem;
  animation: brutal-shake 0.5s infinite;
}

.loading-text {
  font-size: 1rem;
  font-weight: var(--font-black);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

/* Main container */
.messenger-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
}

/* === HEADER === */
.messenger-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-lg);
  background: var(--brutal-white);
  border-bottom: var(--brutal-border-thick) solid var(--brutal-border-color);
  box-shadow: var(--brutal-shadow-sm);
  position: sticky;
  top: 0;
  z-index: 30;
}

.app-title {
  font-size: var(--text-xl);
  font-weight: var(--font-black);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--brutal-text);
}

.header-actions {
  display: flex;
  gap: var(--space-sm);
}

.header-btn {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  background: var(--brutal-white);
  border: var(--brutal-border) solid var(--brutal-border-color);
  border-radius: var(--radius-sm);
  box-shadow: var(--brutal-shadow-sm);
  cursor: pointer;
  font-size: var(--text-lg);
  transition: all var(--transition-brutal);
  color: var(--brutal-text);
  font-weight: var(--font-black);
}

.header-btn:hover {
  transform: translate(-2px, -2px);
  box-shadow: var(--brutal-shadow);
  background: var(--brutal-yellow);
  color: var(--brutal-black);
}

.header-btn:active {
  transform: translate(1px, 1px);
  box-shadow: var(--brutal-shadow-sm);
}

/* === SETTINGS PANEL === */
.settings-panel {
  background: var(--brutal-white);
  border-bottom: var(--brutal-border-thick) solid var(--brutal-border-color);
  padding: var(--space-xl);
  max-height: 70vh;
  overflow-y: auto;
}

.settings-title {
  font-size: var(--text-lg);
  font-weight: var(--font-black);
  text-transform: uppercase;
  margin-bottom: var(--space-xl);
  letter-spacing: 0.1em;
  color: var(--brutal-text);
}

.settings-section {
  margin-bottom: var(--space-xl);
  padding-bottom: var(--space-xl);
  border-bottom: var(--brutal-border-thin) solid var(--brutal-border-color);
}

.setting-item {
  display: flex;
  justify-content: space-between;
  gap: var(--space-lg);
  margin-bottom: var(--space-lg);
}

.setting-info {
  flex: 1;
}

.setting-label {
  display: block;
  font-size: var(--text-sm);
  font-weight: var(--font-black);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: var(--space-xs);
  color: var(--brutal-text);
}

.setting-desc {
  font-size: var(--text-xs);
  opacity: 0.7;
  margin-bottom: var(--space-xs);
  font-weight: var(--font-bold);
}

.setting-status {
  font-size: var(--text-xs);
  font-weight: var(--font-black);
  text-transform: uppercase;
}

.setting-status.error {
  color: var(--brutal-pink);
}

/* === TOGGLE SWITCH === */
.toggle-switch {
  position: relative;
  display: inline-flex;
  cursor: pointer;
}

.toggle-input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.toggle-track {
  width: 52px;
  height: 32px;
  background: var(--brutal-bg-secondary);
  border: var(--brutal-border-thin) solid var(--brutal-border-color);
  border-radius: var(--radius-sm);
  position: relative;
  transition: background var(--transition-brutal);
}

.toggle-input:checked + .toggle-track {
  background: var(--brutal-green);
}

.toggle-thumb {
  position: absolute;
  top: 4px;
  left: 4px;
  width: 20px;
  height: 20px;
  background: var(--brutal-white);
  border: var(--brutal-border-thin) solid var(--brutal-border-color);
  border-radius: var(--radius-sm);
  transition: transform var(--transition-brutal);
  box-shadow: var(--brutal-shadow-sm);
}

.toggle-input:checked + .toggle-track .toggle-thumb {
  transform: translateX(20px);
}

/* === SETTING BUTTONS === */
.setting-buttons {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  margin-bottom: var(--space-lg);
}

.setting-btn {
  padding: var(--space-md) var(--space-lg);
  background: var(--brutal-white);
  border: var(--brutal-border) solid var(--brutal-border-color);
  border-radius: var(--radius-sm);
  box-shadow: var(--brutal-shadow-sm);
  font-weight: var(--font-black);
  text-transform: uppercase;
  cursor: pointer;
  transition: all var(--transition-brutal);
  font-size: var(--text-sm);
  color: var(--brutal-text);
}

.setting-btn:hover {
  transform: translate(-2px, -2px);
  box-shadow: var(--brutal-shadow);
  background: var(--brutal-cyan);
  color: var(--brutal-black);
}

.setting-btn:active {
  transform: translate(1px, 1px);
  box-shadow: var(--brutal-shadow-sm);
}

.server-info {
  font-size: var(--text-xs);
  opacity: 0.6;
  padding: var(--space-sm) 0;
  font-weight: var(--font-bold);
}

/* === SYNC ACTIONS === */
.sync-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
}

.sync-btn {
  padding: var(--space-sm) var(--space-md);
  background: var(--brutal-white);
  border: var(--brutal-border-thin) solid var(--brutal-border-color);
  border-radius: var(--radius-sm);
  box-shadow: var(--brutal-shadow-sm);
  font-weight: var(--font-black);
  font-size: var(--text-xs);
  cursor: pointer;
  transition: all var(--transition-brutal);
  text-transform: uppercase;
  color: var(--brutal-text);
}

.sync-btn:hover:not(:disabled) {
  transform: translate(-1px, -1px);
  box-shadow: var(--brutal-shadow-sm);
  background: var(--brutal-yellow);
  color: var(--brutal-black);
}

.sync-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* === SETTING ROWS === */
.setting-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-lg);
}

.setting-select {
  padding: var(--space-sm) var(--space-md);
  background: var(--brutal-white);
  border: var(--brutal-border-thin) solid var(--brutal-border-color);
  border-radius: var(--radius-sm);
  font-weight: var(--font-black);
  cursor: pointer;
  color: var(--brutal-text);
  text-transform: uppercase;
  font-size: var(--text-xs);
}

/* Section subtitle */
.section-subtitle {
  font-size: var(--text-sm);
  font-weight: var(--font-black);
  text-transform: uppercase;
  margin-bottom: var(--space-md);
  color: var(--brutal-text);
}

/* === NOTE TYPES GRID === */
.note-types-grid {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
}

.note-type-badge {
  padding: var(--space-sm) var(--space-md);
  background: var(--brutal-cyan);
  border: var(--brutal-border-thin) solid var(--brutal-border-color);
  border-radius: var(--radius-sm);
  box-shadow: var(--brutal-shadow-sm);
  font-size: var(--text-xs);
  font-weight: var(--font-black);
  text-transform: uppercase;
  color: var(--brutal-black);
}

/* === SETTINGS ACTIONS === */
.settings-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
  padding-top: var(--space-lg);
  border-top: var(--brutal-border-thin) solid var(--brutal-border-color);
}

.action-btn-small {
  padding: var(--space-sm) var(--space-lg);
  background: var(--brutal-white);
  border: var(--brutal-border-thin) solid var(--brutal-border-color);
  border-radius: var(--radius-sm);
  box-shadow: var(--brutal-shadow-sm);
  font-weight: var(--font-black);
  font-size: var(--text-sm);
  cursor: pointer;
  transition: all var(--transition-brutal);
  color: var(--brutal-text);
  text-transform: uppercase;
}

.action-btn-small:hover {
  transform: translate(-1px, -1px);
  box-shadow: var(--brutal-shadow-sm);
  background: var(--brutal-yellow);
  color: var(--brutal-black);
}

.action-btn-small.danger {
  color: var(--brutal-pink);
}

.action-btn-small.danger:hover {
  background: var(--brutal-pink);
  color: var(--brutal-white);
}

/* Stats info */
.stats-info {
  margin-top: var(--space-lg);
  font-size: var(--text-xs);
  opacity: 0.7;
  font-weight: var(--font-bold);
}

/* === SEARCH BAR === */
.search-bar {
  padding: var(--space-lg);
  background: var(--brutal-white);
  border-bottom: var(--brutal-border) solid var(--brutal-border-color);
}

.search-input {
  width: 100%;
  padding: var(--space-md);
  background: var(--brutal-bg);
  border: var(--brutal-border-thin) solid var(--brutal-border-color);
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  outline: none;
  font-weight: var(--font-bold);
  color: var(--brutal-text);
  transition: all var(--transition-brutal);
}

.search-input:focus {
  background: var(--brutal-white);
  box-shadow: var(--brutal-shadow-sm);
  border-color: var(--brutal-cyan);
}

/* === MESSAGE THREAD === */
.message-thread {
  flex: 1;
  overflow: hidden;
  background: var(--brutal-bg);
}

.messages-container {
  height: 100%;
  overflow-y: auto;
  padding: var(--space-lg);
  padding-bottom: 8rem; /* Space for composer */
}

.messages-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.empty-state {
  text-align: center;
  padding: 4rem 1rem;
  font-size: var(--text-sm);
  opacity: 0.5;
  font-weight: var(--font-black);
  text-transform: uppercase;
}

/* === COMPOSER CONTAINER === */
.composer-container {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: var(--space-lg);
  background: var(--brutal-white);
  border-top: var(--brutal-border-thick) solid var(--brutal-border-color);
  box-shadow: 0 calc(-1 * var(--brutal-border-thick)) 0 var(--brutal-border-color);
  z-index: 40;
  max-width: 800px;
  margin: 0 auto;
}

/* === FAB === */
.fab-button {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  width: 56px;
  height: 56px;
  background: var(--brutal-pink);
  border: var(--brutal-border) solid var(--brutal-border-color);
  border-radius: var(--radius-md);
  box-shadow: var(--brutal-shadow);
  font-size: 2rem;
  font-weight: var(--font-black);
  color: var(--brutal-white);
  cursor: pointer;
  transition: all var(--transition-brutal);
  z-index: 40;
  display: grid;
  place-items: center;
}

.fab-button:hover {
  transform: translate(-2px, -2px);
  box-shadow: var(--brutal-shadow-lg);
  background: var(--brutal-cyan);
  color: var(--brutal-black);
  animation: brutal-shake 0.3s;
}

.fab-button:active {
  transform: translate(2px, 2px);
  box-shadow: var(--brutal-shadow-sm);
}

/* Modal overlay */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-lg);
  z-index: 50;
}

/* === ANIMATIONS === */
@keyframes slide-down-enter {
  from {
    opacity: 0;
    transform: translateY(-10px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes slide-down-leave {
  from {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  to {
    opacity: 0;
    transform: translateY(-10px) scale(0.98);
  }
}

.slide-down-enter-active {
  animation: slide-down-enter 0.15s ease-out;
}

.slide-down-leave-active {
  animation: slide-down-leave 0.1s ease-in;
}

@keyframes slide-up-enter {
  from {
    opacity: 0;
    transform: translateY(10px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes slide-up-leave {
  from {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  to {
    opacity: 0;
    transform: translateY(10px) scale(0.98);
  }
}

.slide-up-enter-active {
  animation: slide-up-enter 0.15s ease-out;
}

.slide-up-leave-active {
  animation: slide-up-leave 0.1s ease-in;
}

@keyframes message-pop-enter {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(5px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.message-pop-enter-active {
  animation: message-pop-enter 0.15s ease-out;
}

@keyframes scale-enter {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes scale-leave {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.8);
  }
}

.scale-enter-active {
  animation: scale-enter 0.15s ease-out;
}

.scale-leave-active {
  animation: scale-leave 0.1s ease-in;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--transition-brutal);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* === RESPONSIVE === */
@media (max-width: 640px) {
  .messenger-container {
    max-width: 100%;
  }
  
  .composer-container {
    max-width: 100%;
  }
  
  .settings-panel {
    max-height: 60vh;
  }
  
  .fab-button {
    bottom: 1rem;
    right: 1rem;
    width: 48px;
    height: 48px;
    font-size: 1.75rem;
  }
}

@media (min-width: 641px) and (max-width: 1024px) {
  .messenger-container {
    max-width: 90%;
  }
}
</style>

