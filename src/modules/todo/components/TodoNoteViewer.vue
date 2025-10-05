<template>
  <div class="todo-viewer space-y-2">
    <div
      v-for="item in items"
      :key="item.id"
      class="flex items-start gap-2 group cursor-pointer p-2 rounded hover:bg-base-white/50 dark:hover:bg-dark-bg-secondary/50 transition-colors"
      @click="toggleItem(item.id)"
    >
      <!-- Checkbox -->
      <button
        class="shrink-0 w-5 h-5 border-2 border-base-black dark:border-white rounded flex items-center justify-center transition-all duration-150"
        :class="item.done ? 'bg-accent-green' : 'bg-base-white dark:bg-dark-bg-tertiary'"
        @click.stop="toggleItem(item.id)"
      >
        <span v-if="item.done" class="text-xs">✓</span>
      </button>

      <!-- Text -->
      <span
        class="flex-1 font-bold text-sm sm:text-base"
        :class="item.done ? 'line-through opacity-60' : ''"
      >
        {{ item.text }}
      </span>
    </div>

    <!-- Empty state -->
    <div v-if="items.length === 0" class="text-center py-4 opacity-60 text-sm">
      No tasks yet
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { TodoNote, TodoItem } from '@/types/note';

const props = defineProps<{
  note: TodoNote;
}>();

const emit = defineEmits<{
  (e: 'update', updates: Partial<TodoNote>): void;
}>();

const items = computed(() => props.note.items || []);

function toggleItem(id: string) {
  const updatedItems = items.value.map(item =>
    item.id === id ? { ...item, done: !item.done } : item
  );
  emit('update', { items: updatedItems } as any);
}
</script>

<style scoped>
.todo-viewer {
  padding: 0.5rem 0;
}
</style>
