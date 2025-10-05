<script setup lang="ts">
import { computed } from "vue";
import type { Note } from "@/types/note";
import { getNoteContent } from "@/types/note";

const props = defineProps<{
  note: Note;
}>();

// Simple: just extract content from any note
const textContent = computed(() => getNoteContent(props.note));
</script>

<template>
  <div class="text-viewer">
    <div class="text-content whitespace-pre-wrap">{{ textContent }}</div>
  </div>
</template>

<style scoped>
.view-mode-notice {
  margin-bottom: 12px;
  padding: 12px;
  background: #fff3cd;
  border: 2px solid #000;
  border-left: 4px solid #ffc107;
  font-size: 12px;
  font-weight: 600;
  color: #856404;
}
</style>
