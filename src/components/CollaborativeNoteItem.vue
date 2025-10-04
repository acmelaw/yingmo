<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import CollaborativeEditor from "./CollaborativeEditor.vue";
import { useCollaboration } from "@/composables/useCollaboration";
import { useNotesStore } from "@/stores/notesCollaborative";
import type { Note } from "@/stores/notesCollaborative";

interface Props {
  note: Note;
  username?: string;
  userColor?: string;
}

const props = withDefaults(defineProps<Props>(), {
  username: "Anonymous",
  userColor: "#ff6b6b",
});

const emit = defineEmits<{
  (e: "update", content: string): void;
  (e: "delete"): void;
  (e: "enableCollab"): void;
  (e: "disableCollab"): void;
}>();

const { t } = useI18n();
const store = useNotesStore();

const isExpanded = ref(false);
const showCollabInfo = ref(false);

// Setup collaboration if note is collaborative
const collaboration = computed(() => {
  if (!props.note.isCollaborative) return null;

  const ydoc = store.getCollaborativeDoc(props.note.id);
  if (!ydoc) return null;

  return useCollaboration({
    roomId: props.note.id,
    username: props.username,
    userColor: props.userColor,
  });
});

const isCollabConnected = computed(
  () => collaboration.value?.state.isConnected.value ?? false
);
const activeUsers = computed(
  () => collaboration.value?.state.activeUsers.value ?? 0
);
const collabError = computed(
  () => collaboration.value?.state.error.value ?? null
);

const createdAt = computed(() => new Date(props.note.created));
const updatedAt = computed(() => new Date(props.note.updated));
const timeLabel = computed(() =>
  new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(props.note.updated > props.note.created ? updatedAt.value : createdAt.value)
);
const titleLabel = computed(() => createdAt.value.toLocaleString());
const wasUpdated = computed(() => props.note.updated > props.note.created);

const handleUpdate = (content: string) => {
  store.update(props.note.id, { richContent: content });
  emit("update", content);
};

const handleEnableCollab = () => {
  store.enableCollaborativeEditing(props.note.id);
  emit("enableCollab");
};

const handleDisableCollab = () => {
  if (confirm("Disable collaborative editing for this note?")) {
    store.disableCollaborativeEditing(props.note.id);
    emit("disableCollab");
  }
};
</script>

