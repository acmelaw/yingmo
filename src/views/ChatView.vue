<!--
  ChatView - WhatsApp-style main interface
  The heart of the note-taking experience
-->
<script setup lang="ts">
import { computed, nextTick, ref, watch, onMounted, onUnmounted } from "vue";
import { storeToRefs } from "pinia";

// Stores
import { useNotesStore } from "../stores/notes";
import { useSettingsStore } from "../stores/settings";

// Components
import NoteCard from "../components/NoteCard.vue";
import QuickComposer from "../components/QuickComposer.vue";
import NoteTypeTransformDialog from "../components/NoteTypeTransformDialog.vue";
import { Button, Input, Badge } from "../components/ui";

// Types
import type { NoteType } from "../types/note";
import { moduleRegistry } from "../core/ModuleRegistry";

const emit = defineEmits<{
  (e: "open-server-settings"): void;
}>();

// === Stores ===
const notesStore = useNotesStore();
const settings = useSettingsStore();

const { notes, filteredNotes } = storeToRefs(notesStore);
const { syncEnabled, currentServer } = storeToRefs(settings);

// === Local State ===
const messagesContainer = ref<HTMLElement | null>(null);
const searchQuery = ref("");
const showSearch = ref(false);
const searchInputRef = ref<HTMLInputElement | null>(null);
const composerRef = ref<InstanceType<typeof QuickComposer> | null>(null);
const showSettings = ref(false);
const activeFilter = ref<"all" | "pinned" | "archived">("all");
const showSuccessToast = ref(false);
const successMessage = ref("");
const showTransformDialog = ref(false);
const transformingNoteId = ref<string | null>(null);

let toastTimeout: ReturnType<typeof setTimeout> | null = null;

// === Computed ===
const displayNotes = computed(() => {
  let result = notes.value;

  // Apply filter
  switch (activeFilter.value) {
    case "pinned":
      result = result.filter((n) => n.pinned && !n.archived);
      break;
    case "archived":
      result = result.filter((n) => n.archived);
      break;
    default:
      result = result.filter((n) => !n.archived);
  }

  // Apply search
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter((note) => {
      const content = (note.content || "").toLowerCase();
      const tags = (note.tags || []).join(" ").toLowerCase();
      return content.includes(query) || tags.includes(query);
    });
  }

  return result;
});

const hasNotes = computed(() => displayNotes.value.length > 0);

const transformingNote = computed(() => {
  if (!transformingNoteId.value) return null;
  return notes.value.find((n) => n.id === transformingNoteId.value) || null;
});

const availableTransforms = computed(() => {
  if (!transformingNote.value) return [];
  // Get all available note types for conversion
  return ['text', 'markdown', 'code', 'rich-text'].filter(
    (type) => type !== transformingNote.value!.type
  );
});

const noteStats = computed(() => ({
  all: notes.value.filter((n) => !n.archived).length,
  pinned: notes.value.filter((n) => n.pinned && !n.archived).length,
  archived: notes.value.filter((n) => n.archived).length,
}));

const availableNoteTypes = computed<NoteType[]>(() => {
  const modules = moduleRegistry.getAllModules();
  const types = new Set<NoteType>();

  modules
    .filter((m) => m.capabilities?.canCreate)
    .forEach((m) => m.supportedTypes.forEach((t) => types.add(t)));

  return Array.from(types).length > 0 ? Array.from(types) : ["text"];
});

const syncStatus = computed(() => {
  const { syncing, syncError, lastSyncedAt, hasRemoteSession } = notesStore;

  if (!syncEnabled.value) return { icon: "○", text: "Offline", color: "opacity-50" };
  if (!hasRemoteSession) return { icon: "○", text: "Not connected", color: "opacity-50" };
  if (syncing) return { icon: "⏳", text: "Syncing...", color: "text-accent-cyan" };
  if (syncError) return { icon: "⚠️", text: "Error", color: "text-semantic-error" };
  if (lastSyncedAt) {
    const mins = Math.max(1, Math.round((Date.now() - lastSyncedAt) / 60000));
    return { icon: "✓", text: `${mins}m ago`, color: "text-semantic-success" };
  }
  return { icon: "✓", text: "Ready", color: "text-semantic-success" };
});

// === Methods ===
function showToast(message: string) {
  successMessage.value = message;
  showSuccessToast.value = true;

  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    showSuccessToast.value = false;
  }, 2000);
}

function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
}

