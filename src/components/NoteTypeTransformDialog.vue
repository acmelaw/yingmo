<template>
  <div class="transform-dialog-overlay" @click.self="$emit('close')">
    <div class="transform-dialog">
      <div class="dialog-header">
        <h3>Transform Note</h3>
        <button @click="$emit('close')" class="close-btn">✕</button>
      </div>

      <div class="current-type">
        <span class="label">Current Type:</span>
        <span class="type-badge">{{ getIcon(currentType) }} {{ currentType }}</span>
      </div>

      <div class="dialog-body">
        <p class="description">Transform this note into a different type:</p>
        
        <div class="type-grid">
          <button
            v-for="type in availableTypes"
            :key="type"
            @click="selectType(type)"
            :disabled="type === currentType"
            :class="['type-option', { disabled: type === currentType }]"
          >
            <span class="type-icon">{{ getIcon(type) }}</span>
            <span class="type-name">{{ type }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { NoteType } from '@/types/note';

const props = defineProps<{
  currentType: NoteType;
  availableTypes: NoteType[];
}>();

const emit = defineEmits<{
  (e: 'transform', toType: NoteType): void;
  (e: 'close'): void;
}>();

function getIcon(type: NoteType): string {
  const icons: Record<NoteType, string> = {
    text: '📝',
    markdown: '📄',
    code: '💻',
    'rich-text': '✏️',
    image: '🖼️',
    'smart-layer': '🤖',
  };
  return icons[type] || '📋';
}

function selectType(type: NoteType) {
  if (type !== props.currentType) {
    emit('transform', type);
  }
}
</script>

<style scoped>
.transform-dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
}

.transform-dialog {
  background: #fff;
  border: 3px solid #000;
  box-shadow: 8px 8px 0 rgba(0, 0, 0, 0.2);
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 2px solid #000;
  background: #f0f0f0;
}

.dialog-header h3 {
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

.current-type {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #fafafa;
  border-bottom: 2px solid #000;
}

.label {
  font-weight: 600;
  font-size: 14px;
}

.type-badge {
  padding: 6px 12px;
  background: #fff;
  border: 2px solid #000;
  font-weight: 600;
  font-size: 14px;
}

.dialog-body {
  padding: 16px;
}

.description {
  margin: 0 0 16px 0;
  font-size: 14px;
  color: #666;
}

.type-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
}

.type-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px;
  background: #fff;
  border: 2px solid #000;
  cursor: pointer;
  transition: all 0.2s;
}

.type-option:hover:not(.disabled) {
  background: #f0f0f0;
  transform: translate(-2px, -2px);
  box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.1);
}

.type-option:active:not(.disabled) {
  transform: translate(0, 0);
  box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.1);
}

.type-option.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #f0f0f0;
}

.type-icon {
  font-size: 32px;
}

.type-name {
  font-size: 13px;
  font-weight: 600;
  text-transform: capitalize;
}
</style>