<template>
  <article class="collaborative-note-item">
    <!-- Header -->
    <div class="note-header flex items-center justify-between gap-3 mb-2">
      <div class="flex items-center gap-2 flex-1">
        <!-- Category and tags -->
        <div v-if="note.category || note.tags?.length" class="flex flex-wrap gap-2">
          <span
            v-if="note.category"
            class="inline-block rounded bg-ink/10 px-2 py-0.5 text-[0.65rem] font-medium dark:bg-white/10"
          >
            {{ note.category }}
          </span>
          <span
            v-for="tag in note.tags"
            :key="tag"
            class="inline-block rounded bg-accent/20 px-2 py-0.5 text-[0.65rem] font-medium"
          >
            #{{ tag }}
          </span>
        </div>

        <!-- Collaboration status -->
        <div v-if="note.isCollaborative" class="collab-status flex items-center gap-2">
          <span
            :class="[
              'status-indicator',
              isCollabConnected ? 'connected' : 'disconnected',
            ]"
            :title="isCollabConnected ? 'Connected' : 'Disconnected'"
          ></span>
          <button
            @click="showCollabInfo = !showCollabInfo"
            class="text-xs opacity-70 hover:opacity-100"
          >
            {{ activeUsers }} {{ activeUsers === 1 ? "user" : "users" }} online
          </button>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex items-center gap-2">
        <button
          v-if="!note.isCollaborative && store.enableCollaboration"
          @click="handleEnableCollab"
          class="chip-brutal px-3 py-1 text-xs"
          title="Enable collaborative editing"
        >
          🤝 Collaborate
        </button>
        <button
          v-else-if="note.isCollaborative"
          @click="handleDisableCollab"
          class="chip-brutal px-3 py-1 text-xs"
          title="Disable collaborative editing"
        >
          ❌ Stop Collab
        </button>
        <button
          @click="isExpanded = !isExpanded"
          class="chip-brutal px-3 py-1 text-xs"
        >
          {{ isExpanded ? "−" : "+" }}
        </button>
        <button
          class="btn-brutal grid h-8 w-8 place-items-center text-sm"
          type="button"
          :aria-label="t('delete')"
          @click="emit('delete')"
        >
          ×
        </button>
      </div>
    </div>

    <!-- Collaboration info -->
    <div
      v-if="showCollabInfo && note.isCollaborative"
      class="collab-info surface mb-2 p-3 text-xs"
    >
      <div class="grid gap-1">
        <div>Status: {{ isCollabConnected ? "✅ Connected" : "❌ Disconnected" }}</div>
        <div>Active users: {{ activeUsers }}</div>
        <div v-if="collabError" class="text-red-600">Error: {{ collabError }}</div>
        <div class="text-[0.6rem] opacity-70">
          Room ID: {{ note.id }}
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="note-content mb-2">
      <template v-if="isExpanded && note.isCollaborative && collaboration">
        <!-- Collaborative rich text editor -->
        <CollaborativeEditor
          :ydoc="collaboration.doc"
          :field-name="'content'"
          :placeholder="t('placeholder')"
          :username="username"
          :user-color="userColor"
          :editable="true"
          @update="handleUpdate"
        />
      </template>
      <template v-else-if="isExpanded && !note.isCollaborative">
        <!-- Simple text editor (non-collaborative) -->
        <div class="simple-editor surface p-3">
          <textarea
            :value="note.text"
            @input="
              (e) =>
                store.update(note.id, {
                  text: (e.target as HTMLTextAreaElement).value,
                })
            "
            class="w-full min-h-[150px] resize-none bg-transparent outline-none"
            :placeholder="t('placeholder')"
          ></textarea>
        </div>
      </template>
      <template v-else>
        <!-- Collapsed view -->
        <div
          class="preview bubble-surface px-3 py-3 cursor-pointer"
          @click="isExpanded = true"
        >
          <div
            v-if="note.richContent"
            v-html="note.richContent"
            class="prose prose-sm max-w-none"
          ></div>
          <p
            v-else
            class="whitespace-pre-wrap break-words text-sm leading-relaxed md:text-base"
          >
            {{ note.text }}
          </p>
        </div>
      </template>
    </div>

    <!-- Footer -->
    <div class="note-footer flex items-center justify-between text-xs opacity-70">
      <time
        :datetime="(wasUpdated ? updatedAt : createdAt).toISOString()"
        :title="titleLabel"
      >
        {{ timeLabel }}{{ wasUpdated ? " (edited)" : "" }}
      </time>
      <span v-if="note.isCollaborative" class="collab-badge">
        🤝 Collaborative
      </span>
    </div>
  </article>
</template>

<style scoped>
.collaborative-note-item {
  padding: 1rem;
  border: 2px solid var(--ink, #101112);
  border-radius: 6px;
  background: var(--panel, #ffffff);
  margin-bottom: 1rem;
}

.dark .collaborative-note-item {
  background: var(--panel-dark, #2a2a2a);
  border-color: #404040;
}

.status-indicator {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.status-indicator.connected {
  background-color: #00b894;
}

.status-indicator.disconnected {
  background-color: #d63031;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.collab-info {
  background: rgba(76, 209, 196, 0.1);
  border: 1px solid rgba(76, 209, 196, 0.3);
}

.preview:hover {
  opacity: 0.9;
}

.prose {
  max-width: none;
}

.prose :deep(h1),
.prose :deep(h2),
.prose :deep(h3) {
  margin-top: 0.5em;
  margin-bottom: 0.25em;
}

.prose :deep(p) {
  margin: 0.5em 0;
}

.prose :deep(ul),
.prose :deep(ol) {
  padding-left: 1.5em;
}

.collab-badge {
  font-size: 0.65rem;
  padding: 0.15rem 0.4rem;
  background: rgba(76, 209, 196, 0.2);
  border-radius: 3px;
}
</style>
