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
import { ref, computed, watch } from "vue";
import type { SmartLayerNote, SmartLayer } from "@/types/note";
import { getNoteContent, getNoteMeta } from "@/types/note";

const props = defineProps<{
  note: SmartLayerNote;
}>();

const emit = defineEmits<{
  update: [data: Partial<SmartLayerNote>];
}>();

const localSource = ref(getNoteMeta<any>(props.note, 'source', { type: 'text', data: '' }));
const localLayers = ref<SmartLayer[]>(getNoteMeta<SmartLayer[]>(props.note, 'layers', []) || []);
const activeLayerId = ref<string | undefined>(getNoteMeta<string>(props.note, 'activeLayerId') || localLayers.value[0]?.id);

watch(
  () => getNoteMeta<any>(props.note, 'source'),
  (newSource) => {
    localSource.value = newSource;
  }
);

watch(
  () => getNoteMeta<SmartLayer[]>(props.note, 'layers'),
  (newLayers) => {
    localLayers.value = newLayers || [];
  }
);

watch(
  () => getNoteMeta<string>(props.note, 'activeLayerId'),
  (newId) => {
    if (newId) activeLayerId.value = newId;
  }
);

function addLayer() {
  const newLayer: SmartLayer = {
    id: `layer-${Date.now()}`,
    name: `Layer ${localLayers.value.length + 1}`,
    type: "text",
    config: {},
  } as any;
  localLayers.value.push(newLayer);
  emit("update", {
    metadata: {
      ...props.note.metadata,
      layers: localLayers.value
    }
  });
}

function setActiveLayer(id: string) {
  activeLayerId.value = id;
  emit("update", {
    metadata: {
      ...props.note.metadata,
      activeLayerId: id
    }
  });
}

function updateLayerData(id: string, data: any) {
  const layer = localLayers.value.find((l: SmartLayer) => l.id === id);
  if (layer) {
    layer.config = { ...(layer.config || {}), data } as any;
    emit("update", {
      metadata: {
        ...props.note.metadata,
        layers: localLayers.value
      }
    });
  }
}

const sourceType = computed(() => localSource.value?.type || 'text');
const sourceData = computed({
  get: () => localSource.value?.data || '',
  set: (value) => {
    localSource.value = { ...localSource.value, data: value };
  }
});

function handleSourceChange() {
  emit("update", {
    metadata: {
      ...props.note.metadata,
      source: localSource.value
    }
  });
}

function handleSourceTypeChange() {
  localSource.value = {
    type: sourceType.value,
    data: ''
  };
  handleSourceChange();
}

function truncate(text: string, length: number): string {
  return text.length > length ? text.substring(0, length) + '...' : text;
}
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
