<script setup lang="ts">
import { computed } from "vue";
import type { Note } from "@/types/note";
import { getNoteContent } from "@/types/note";

const props = defineProps<{
  note: Note;
}>();

// Unified: content is HTML
const htmlContent = computed(() => getNoteContent(props.note));
</script>

<template>
  <div class="rich-text-viewer">
    <div class="viewer-content" v-html="htmlContent"></div>
  </div>
</template>

<style scoped>
.rich-text-viewer {
  padding: 12px;
}

.viewer-content {
  line-height: 1.6;
}

.viewer-content :deep(a) {
  color: #0066cc;
  text-decoration: underline;
}

.viewer-content :deep(a:hover) {
  color: #0052a3;
}

.viewer-content :deep(ul) {
  margin: 8px 0;
  padding-left: 24px;
}

.viewer-content :deep(li) {
  margin: 4px 0;
}

.viewer-content :deep(strong) {
  font-weight: 700;
}

.viewer-content :deep(em) {
  font-style: italic;
}

.viewer-content :deep(u) {
  text-decoration: underline;
}

.view-mode-notice {
  margin-top: 12px;
  padding: 12px;
  background: #fff3cd;
  border: 2px solid #000;
  border-left: 4px solid #ffc107;
  font-size: 12px;
  font-weight: 600;
  color: #856404;
}
</style>
