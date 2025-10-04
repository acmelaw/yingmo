<template>
  <div class="smart-layer-viewer">
    <div class="source-display">
      <h3 class="section-title">Source ({{ note.source.type }})</h3>
      <div class="source-content">
        {{ note.source.data }}
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

    <div v-if="note.layers.length > 1" class="layers-nav">
      <button
        v-for="layer in note.layers"
        :key="layer.id"
        @click="$emit('setActiveLayer', layer.id)"
        :class="{ active: layer.id === note.activeLayerId }"
        class="layer-nav-btn"
      >
        {{ layer.name }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { SmartLayerNote } from "@/types/note";

const props = defineProps<{
  note: SmartLayerNote;
}>();

defineEmits<{
  (e: "setActiveLayer", layerId: string): void;
}>();

const activeLayer = computed(() => {
  return props.note.layers.find((l) => l.id === props.note.activeLayerId) || props.note.layers[0];
});
</script>

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
</style>
