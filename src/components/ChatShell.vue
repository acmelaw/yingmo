<script setup lang="ts">
import { computed, nextTick, ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useHead } from '@unhead/vue';

import Composer, { type ComposerAction, type ComposerActionContext } from './Composer.vue';
import NoteItem from './NoteItem.vue';
import SearchBar from './SearchBar.vue';
import { useNotesStore } from '../stores/notes';
import { useSettingsStore } from '../stores/settings';
import { useDataExport } from '../composables/useDataExport';
import { usePlatform } from '../composables/usePlatform';

const { t } = useI18n();
const store = useNotesStore();
const settingsStore = useSettingsStore();
const { exportToJSON, exportToText, importFromFile } = useDataExport();
const { platformName } = usePlatform();

const notes = computed(() => store.filteredNotes);
const categories = computed(() => store.categories);
const allTags = computed(() => store.allTags);

const containerRef = ref<HTMLElement | null>(null);
const showSettings = ref(false);
const showSearch = ref(false);
const showSidebar = ref(false);

const appTitle = computed(() => `${t('appName')}`);
const empty = computed(() => notes.value.length === 0);

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

onMounted(() => {
  scrollToLatest();
});

function scrollToLatest() {
  nextTick(() => {
    if (containerRef.value) {
      containerRef.value.scrollTop = containerRef.value.scrollHeight;
    }
  });
}

function handleAdd(text: string) {
  if (!text.trim()) return;

  // Tags are now handled by auto-extract setting in the store
  // No need to extract manually here
  store.add(text.trim());
  scrollToLatest();
}

function remove(id: string) {
  store.remove(id);
}

function toggleSettings() {
  showSettings.value = !showSettings.value;
  showSearch.value = false;
  showSidebar.value = false;
}

function toggleSearch() {
  showSearch.value = !showSearch.value;
  showSettings.value = false;
}

function toggleSidebar() {
  showSidebar.value = !showSidebar.value;
  showSettings.value = false;
  showSearch.value = false;
}

function selectTag(tag: string) {
  store.toggleTag(tag);
}

