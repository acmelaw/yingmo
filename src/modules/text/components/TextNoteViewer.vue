<script setup lang="ts">
import type { TextNote } from '@/types/note';

defineProps<{
  note: TextNote;
}>();
</script>

<template>
  <div class="text-note-viewer">
    <p class="whitespace-pre-wrap break-words text-sm leading-relaxed md:text-base">
      {{ note.text }}
    </p>
  </div>
</template>
