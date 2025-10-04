<template>
  <div class="image-viewer">
    <img
      v-if="note.url"
      :src="note.url"
      :alt="note.alt || 'Image'"
      :width="note.width"
      :height="note.height"
      class="viewer-image"
    />
    
    <div v-if="note.alt" class="image-caption">
      {{ note.alt }}
    </div>
    
    <div v-if="note.width && note.height" class="image-info">
      {{ note.width }} × {{ note.height }}px
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ImageNote } from "@/types/note";

const props = defineProps<{
  note: ImageNote;
}>();
</script>

<style scoped>
.image-viewer {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.viewer-image {
  width: 100%;
  height: auto;
  border: 2px solid #000;
  object-fit: contain;
  max-height: 600px;
}

.image-caption {
  padding: 8px 12px;
  background: #f0f0f0;
  border: 2px solid #000;
  font-style: italic;
  text-align: center;
}

.image-info {
  padding: 4px 8px;
  font-size: 12px;
  color: #666;
  text-align: center;
  font-family: "SF Mono", Monaco, monospace;
}
</style>
