<script setup lang="ts">
import { computed, ref, watch, nextTick } from "vue";
import { useNotes } from "../composables/useNotes";
import type { UseNotesFilters } from "../composables/useNotes";
import { useNotesStore } from "../stores/notes";
import NoteCard from "../components/NoteCard.vue";
import Composer from "../components/Composer.vue";
import { Button } from "../components/ui";
import type { NoteType } from "../types/note";

const props = withDefaults(
  defineProps<{
    filters?: UseNotesFilters;
    search?: string;
    availableTypes?: NoteType[];
  }>(),
  {
    availableTypes: () => ["text"],
  }
);

const emit = defineEmits<{
  (e: "request-transform", noteId: string): void;
}>();

const notesStore = useNotesStore();
const containerRef = ref<HTMLElement | null>(null);
const sortOrder = ref<"desc" | "asc">("desc");
const sortBy = ref<"updated" | "created" | "text">("updated");

const {
  notes,
  setFilter,
  clearFilters,
  setSort,
  create,
  sync,
  stats,
  isSyncing,
} = useNotes({
  autoSync: false, // Manual sync control
});

// Apply filters reactively
watch(
  () => props.filters,
  (value) => {
    clearFilters();
    if (!value) return;
    Object.entries(value).forEach(([key, val]) => {
      if (val === undefined) return;
      setFilter(key as keyof UseNotesFilters, val as never);
    });
  },
  { deep: true, immediate: true }
);

// Apply search reactively
watch(
  () => props.search ?? "",
  (value) => {
    const trimmed = value.trim();
    setFilter("search", trimmed || undefined);
  },
  { immediate: true }
);

// Apply sort reactively
watch([sortBy, sortOrder], () => setSort(sortBy.value, sortOrder.value), {
  immediate: true,
});

const hasNotes = computed(() => notes.value.length > 0);
const isEmpty = computed(() => !hasNotes.value);

const sortIcon = computed(() => (sortOrder.value === "desc" ? "⬇️" : "⬆️"));
const sortLabel = computed(() =>
  sortOrder.value === "desc" ? "Newest first" : "Oldest first"
);

function toggleSortOrder() {
  sortOrder.value = sortOrder.value === "desc" ? "asc" : "desc";
}

async function handleSync() {
  if (isSyncing.value) return;
  await sync();
}

function scrollToBottom() {
  nextTick(() => {
    if (containerRef.value) {
      containerRef.value.scrollTop = containerRef.value.scrollHeight;
    }
  });
}

async function handleCreate(text: string, type: NoteType) {
  const trimmed = text.trim();
  if (!trimmed) return;

  let payload: Record<string, unknown>;

  switch (type) {
    case "text":
      payload = { content: trimmed, text: trimmed };
      break;
    case "markdown":
      payload = { content: trimmed };
      break;
    case "code":
      payload = { content: trimmed, metadata: { language: "javascript" } };
      break;
    case "rich-text":
      payload = {
        content: `<p>${trimmed}</p>`,
        metadata: {
          format: "html",
          tiptapContent: {
            type: "doc",
            content: [
              {
                type: "paragraph",
                content: [{ type: "text", text: trimmed }],
              },
            ],
          },
        },
      };
      break;
    case "image":
      payload = { content: trimmed, metadata: { alt: trimmed } };
      break;
    case "smart-layer":
      payload = {
        content: trimmed,
        metadata: { source: { type: "text", data: trimmed }, layers: [] },
      };
      break;
    default:
      payload = { content: trimmed };
  }

  await create(type, payload);
  scrollToBottom();
}

async function handleDelete(id: string) {
  await notesStore.remove(id);
}

async function handleUpdate(id: string, updates: Record<string, unknown>) {
  await notesStore.update(id, updates);
}

async function handleArchive(id: string) {
  await notesStore.archive(id);
}

function handleTransform(id: string) {
  emit("request-transform", id);
}
</script>

<template>
  <section
    class="flex-1 flex flex-col overflow-hidden bg-bg-primary dark:bg-dark-bg-primary"
  >
    <!-- Stream Header -->
    <header
      class="shrink-0 px-4 py-3 flex items-center justify-between gap-3 border-b-3 border-base-black dark:border-white bg-bg-secondary dark:bg-dark-bg-secondary shadow-hard-sm"
    >
      <div class="flex-1 min-w-0">
        <h1
          class="text-base sm:text-lg font-black uppercase tracking-wide truncate"
        >
          Notes
        </h1>
        <p class="text-2xs sm:text-xs font-bold opacity-60 truncate">
          {{ stats.visible }} showing
          <span v-if="stats.visible !== stats.total" class="opacity-40">
            • {{ stats.total }} total
          </span>
        </p>
      </div>
      <div class="shrink-0 flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          :title="sortLabel"
          @click="toggleSortOrder"
        >
          {{ sortIcon }}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          title="Sync notes"
          :disabled="isSyncing"
          @click="handleSync"
        >
          <span :class="{ 'animate-spin': isSyncing }">🔄</span>
        </Button>
      </div>
    </header>

    <!-- Messages/Notes Stream -->
    <div
      ref="containerRef"
      class="flex-1 overflow-y-auto overscroll-contain px-3 sm:px-4 md:px-6 py-4 space-y-2 sm:space-y-3"
    >
      <!-- Empty State -->
      <div
        v-if="isEmpty"
        class="h-full flex items-center justify-center text-center"
      >
        <div class="max-w-sm space-y-4 animate-slide-up-fade px-4">
          <div class="text-6xl sm:text-7xl">🗒️</div>
          <div class="space-y-2">
            <h2 class="text-lg sm:text-xl font-black uppercase tracking-wide">
              No notes yet
            </h2>
            <p class="text-sm sm:text-base opacity-70 font-bold">
              Start typing below to capture your thoughts instantly
            </p>
          </div>
        </div>
      </div>

      <!-- Notes List -->
      <TransitionGroup
        v-else
        name="note-list"
        tag="div"
        class="space-y-2 sm:space-y-3"
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

    <!-- Composer Footer -->
    <footer
      class="shrink-0 p-3 sm:p-4 bg-bg-secondary dark:bg-dark-bg-secondary border-t-3 border-base-black dark:border-white shadow-hard"
    >
      <Composer
        :available-types="props.availableTypes"
        @submit="handleCreate"
      />
    </footer>
  </section>
</template>

<style scoped>
/* Note list transitions */
.note-list-enter-active,
.note-list-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.note-list-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.note-list-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}

.note-list-move {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
</style>
