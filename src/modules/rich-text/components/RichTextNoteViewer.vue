<template>
  <div class="rich-text-viewer">
    <div class="viewer-content" v-html="note.html"></div>
  </div>
</template>

<script setup lang="ts">
import type { RichTextNote } from "@/types/note";

const props = defineProps<{
  note: RichTextNote;
}>();
</script>

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
</style>
