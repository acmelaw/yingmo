<script setup lang="ts">
import { computed, ref, watch, watchEffect } from "vue";
import { useNotes } from "../composables/useNotes";
import type { UseNotesFilters } from "../composables/useNotes";
import { Input, Badge } from "../components/ui";

interface Room {
  id: string;
  label: string;
  icon: string;
  filters: UseNotesFilters;
  variant?: "primary" | "accent" | "warning";
}

const emit = defineEmits<{
  (e: "select-room", payload: { id: string; filters: UseNotesFilters }): void;
  (e: "search", query: string): void;
}>();

const props = withDefaults(
  defineProps<{
    activeRoomId?: string;
  }>(),
  {
    activeRoomId: "inbox",
  }
);

const searchQuery = ref("");
const internalActiveRoom = ref(props.activeRoomId);
const { allTags, stats } = useNotes();

// Sync internal state with prop changes
watchEffect(() => {
  if (props.activeRoomId) {
    internalActiveRoom.value = props.activeRoomId;
  }
});

const baseRooms: Room[] = [
  {
    id: "inbox",
    label: "Inbox",
    icon: "💬",
    filters: {},
    variant: "primary"
  },
  {
    id: "pinned",
    label: "Pinned",
    icon: "⭐",
    filters: { onlyPinned: true },
    variant: "accent"
  },
  {
    id: "archived",
    label: "Archived",
    icon: "📦",
    filters: { includeArchived: true, onlyArchived: true },
    variant: "warning"
  },
];

const tagRooms = computed<Room[]>(() =>
  allTags.value.map((tag) => ({
    id: `tag:${tag}`,
    label: tag,
    icon: "#️⃣",
    filters: { tags: [tag] },
    variant: "accent" as const,
  }))
);

const rooms = computed(() => [...baseRooms, ...tagRooms.value]);

const activeRoom = computed(() => {
  return rooms.value.find((r) => r.id === internalActiveRoom.value) ?? rooms.value[0];
});

function handleSelect(room: Room) {
  internalActiveRoom.value = room.id;
  emit("select-room", { id: room.id, filters: room.filters });
}

// Debounced search emission
let searchTimeout: ReturnType<typeof setTimeout> | null = null;
watch(searchQuery, (value) => {
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    emit("search", value.trim());
  }, 150);
});
</script>

<template>
  <div class="flex-1 flex flex-col overflow-hidden bg-bg-secondary dark:bg-dark-bg-secondary">
    <!-- Sidebar Header -->
    <div class="shrink-0 p-4 border-b-2 border-base-black dark:border-white">
      <div class="space-y-1">
        <h2 class="text-sm font-black uppercase tracking-wide opacity-70">Rooms</h2>
        <p class="text-xs text-text-secondary dark:text-dark-text-secondary">
          {{ stats.active }} active • {{ stats.total }} total
        </p>
      </div>
    </div>

    <!-- Search -->
    <div class="shrink-0 p-3 border-b border-dashed border-base-black/20 dark:border-white/20">
      <Input
        v-model="searchQuery"
        class="w-full"
        placeholder="🔍 Search notes..."
        type="search"
      />
    </div>

    <!-- Rooms List -->
    <div class="flex-1 overflow-y-auto overscroll-contain">
      <div class="p-3 space-y-4">
        <!-- Quick Access -->
        <nav class="space-y-2">
          <h3 class="px-1 text-2xs font-black uppercase tracking-wider opacity-60">Quick Access</h3>
          <ul class="space-y-1.5" role="list">
            <li v-for="room in baseRooms" :key="room.id">
              <button
                type="button"
                class="w-full group relative flex items-center gap-2.5 px-3 py-2.5 text-left font-bold text-sm rounded-md border-2 border-base-black dark:border-white transition-all duration-100 touch-manipulation"
                :class="[
                  room.id === activeRoom.id
                    ? 'bg-accent-cyan text-base-black shadow-hard-sm translate-x-0 translate-y-0'
                    : 'bg-base-white dark:bg-dark-bg-tertiary text-text-primary dark:text-dark-text-primary shadow-hard-sm hover:(-translate-x-0.5 -translate-y-0.5 shadow-hard) active:(translate-x-0 translate-y-0 shadow-hard-sm)'
                ]"
                @click="handleSelect(room)"
              >
                <span class="text-lg leading-none">{{ room.icon }}</span>
                <span class="flex-1 truncate">{{ room.label }}</span>
                <Badge
                  v-if="room.id === 'inbox' && stats.active > 0"
                  variant="type"
                  class="shrink-0 text-2xs px-1.5 py-0.5"
                >
                  {{ stats.active }}
                </Badge>
                <Badge
                  v-if="room.id === 'pinned' && stats.pinned > 0"
                  variant="category"
                  class="shrink-0 text-2xs px-1.5 py-0.5"
                >
                  {{ stats.pinned }}
                </Badge>
              </button>
            </li>
          </ul>
        </nav>

        <!-- Tags -->
        <nav class="space-y-2">
          <h3 class="px-1 text-2xs font-black uppercase tracking-wider opacity-60">Tags</h3>
          <div v-if="tagRooms.length === 0" class="px-3 py-6 text-center">
            <div class="space-y-2">
              <div class="text-3xl opacity-40">🏷️</div>
              <p class="text-xs font-bold opacity-60">
                No tags yet<br />
                Add <span class="text-accent-pink">#hashtags</span> in notes
              </p>
            </div>
          </div>
          <ul v-else class="space-y-1.5" role="list">
            <li v-for="room in tagRooms" :key="room.id">
              <button
                type="button"
                class="w-full group relative flex items-center gap-2.5 px-3 py-2.5 text-left font-bold text-sm rounded-md border-2 border-base-black dark:border-white transition-all duration-100 touch-manipulation"
                :class="[
                  room.id === activeRoom.id
                    ? 'bg-accent-yellow text-base-black shadow-hard-sm translate-x-0 translate-y-0'
                    : 'bg-base-white dark:bg-dark-bg-tertiary text-text-primary dark:text-dark-text-primary shadow-hard-sm hover:(-translate-x-0.5 -translate-y-0.5 shadow-hard) active:(translate-x-0 translate-y-0 shadow-hard-sm)'
                ]"
                @click="handleSelect(room)"
              >
                <span class="text-base leading-none">{{ room.icon }}</span>
                <span class="flex-1 truncate">{{ room.label }}</span>
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </div>

    <!-- Stats Footer -->
    <div class="shrink-0 p-3 border-t border-dashed border-base-black/20 dark:border-white/20">
      <div class="space-y-2">
        <h3 class="px-1 text-2xs font-black uppercase tracking-wider opacity-60">Stats</h3>
        <div class="flex flex-wrap gap-1.5">
          <Badge variant="type" class="text-2xs">
            Total {{ stats.total }}
          </Badge>
          <Badge variant="category" class="text-2xs">
            Active {{ stats.active }}
          </Badge>
          <Badge v-if="stats.pinned > 0" variant="tag" class="text-2xs">
            Pinned {{ stats.pinned }}
          </Badge>
        </div>
      </div>
    </div>
  </div>
</template>
