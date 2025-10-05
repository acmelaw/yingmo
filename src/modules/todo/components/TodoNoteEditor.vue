<template>
  <div class="todo-editor">
    <textarea
      v-model="localContent"
      class="w-full px-3 py-2 min-h-[120px] font-mono text-sm bg-base-white dark:bg-dark-bg-tertiary text-base-black dark:text-dark-text-primary border-2 border-base-black dark:border-white rounded resize-y outline-none focus:border-accent-green"
      placeholder="[ ] Task 1&#10;[x] Task 2 (done)&#10;[ ] Task 3"
      @blur="handleUpdate"
    />
    <div class="text-2xs opacity-60 mt-1">
      Format: <code>[ ] task</code> or <code>[x] done task</code>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import type { TodoNote } from '@/types/note';

const props = defineProps<{
  note: TodoNote;
}>();

const emit = defineEmits<{
  (e: 'update', updates: Partial<TodoNote>): void;
}>();

const localContent = ref(props.note.content || '');

watch(() => props.note.content, (newContent) => {
  localContent.value = newContent || '';
});

function handleUpdate() {
  if (localContent.value !== props.note.content) {
    emit('update', { content: localContent.value });
  }
}
</script>

<style scoped>
code {
  padding: 0.125rem 0.25rem;
  background: var(--color-accent-yellow);
  border-radius: 2px;
  font-family: 'Monaco', 'Courier New', monospace;
}
</style>