async function handleCreateNote(text: string, type: NoteType) {
  const trimmed = text.trim();
  if (!trimmed) return;

  // Extract hashtags from content
  const hashtags = trimmed.match(/#[\p{L}\p{N}_-]+/gu) || [];
  const tags = hashtags.map(tag => tag.slice(1)); // Remove # prefix

  // Create note with appropriate payload for type
  let noteData: Record<string, any>;

  switch (type) {
    case "text":
      noteData = { content: trimmed, text: trimmed };
      break;
    case "markdown":
      noteData = { content: trimmed };
      break;
    case "code":
      noteData = { content: trimmed, metadata: { language: "javascript" } };
      break;
    case "rich-text":
      noteData = {
        content: `<p>${trimmed}</p>`,
        metadata: {
          format: "html",
          tiptapContent: {
            type: "doc",
            content: [
              { type: "paragraph", content: [{ type: "text", text: trimmed }] },
            ],
          },
        },
      };
      break;
    case "image":
      noteData = { content: trimmed, metadata: { alt: trimmed } };
      break;
    case "smart-layer":
      noteData = {
        content: trimmed,
        metadata: { source: { type: "text", data: trimmed }, layers: [] },
      };
      break;
    default:
      noteData = { content: trimmed };
  }

  // Add extracted tags to note data
  if (tags.length > 0) {
    noteData.tags = tags;
  }

  await notesStore.create(type, noteData);

  // Show success feedback
  showToast("✓ Note created");

  // Clear search and scroll
  if (searchQuery.value) {
    searchQuery.value = "";
    showSearch.value = false;
  }

  // Reset to "all" filter if on pinned/archived
  if (activeFilter.value !== "all") {
    activeFilter.value = "all";
  }

  scrollToBottom();
}

async function handleDelete(id: string) {
  await notesStore.remove(id);
  showToast("🗑️ Note deleted");
}

async function handleUpdate(id: string, updates: Record<string, any>) {
  await notesStore.update(id, updates);
  showToast("✓ Note updated");
}

async function handleArchive(id: string) {
  await notesStore.archive(id);
  showToast("📦 Note archived");
}

async function handlePin(id: string) {
  const note = notes.value.find((n) => n.id === id);
  if (!note) return;

  await notesStore.update(id, { pinned: !note.pinned });
  showToast(note.pinned ? "📌 Note unpinned" : "⭐ Note pinned");
}

function handleTransform(id: string) {
  transformingNoteId.value = id;
  showTransformDialog.value = true;
}

async function applyTransform(toType: NoteType | string) {
  if (!transformingNoteId.value) return;

  await notesStore.update(transformingNoteId.value, {
    type: toType as NoteType,
    viewAs: undefined // Clear any view transform
  });
  showTransformDialog.value = false;
  transformingNoteId.value = null;
  showToast("🔄 Note type changed");
}

function closeTransformDialog() {
  showTransformDialog.value = false;
  transformingNoteId.value = null;
}

async function handleSync() {
  if (notesStore.shouldSync && !notesStore.syncing) {
    await notesStore.syncFromServer();
  }
}

// === Watchers ===
watch(
  () => displayNotes.value.length,
  () => {
    scrollToBottom();
  }
);

watch(searchQuery, (val) => {
  notesStore.searchQuery = val;
});

// === Keyboard Shortcuts ===
const focusedNoteId = ref<string | null>(null);

function handleGlobalKeydown(e: KeyboardEvent) {
  // Allow ESC to close search even when input focused
  if (e.key === "Escape" && showSearch.value) {
    showSearch.value = false;
    searchQuery.value = "";
    return;
  }

  // Don't intercept if typing in input/textarea
  const target = e.target as HTMLElement;
  if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
    return;
  }

  // Cmd/Ctrl + K: Focus search
  if ((e.metaKey || e.ctrlKey) && e.key === "k") {
    e.preventDefault();
    showSearch.value = !showSearch.value;
    // Focus search input after Vue updates DOM
    if (showSearch.value) {
      nextTick(() => searchInputRef.value?.focus());
    }
  }

  // Cmd/Ctrl + N: Focus composer (new note)
  if ((e.metaKey || e.ctrlKey) && e.key === "n") {
    e.preventDefault();
    composerRef.value?.focus();
  }

  // Cmd/Ctrl + 1/2/3: Switch filters
  if ((e.metaKey || e.ctrlKey) && !e.shiftKey) {
    if (e.key === "1") {
      e.preventDefault();
      activeFilter.value = "all";
    } else if (e.key === "2") {
      e.preventDefault();
      activeFilter.value = "pinned";
    } else if (e.key === "3") {
      e.preventDefault();
      activeFilter.value = "archived";
    }
  }

  // Quick actions on focused note: D=delete, P=pin, A=archive
  if (focusedNoteId.value) {
    if (e.key.toLowerCase() === 'd') {
      e.preventDefault();
      handleDelete(focusedNoteId.value);
      focusedNoteId.value = null;
    } else if (e.key.toLowerCase() === 'p') {
      e.preventDefault();
      handlePin(focusedNoteId.value);
    } else if (e.key.toLowerCase() === 'a') {
      e.preventDefault();
      handleArchive(focusedNoteId.value);
      focusedNoteId.value = null;
    }
  }
}

