<template>
  <div class="smart-layer-editor">
    <div class="source-section">
      <h3 class="section-title">Source Content</h3>

      <select v-model="sourceType" @change="handleSourceTypeChange" class="source-type-select">
        <option value="text">Text</option>
        <option value="image">Image</option>
        <option value="url">URL</option>
      </select>

      <textarea
        v-if="sourceType === 'text'"
        v-model="sourceData"
        @input="handleSourceChange"
        placeholder="Enter source text..."
        class="source-input"
      ></textarea>

      <input
        v-else-if="sourceType === 'url'"
        v-model="sourceData"
        @input="handleSourceChange"
        placeholder="Enter URL..."
        class="source-input"
        type="url"
      />

      <div v-else class="placeholder-box">
        Image upload coming soon
      </div>
    </div>

    <div class="layers-section">
      <div class="section-header">
        <h3 class="section-title">Smart Layers</h3>
        <button @click="addLayer" class="add-layer-btn">+ Add Layer</button>
      </div>

      <div v-if="localLayers.length === 0" class="empty-state">
        No layers yet. Add a layer to transform your content with AI.
      </div>

      <div v-else class="layers-list">
        <div
          v-for="layer in localLayers"
          :key="layer.id"
          :class="{ active: layer.id === activeLayerId }"
          class="layer-card"
          @click="setActiveLayer(layer.id)"
        >
          <div class="layer-header">
            <strong>{{ layer.name }}</strong>
            <span class="layer-type">{{ layer.type }}</span>
          </div>

          <div v-if="layer.result" class="layer-result">
            {{ truncate(String(layer.result), 100) }}
          </div>

          <div v-else class="layer-pending">
            Not yet processed
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import type { SmartLayerNote, SmartLayer } from "@/types/note";

const props = defineProps<{
  note: SmartLayerNote;
}>();

const emit = defineEmits<{
  (e: "update", updates: Partial<SmartLayerNote>): void;
}>();

const sourceType = ref(props.note.source.type);
const sourceData = ref(props.note.source.data);
const localLayers = ref<SmartLayer[]>([...props.note.layers]);
const activeLayerId = ref(props.note.activeLayerId);

function handleSourceTypeChange() {
  sourceData.value = "";
  emit("update", {
    source: {
      type: sourceType.value as any,
      data: sourceData.value,
    },
  });
}

function handleSourceChange() {
  emit("update", {
    source: {
      type: sourceType.value as any,
      data: sourceData.value,
    },
  });
}

function addLayer() {
  const newLayer: SmartLayer = {
    id: crypto.randomUUID(),
    name: `Layer ${localLayers.value.length + 1}`,
    type: "summarize",
    config: {},
    cached: false,
    timestamp: Date.now(),
  };

  localLayers.value.push(newLayer);
  emit("update", { layers: localLayers.value });
}

function setActiveLayer(layerId: string) {
  activeLayerId.value = layerId;
  emit("update", { activeLayerId: layerId });
}

function truncate(str: string, length: number): string {
  return str.length > length ? str.substring(0, length) + "..." : str;
}

// Watch for external updates
watch(
  () => props.note.source,
  (newValue) => {
    sourceType.value = newValue.type;
    sourceData.value = newValue.data;
  },
  { deep: true }
);

watch(
  () => props.note.layers,
  (newValue) => {
    localLayers.value = [...newValue];
  },
  { deep: true }
);
</script>

<style scoped>
.smart-layer-editor {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 400px;
}

.source-section,
.layers-section {
  border: 2px solid #000;
  padding: 12px;
}

.section-title {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 700;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.source-type-select {
  width: 100%;
  padding: 8px 12px;
  border: 2px solid #000;
  background: #fff;
  margin-bottom: 8px;
  font-weight: 500;
}

.source-input {
  width: 100%;
  padding: 12px;
  border: 2px solid #000;
  font-family: inherit;
  min-height: 120px;
  resize: vertical;
}

.source-input:focus {
  outline: none;
  box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.1);
}

.placeholder-box {
  padding: 48px;
  border: 2px dashed #000;
  text-align: center;
  color: #666;
  background: #fafafa;
}

.add-layer-btn {
  padding: 6px 12px;
  background: #000;
  color: #fff;
  border: 2px solid #000;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
}

.add-layer-btn:hover {
  background: #333;
}

.empty-state {
  padding: 32px;
  text-align: center;
  color: #666;
  border: 2px dashed #ccc;
  background: #fafafa;
}

.layers-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.layer-card {
  padding: 12px;
  border: 2px solid #000;
  background: #fff;
  cursor: pointer;
  transition: all 0.2s;
}

.layer-card:hover {
  background: #f0f0f0;
}

.layer-card.active {
  background: #000;
  color: #fff;
}

.layer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.layer-type {
  padding: 2px 8px;
  background: #f0f0f0;
  border: 1px solid #000;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.layer-card.active .layer-type {
  background: #fff;
  color: #000;
}

.layer-result {
  font-size: 14px;
  line-height: 1.4;
}

.layer-pending {
  font-size: 14px;
  font-style: italic;
  opacity: 0.6;
}
</style>
