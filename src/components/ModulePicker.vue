<template>
  <div class="module-picker">
    <div class="picker-header">
      <h3>Create New Note</h3>
      <button @click="$emit('close')" class="close-btn">✕</button>
    </div>

    <div class="module-grid">
      <button
        v-for="module in availableModules"
        :key="module.id"
        @click="selectModule(module)"
        class="module-card"
      >
        <div class="module-icon">{{ getIcon(module.supportedTypes[0]) }}</div>
        <div class="module-info">
          <strong class="module-name">{{ module.name }}</strong>
          <p class="module-desc">{{ module.description }}</p>
        </div>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { moduleRegistry } from "@/core/ModuleRegistry";
import type { NoteType } from "@/types/note";

const emit = defineEmits<{
  (e: "select", noteType: NoteType): void;
  (e: "close"): void;
}>();

const availableModules = computed(() => {
  return moduleRegistry
    .getAllModules()
    .filter((m) => m.capabilities?.canCreate !== false);
});

function selectModule(module: any) {
  const noteType = module.supportedTypes[0] as NoteType;
  emit("select", noteType);
}

function getIcon(type: NoteType): string {
  const icons: Record<NoteType, string> = {
    text: "📝",
    markdown: "📄",
    code: "💻",
    "rich-text": "✏️",
    image: "🖼️",
    "smart-layer": "🤖",
  };
  return icons[type] || "📋";
}
</script>

<style scoped>
.module-picker {
  background: #fff;
  border: 3px solid #000;
  box-shadow: 8px 8px 0 rgba(0, 0, 0, 0.2);
  max-width: 600px;
  width: 100%;
}

.picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 2px solid #000;
  background: #f0f0f0;
}

.picker-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.close-btn:hover {
  transform: scale(1.2);
  color: #c00;
}

.module-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 12px;
  padding: 16px;
}

.module-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: #fff;
  border: 2px solid #000;
  cursor: pointer;
  text-align: left;
  transition: all 0.2s;
}

.module-card:hover {
  background: #f0f0f0;
  transform: translate(-2px, -2px);
  box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.1);
}

.module-card:active {
  transform: translate(0, 0);
  box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.1);
}

.module-icon {
  font-size: 32px;
  flex-shrink: 0;
}

.module-info {
  flex: 1;
  min-width: 0;
}

.module-name {
  display: block;
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 4px;
}

.module-desc {
  margin: 0;
  font-size: 13px;
  color: #666;
  line-height: 1.4;
}
</style>
