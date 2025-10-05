<script setup lang="ts">
import { computed } from "vue";
import type { Note } from "@/types/note";
import { getNoteContent, getNoteMeta } from "@/types/note";

const props = defineProps<{
  note: Note;
}>();

// Unified: content is the URL
const imageUrl = computed(() => getNoteContent(props.note));
const imageAlt = computed(() => getNoteMeta<string>(props.note, 'alt'));
const imageWidth = computed(() => getNoteMeta<number>(props.note, 'width'));
const imageHeight = computed(() => getNoteMeta<number>(props.note, 'height'));
</script>

<template>
  <div class="image-viewer">
    <img
      v-if="imageUrl"
      :src="imageUrl"
      :alt="imageAlt || 'Image'"
      :width="imageWidth"
      :height="imageHeight"
      class="viewer-image"
    />

    <div v-else class="no-image">
      <div class="no-image-icon">🖼️</div>
      <p>No image URL provided</p>
    </div>

    <div v-if="imageAlt" class="image-caption">
      {{ imageAlt }}
    </div>

    <div v-if="imageWidth && imageHeight" class="image-info">
      {{ imageWidth }} × {{ imageHeight }}px
    </div>
  </div>
</template>

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

.no-image {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  border: 2px dashed #ccc;
  background: #fafafa;
  text-align: center;
  color: #666;
}

.no-image-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.no-image p {
  margin: 0;
  font-size: 14px;
  max-width: 400px;
  word-break: break-word;
}

.view-mode-notice {
  padding: 12px;
  background: #fff3cd;
  border: 2px solid #000;
  border-left: 4px solid #ffc107;
  font-size: 12px;
  font-weight: 600;
  color: #856404;
}
</style>
