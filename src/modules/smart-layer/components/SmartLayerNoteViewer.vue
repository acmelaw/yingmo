<script setup lang="ts">
import { computed } from "vue";
import type { Note } from "@/types/note";
import { getNoteContent, getNoteMeta } from "@/types/note";

const props = defineProps<{
  note: Note;
}>();

defineEmits<{
  (e: "setActiveLayer", layerId: string): void;
}>();

// Unified: metadata contains the smart layer data
const source = computed(() => getNoteMeta(props.note, 'source', { type: 'unknown', data: '' }));
const layers = computed(() => getNoteMeta<any[]>(props.note, 'layers', []));
const activeLayerId = computed(() => getNoteMeta<string>(props.note, 'activeLayerId'));

const sourceType = computed(() => source.value?.type || 'unknown');
const sourceData = computed(() => source.value?.data || getNoteContent(props.note));

const activeLayer = computed(() => {
  const layerList = layers.value || [];
  return layerList.find((l: any) => l.id === activeLayerId.value) || layerList[0];
});
</script>

<template>
  <div class="smart-layer-viewer">
    <div class="source-display">
      <h3 class="section-title">Source ({{ sourceType }})</h3>
      <div class="source-content">
        {{ sourceData }}
      </div>
    </div>

    <div v-if="activeLayer" class="active-layer-display">
      <h3 class="section-title">{{ activeLayer.name }}</h3>
      <div class="layer-content">
        <div v-if="activeLayer.result" class="result-content">
          {{ activeLayer.result }}
        </div>
        <div v-else class="no-result">
          This layer has not been processed yet.
        </div>
      </div>
    </div>

    <div v-if="layers && layers.length > 1" class="layers-nav">
      <button
        v-for="layer in layers"
        :key="layer.id"
        @click="$emit('setActiveLayer', layer.id)"
        :class="{ active: layer.id === activeLayerId }"
        class="layer-nav-btn"
      >
        {{ layer.name }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.smart-layer-viewer {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.source-display,
.active-layer-display {
  border: 2px solid #000;
  padding: 12px;
}

.section-title {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.source-content,
.layer-content {
  line-height: 1.6;
}

.result-content {
  padding: 12px;
  background: #fafafa;
  border: 2px solid #000;
}

.no-result {
  padding: 24px;
  text-align: center;
  color: #666;
  font-style: italic;
  border: 2px dashed #ccc;
  background: #fafafa;
}

.layers-nav {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.layer-nav-btn {
  padding: 8px 16px;
  background: #fff;
  border: 2px solid #000;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.layer-nav-btn:hover {
  background: #f0f0f0;
}

.layer-nav-btn.active {
  background: #000;
  color: #fff;
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
