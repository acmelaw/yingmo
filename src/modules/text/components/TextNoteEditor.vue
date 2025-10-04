<script setup lang="ts">
import { ref, watch } from 'vue';
import type { TextNote } from '@/types/note';

const props = defineProps<{
  note: TextNote;
  readonly?: boolean;
}>();

const emit = defineEmits<{
  update: [updates: Partial<TextNote>];
}>();

const localText = ref(props.note.text);

watch(() => props.note.text, (newText) => {
  localText.value = newText;
});

function handleUpdate() {
  if (props.readonly) return;
  
  if (localText.value !== props.note.text) {
    emit('update', { text: localText.value });
  }
}
</script>

<template>
  <div class="text-note-editor">
    <textarea
      v-model="localText"
      :readonly="readonly"
      class="w-full min-h-[8rem] p-3 rounded bg-transparent border border-gray-300 dark:border-gray-600 focus:border-accent focus:outline-none"
      placeholder="Write your note..."
      @blur="handleUpdate"
    />
  </div>
</template>

<style scoped>
.text-note-editor textarea {
  resize: vertical;
  font-family: inherit;
  line-height: 1.6;
}
</style>
