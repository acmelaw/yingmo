/**
 * Refactored main shell component with modular architecture
 */

<script setup lang="ts">
import { computed, nextTick, ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useHead } from '@unhead/vue';

import Composer, { type ComposerAction, type ComposerActionContext } from './Composer.vue';
import NoteCard from './NoteCard.vue';
import { useNotesStore } from '../stores/notesModular';
import { useSettingsStore } from '../stores/settings';
import { useDataExport } from '../composables/useDataExport';
import { usePlatform } from '../composables/usePlatform';
import { initializeModules } from '../core/initModules';
import { moduleRegistry } from '../core/ModuleRegistry';

const { t } = useI18n();
const store = useNotesStore();
const settingsStore = useSettingsStore();
const { exportToJSON, exportToText, importFromFile } = useDataExport();
const { platformName } = usePlatform();

const notes = computed(() => store.filteredNotes);
const categories = computed(() => store.categories);

const containerRef = ref<HTMLElement | null>(null);
const composerOpen = ref(true);
const composerFocusKey = ref(1);
const showSettings = ref(false);
const modulesInitialized = ref(false);

const appTitle = computed(() => `${t('appName')} - ${platformName.value}`);
const empty = computed(() => notes.value.length === 0);
const fabLabel = computed(() => t('openComposer'));

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