// Mount/unmount keyboard listeners
onMounted(() => {
  document.addEventListener("keydown", handleGlobalKeydown);
});

onUnmounted(() => {
  document.removeEventListener("keydown", handleGlobalKeydown);
  if (toastTimeout) clearTimeout(toastTimeout);
});
</script>

<template>
  <div class="chat-container">
    <!-- WhatsApp-style Header -->
    <header class="chat-header">
      <div class="flex items-center gap-3 flex-1 min-w-0">
        <!-- App Title -->
        <div class="flex-1 min-w-0">
          <h1 class="text-lg sm:text-xl font-black uppercase tracking-wide truncate">
            💬 Notes
          </h1>
          <p class="text-2xs font-bold opacity-60 truncate" :class="syncStatus.color">
            {{ syncStatus.icon }} {{ syncStatus.text }}
            <span v-if="currentServer" class="hidden sm:inline">
              • {{ currentServer }}
            </span>
          </p>
        </div>
      </div>

      <!-- Header Actions -->
      <div class="flex items-center gap-2">
        <!-- Keyboard hint (desktop only) -->
        <div class="hidden lg:flex items-center gap-1.5 px-2 py-1 text-2xs font-bold opacity-40 border border-base-black/20 dark:border-white/20 rounded">
          <kbd class="px-1 bg-base-black/10 dark:bg-white/10 rounded">⌘K</kbd>
          <span>Search</span>
        </div>

        <Button
          variant="ghost"
          size="icon"
          :title="showSearch ? 'Close search (Esc)' : 'Search notes (⌘K)'"
          :aria-label="showSearch ? 'Close search (keyboard shortcut: Esc)' : 'Search notes (keyboard shortcut: Cmd+K)'"
          @click="showSearch = !showSearch"
        >
          {{ showSearch ? "✕" : "🔍" }}
        </Button>

        <Button
          v-if="syncEnabled"
          variant="ghost"
          size="icon"
          title="Sync now"
          :disabled="notesStore.syncing"
          @click="handleSync"
        >
          <span :class="{ 'animate-spin': notesStore.syncing }">🔄</span>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          title="Server settings"
          @click="emit('open-server-settings')"
        >
          🌐
        </Button>
      </div>
    </header>

    <!-- Search Bar (expandable) -->
    <Transition
      enter-active-class="transition-all duration-200"
      enter-from-class="opacity-0 -translate-y-2"
      leave-active-class="transition-all duration-150"
      leave-to-class="opacity-0 -translate-y-2"
    >
      <div
        v-if="showSearch"
        class="shrink-0 p-3 bg-bg-secondary dark:bg-dark-bg-secondary border-b-2 border-base-black dark:border-white"
        role="search"
        aria-label="Search notes and tags"
      >
        <Input
          ref="searchInputRef"
          v-model="searchQuery"
          class="w-full"
          placeholder="🔍 Search notes, tags..."
          type="search"
          autofocus
          aria-label="Search notes by content or tags"
        />
      </div>
    </Transition>

    <!-- Quick Filter Chips -->
    <div class="shrink-0 px-3 py-2 flex items-center gap-2 border-b border-dashed border-base-black/20 dark:border-white/20 bg-bg-secondary/50 dark:bg-dark-bg-secondary/50">
      <button
        type="button"
        class="px-3 py-1.5 text-xs font-black uppercase border-2 border-base-black dark:border-white rounded-md transition-all duration-100"
        :class="activeFilter === 'all'
          ? 'bg-accent-cyan text-base-black shadow-hard-sm'
          : 'bg-base-white dark:bg-dark-bg-tertiary hover:(-translate-x-0.5 -translate-y-0.5 shadow-hard-sm)'"
        aria-label="Show all notes (keyboard shortcut: Cmd+1)"
        @click="activeFilter = 'all'"
      >
        💬 All <span v-if="noteStats.all > 0">({{ noteStats.all }})</span>
      </button>

      <button
        type="button"
        class="px-3 py-1.5 text-xs font-black uppercase border-2 border-base-black dark:border-white rounded-md transition-all duration-100"
        :class="activeFilter === 'pinned'
          ? 'bg-accent-yellow text-base-black shadow-hard-sm'
          : 'bg-base-white dark:bg-dark-bg-tertiary hover:(-translate-x-0.5 -translate-y-0.5 shadow-hard-sm)'"
        aria-label="Show pinned notes (keyboard shortcut: Cmd+2)"
        @click="activeFilter = 'pinned'"
      >
        ⭐ Pinned <span v-if="noteStats.pinned > 0">({{ noteStats.pinned }})</span>
      </button>

      <button
        type="button"
        class="px-3 py-1.5 text-xs font-black uppercase border-2 border-base-black dark:border-white rounded-md transition-all duration-100"
        :class="activeFilter === 'archived'
          ? 'bg-accent-purple text-base-white shadow-hard-sm'
          : 'bg-base-white dark:bg-dark-bg-tertiary hover:(-translate-x-0.5 -translate-y-0.5 shadow-hard-sm)'"
        aria-label="Show archived notes (keyboard shortcut: Cmd+3)"
        @click="activeFilter = 'archived'"
      >
        📦 Archived <span v-if="noteStats.archived > 0">({{ noteStats.archived }})</span>
      </button>

      <div class="flex-1"></div>

      <!-- Total count -->
      <span class="text-2xs font-bold opacity-60">
        {{ displayNotes.length }} note{{ displayNotes.length !== 1 ? 's' : '' }}
      </span>
    </div>

    <!-- Messages/Notes Area -->
    <div ref="messagesContainer" class="chat-messages">
      <!-- Empty State -->
      <div
        v-if="!hasNotes"
        class="h-full flex items-center justify-center text-center px-4"
      >
        <div class="max-w-md space-y-4 animate-slide-up-fade">
          <div class="text-7xl">💭</div>
          <div class="space-y-2">
            <h2 class="text-xl font-black uppercase tracking-wide">
              {{ searchQuery ? 'No matches found' : 'Start capturing thoughts' }}
            </h2>
            <p class="text-sm opacity-70 font-bold">
              {{ searchQuery
                ? 'Try a different search term'
                : 'Type below to create your first note. Quick like WhatsApp, powerful like Notion.'
              }}
            </p>
          </div>
        </div>
      </div>

      <!-- Notes List -->
      <TransitionGroup
        v-else
        name="message"
        tag="div"
        class="space-y-2 sm:space-y-3"
      >
        <NoteCard
          v-for="note in displayNotes"
          :key="note.id"
          :note="note"
          :class="{ 'ring-2 ring-accent-green': focusedNoteId === note.id }"
          @click="focusedNoteId = note.id"
          @delete="handleDelete(note.id)"
          @update="(updates) => handleUpdate(note.id, updates)"
          @archive="handleArchive(note.id)"
          @pin="handlePin(note.id)"
          @transform="handleTransform(note.id)"
        />
      </TransitionGroup>
    </div>

    <!-- Composer (WhatsApp-style bottom bar) -->
    <footer class="chat-composer">
      <QuickComposer
        ref="composerRef"
        :available-types="availableNoteTypes"
        @submit="handleCreateNote"
      />
    </footer>

    <!-- Success Toast -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-all duration-200"
        enter-from-class="opacity-0 translate-y-2"
        leave-active-class="transition-all duration-150"
        leave-to-class="opacity-0 translate-y-2"
      >
        <div
          v-if="showSuccessToast"
          class="fixed bottom-20 left-1/2 -translate-x-1/2 z-100 px-4 py-2.5 bg-accent-green text-base-black text-sm font-black border-3 border-base-black shadow-hard-lg rounded-lg"
        >
          {{ successMessage }}
        </div>
      </Transition>
    </Teleport>

    <!-- Transform Dialog -->
    <NoteTypeTransformDialog
      v-if="showTransformDialog && transformingNote"
      :current-type="transformingNote.type"
      :available-types="availableTransforms"
      @transform="applyTransform"
      @close="closeTransformDialog"
    />
  </div>
</template>

<style scoped>
/* Message transitions */
.message-enter-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.message-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.message-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 1, 1);
}

.message-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

.message-move {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
</style>
