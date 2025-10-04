<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import * as Y from 'yjs';
import type { TextNote } from '@/types/note';
import { getNoteContent } from '@/types/note';
import { useNotesStore } from '@/stores/notes';
import { useAuthStore } from '@/stores/auth';
import { useCollaborationDoc } from '@/composables/useCollaborationDoc';

const props = defineProps<{
  note: TextNote;
  readonly?: boolean;
}>();

const emit = defineEmits<{
  update: [updates: Partial<TextNote>];
}>();

const notesStore = useNotesStore();
const authStore = useAuthStore();

const { shouldSync } = storeToRefs(notesStore);

const collaborationEnabled = computed(
  () => !props.readonly && Boolean(shouldSync.value) && Boolean(authStore.state.baseUrl)
);

const localText = ref(getNoteContent(props.note)); // UNIFIED: use helper
const collaboration = useCollaborationDoc(`note-${props.note.id}`);
let yText: Y.Text | null = null;
let observer: ((event: Y.YTextEvent) => void) | null = null;
let stopWatchLocal: (() => void) | null = null;
let applyingRemote = false;

watch(
  () => getNoteContent(props.note), // UNIFIED: watch content
  (newText) => {
    if (!collaborationEnabled.value) {
      localText.value = newText;
    } else if (yText && newText !== yText.toString()) {
      const doc = collaboration.doc.value;
      if (doc) {
        doc.transact(() => {
          yText!.delete(0, yText!.length);
          if (newText.length > 0) {
            yText!.insert(0, newText);
          }
        });
      }
    }
  }
);

function debounce<T extends (...args: any[]) => void>(fn: T, delay = 400) {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => fn(...args), delay);
  };
}

const emitUpdate = debounce((text: string) => {
  if (props.readonly) return;
  emit('update', { content: text }); // UNIFIED: update content field
}, 450);

function setupCollaboration() {
  if (!authStore.state.baseUrl) return;
  collaboration.connect(authStore.state.baseUrl);

  const doc = collaboration.doc.value;
  if (!doc) return;

  tearDownCollaboration();

  const text = doc.getText('content');
  yText = text;

  const noteContent = getNoteContent(props.note); // UNIFIED
  if (text.length === 0 && noteContent) {
    text.insert(0, noteContent);
  }

  applyingRemote = true;
  localText.value = text.toString();
  applyingRemote = false;

  observer = () => {
    if (!yText) return;
    applyingRemote = true;
    const value = yText.toString();
    localText.value = value;
    emitUpdate(value);
    applyingRemote = false;
  };

  text.observe(observer);

  stopWatchLocal = watch(
    localText,
    (value) => {
      if (!collaborationEnabled.value || !yText) return;
      if (applyingRemote) return;
      const current = yText.toString();
      if (value === current) return;

      doc.transact(() => {
        yText!.delete(0, current.length);
        if (value.length > 0) {
          yText!.insert(0, value);
        }
      });
    },
    { flush: 'sync' }
  );
}

function tearDownCollaboration() {
  if (observer && yText) {
    yText.unobserve(observer);
  }
  observer = null;
  yText = null;

  if (stopWatchLocal) {
    stopWatchLocal();
    stopWatchLocal = null;
  }
}

watch(collaborationEnabled, (enabled) => {
  if (enabled) {
    setupCollaboration();
  } else {
    tearDownCollaboration();
    collaboration.disconnect();
    localText.value = getNoteContent(props.note); // UNIFIED
  }
}, { immediate: true });

watch(
  () => collaboration.doc.value,
  () => {
    if (collaborationEnabled.value) {
      setupCollaboration();
    }
  }
);

watch(
  () => authStore.state.baseUrl,
  (baseUrl) => {
    if (collaborationEnabled.value && baseUrl) {
      setupCollaboration();
    }
  }
);

onBeforeUnmount(() => {
  tearDownCollaboration();
  collaboration.dispose();
});

function handleUpdate() {
  if (props.readonly) return;
  if (collaborationEnabled.value) return;

  const currentContent = getNoteContent(props.note); // UNIFIED
  if (localText.value !== currentContent) {
    emit('update', { content: localText.value }); // UNIFIED
  }
}

const collaborationStatus = computed(() => collaboration.status.value);
</script>

<template>
  <div class="text-note-editor space-y-2">
    <textarea
      v-model="localText"
      :readonly="readonly"
      class="w-full min-h-[8rem] rounded border border-gray-300 bg-transparent p-3 focus:border-accent focus:outline-none dark:border-gray-600"
      placeholder="Write your note..."
      @blur="handleUpdate"
    />
    <p
      v-if="collaborationEnabled"
      class="text-xs font-semibold uppercase tracking-wide text-ink/60 dark:text-white/50"
    >
      Collaboration: {{ collaborationStatus }}
    </p>
  </div>
</template>

<style scoped>
.text-note-editor textarea {
  resize: vertical;
  font-family: inherit;
  line-height: 1.6;
}
</style>