function clearTagFilters() {
  store.clearTagFilters();
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
  <div class="flex h-screen flex-col overflow-hidden" :class="settingsStore.isDarkMode ? 'dark' : ''">
    <!-- Header -->
    <header class="brutal-header flex items-center justify-between px-4 py-3 md:px-6 md:py-4">
      <div class="flex items-center gap-3">
        <button
          @click="toggleSidebar"
          class="brutal-btn-icon md:hidden"
          :aria-label="'Toggle sidebar'"
        >
          #️⃣
        </button>
        <div class="brutal-avatar">
          📝
        </div>
        <div class="flex flex-col">
          <h1 class="text-lg font-bold tracking-tight leading-none">{{ appTitle }}</h1>
          <p class="text-xs font-semibold opacity-60 mt-1">
            {{ store.totalNotes }} notes
            <span v-if="allTags.length > 0"> • {{ allTags.length }} tags</span>
          </p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <button
          type="button"
          class="brutal-btn-icon"
          :aria-label="t('search')"
          @click="toggleSearch"
        >
          🔍
        </button>
        <button
          type="button"
          class="brutal-btn-icon"
          :aria-label="t('settings')"
          @click="toggleSettings"
        >
          ⚙️
        </button>
        <button
          type="button"
          class="brutal-btn-icon hidden md:inline-flex"
          :aria-label="'Toggle sidebar'"
          @click="toggleSidebar"
        >
          #️⃣
        </button>
      </div>
    </header>

    <!-- Search Panel -->
    <Transition name="slide-up">
      <div v-if="showSearch" class="brutal-search px-4 py-3">
        <SearchBar />
      </div>
    </Transition>

    <!-- Settings Panel -->
    <Transition name="slide-up">
      <div v-if="showSettings" class="brutal-settings-panel">
        <h2 class="mb-6 text-lg font-bold uppercase tracking-wide">{{ t('settings') }}</h2>

        <div class="mb-6 flex flex-col gap-5">
          <!-- Server Connection Section -->
          <div class="p-4 bg-brutal-surface-secondary rounded-lg border-2 border-brutal-border">
            <div class="flex items-center justify-between mb-3">
              <div class="flex-1">
                <label class="text-sm font-bold uppercase tracking-wide block mb-1">
                  🌐 Server Sync
                </label>
                <p class="text-xs opacity-70">
                  Connect to a server for real-time collaboration
                </p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" v-model="settingsStore.syncEnabled" class="sr-only peer">
                <div class="w-11 h-6 bg-gray-400 peer-focus:ring-2 peer-focus:ring-brutal-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brutal-primary border-2 border-brutal-border"></div>
              </label>
            </div>

            <button
              @click="$emit('openServerSelector')"
              class="brutal-btn-sm brutal-btn-secondary w-full"
            >
              <span v-if="settingsStore.currentServer">
                📡 Change Server
              </span>
              <span v-else>
                🔌 Connect to Server
              </span>
            </button>

            <div v-if="settingsStore.currentServer" class="mt-2 text-xs opacity-70">
              Connected to: {{ settingsStore.currentServer }}
            </div>
          </div>

          <div class="flex items-center justify-between">
            <label class="text-sm font-bold uppercase tracking-wide">{{ t('theme') }}</label>
            <select v-model="settingsStore.theme" class="brutal-select">
              <option value="light">☀️ {{ t('light') }}</option>
              <option value="dark">🌙 {{ t('dark') }}</option>
              <option value="auto">🤖 {{ t('auto') }}</option>
            </select>
          </div>

          <div class="flex items-center justify-between">
            <label class="text-sm font-bold uppercase tracking-wide">{{ t('fontSize') }}</label>
            <select v-model="settingsStore.fontSize" class="brutal-select">
              <option value="small">{{ t('small') }}</option>
              <option value="medium">{{ t('medium') }}</option>
              <option value="large">{{ t('large') }}</option>
            </select>
          </div>

          <div class="flex items-center justify-between gap-4 p-4 bg-brutal-surface-secondary rounded-lg border-2 border-brutal-border">
            <div class="flex-1">
              <label class="text-sm font-bold uppercase tracking-wide block mb-1">Auto-Extract Tags</label>
              <p class="text-xs opacity-70">Detect and extract #hashtags when creating notes</p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" v-model="store.autoExtractTags" class="sr-only peer">
              <div class="w-11 h-6 bg-gray-400 peer-focus:ring-2 peer-focus:ring-brutal-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brutal-primary border-2 border-brutal-border"></div>
            </label>
          </div>

          <div
            v-if="store.autoExtractTags"
            class="flex items-center justify-between gap-4 p-4 bg-brutal-surface-secondary rounded-lg border-2 border-brutal-border"
          >
            <div class="flex-1">
              <label class="text-sm font-bold uppercase tracking-wide block mb-1">Clean Content</label>
              <p class="text-xs opacity-70">Remove #hashtags from note text after extracting (leaves clean content)</p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" v-model="store.cleanContentOnExtract" class="sr-only peer">
              <div class="w-11 h-6 bg-gray-400 peer-focus:ring-2 peer-focus:ring-brutal-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brutal-primary border-2 border-brutal-border"></div>
            </label>
          </div>
        </div>

        <div class="flex flex-wrap gap-3 border-t-4 border-brutal-border pt-6">
          <button @click="handleExportJSON" class="brutal-btn-sm brutal-btn-secondary">
            📥 {{ t('exportJSON') }}
          </button>
          <button @click="handleExportText" class="brutal-btn-sm brutal-btn-secondary">
            📝 {{ t('exportText') }}
          </button>
          <button @click="handleImport" class="brutal-btn-sm brutal-btn-secondary">
            📤 {{ t('importData') }}
          </button>
          <button @click="handleClearAll" class="brutal-btn-sm" style="background: var(--brutal-warning);">
            🗑️ {{ t('clearAll') }}
          </button>
        </div>

        <div class="mt-6 flex items-center justify-between text-xs font-bold uppercase tracking-wide opacity-60">
          <span>Active: {{ store.activeNotes }}</span>
          <span>Platform: {{ platformName }}</span>
        </div>
      </div>
    </Transition>

    <!-- Tag Filter Indicator -->
    <Transition name="slide-up">
      <div v-if="store.selectedTags.length > 0" class="brutal-search flex items-center justify-between">
        <div class="flex items-center gap-2 flex-wrap">
          <span class="text-sm font-bold">Filtering by:</span>
          <span
            v-for="tag in store.selectedTags"
            :key="tag"
            class="brutal-tag cursor-pointer hover:opacity-70"
            @click="selectTag(tag)"
          >
            #{{ tag }} ✕
          </span>
        </div>
        <button @click="clearTagFilters" class="brutal-btn-sm shrink-0">
          Clear All
        </button>
      </div>
    </Transition>

    <!-- Main Content Area with Sidebar -->
    <div class="flex flex-1 overflow-hidden">
      <!-- Hashtag Sidebar -->
      <Transition name="slide-left">
        <aside
          v-if="showSidebar"
          class="brutal-sidebar w-64 overflow-y-auto border-r-4 border-brutal-border bg-brutal-white p-4"
        >
          <div class="mb-4 flex items-center justify-between">
            <h2 class="text-base font-bold uppercase tracking-wide">Tags</h2>
            <button @click="toggleSidebar" class="brutal-btn-icon !w-8 !h-8 !min-w-8 !min-h-8 text-sm md:hidden">
              ✕
            </button>
          </div>

          <div v-if="allTags.length === 0" class="text-sm opacity-60 text-center py-8">
            No tags yet. Add #hashtags to your notes!
          </div>

          <div v-else class="flex flex-col gap-2">
            <button
              v-for="tag in allTags"
              :key="tag"
              @click="selectTag(tag)"
              class="brutal-tag-item w-full text-left px-3 py-2 font-bold transition-all"
              :class="{ 'active': store.selectedTags.includes(tag) }"
            >
              <span class="text-base">#{{ tag }}</span>
              <span class="ml-2 text-xs opacity-60">
                ({{ store.notes.filter(n => n.tags?.includes(tag)).length }})
              </span>
            </button>
          </div>

          <div v-if="store.selectedTags.length > 0" class="mt-6 pt-4 border-t-3 border-brutal-border">
            <button @click="clearTagFilters" class="brutal-btn-sm w-full">
              🔄 Clear Filters
            </button>
          </div>
        </aside>
      </Transition>

      <!-- Messages Container -->
      <main
        ref="containerRef"
        class="brutal-chat-container flex-1 overflow-y-auto px-4 py-6 md:px-6"
        :class="empty ? 'flex items-center justify-center' : ''"
      >
        <div v-if="empty" class="text-center animate-bounce">
          <div class="mb-6 text-7xl">💬</div>
          <p class="text-xl font-bold mb-2">
            {{ store.selectedTags.length > 0 ? 'No notes match all selected tags' : t('empty') }}
          </p>
          <p class="text-sm font-semibold opacity-60">
            {{ store.selectedTags.length > 0 ? 'Try different tags or clear the filters' : 'Start your first note below! 👇' }}
          </p>
        </div>

        <TransitionGroup
          v-else
          name="slide-left"
          tag="div"
          class="mx-auto flex max-w-4xl flex-col gap-4"
        >
          <NoteItem v-for="n in notes" :key="n.id" :note="n" @delete="remove(n.id)" />
        </TransitionGroup>
      </main>
    </div>

    <!-- Composer (Input Area) -->
    <div class="brutal-input-container">
      <Composer
        :actions="composerActions"
        @submit="handleAdd"
      />
    </div>
  </div>
</template>

<style scoped>
.scroll-y {
  overflow-y: auto;
  overflow-x: hidden;
}
</style>