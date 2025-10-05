<template>
  <div class="transform-dialog-overlay" @click.self="$emit('close')">
    <div class="transform-dialog">
      <div class="dialog-header">
        <h3 class="dialog-title">🔄 Change View Mode</h3>
        <button @click="$emit('close')" class="close-btn" aria-label="Close">✕</button>
      </div>

      <div class="current-type">
        <span class="label">Original Type:</span>
        <span class="type-badge">{{ getIcon(currentType) }} {{ formatTypeName(currentType) }}</span>
      </div>

      <div class="dialog-body">
        <p class="description">
          Choose how to display this note. The original data is preserved and you can switch back anytime.
        </p>

        <div class="type-grid">
          <button
            v-for="type in availableTypes"
            :key="type"
            @click="selectType(type)"
            :disabled="type === currentType"
            :class="['type-option', {
              disabled: type === currentType,
              active: type === currentType
            }]"
          >
            <span class="type-icon">{{ getIcon(type) }}</span>
            <span class="type-name">{{ formatTypeName(type) }}</span>
            <span v-if="type === currentType" class="current-indicator">✓ Current</span>
          </button>
        </div>

        <div class="dialog-footer">
          <p class="help-text">
            💡 This is a <strong>lossless transformation</strong> - your original data stays intact.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { NoteType } from '@/types/note';

const props = defineProps<{
  currentType: NoteType | string;
  availableTypes: (NoteType | string)[];
}>();

const emit = defineEmits<{
  (e: 'transform', toType: NoteType | string): void;
  (e: 'close'): void;
}>();

function getIcon(type: NoteType | string): string {
  const icons: Record<string, string> = {
    text: '📝',
    markdown: '📄',
    code: '💻',
    'rich-text': '✏️',
    image: '🖼️',
    'smart-layer': '🤖',
    'caesar-cipher': '🔐',
  };
  return icons[type] || '📋';
}

function formatTypeName(type: NoteType | string): string {
  const names: Record<string, string> = {
    text: 'Text',
    markdown: 'Markdown',
    code: 'Code',
    'rich-text': 'Rich Text',
    image: 'Image',
    'smart-layer': 'Smart Layer',
    'caesar-cipher': 'Caesar Cipher',
  };
  return names[type] || type;
}

function selectType(type: NoteType | string) {
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
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
}

.transform-dialog {
  background: #fff;
  border: 3px solid #000;
  box-shadow: 8px 8px 0 rgba(0, 0, 0, 0.3);
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  animation: slideUp 0.2s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 3px solid #000;
  background: #000;
  color: #fff;
}

.dialog-title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
}

.close-btn {
  background: #fff;
  border: 2px solid #fff;
  color: #000;
  font-size: 20px;
  cursor: pointer;
  padding: 4px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  font-weight: 700;
}

.close-btn:hover {
  transform: scale(1.1);
  background: #f00;
  color: #fff;
  border-color: #f00;
}

.current-type {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: #f5f5f5;
  border-bottom: 2px solid #000;
}

.label {
  font-weight: 700;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.type-badge {
  padding: 8px 16px;
  background: #fff;
  border: 2px solid #000;
  font-weight: 700;
  font-size: 14px;
  box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.2);
}

.dialog-body {
  padding: 20px;
}

.description {
  margin: 0 0 20px 0;
  font-size: 14px;
  line-height: 1.5;
  color: #333;
}

.type-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}

.type-option {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px 16px;
  background: #fff;
  border: 3px solid #000;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 600;
}

.type-option:hover:not(.disabled):not(.active) {
  background: #f0f0f0;
  transform: translate(-3px, -3px);
  box-shadow: 5px 5px 0 rgba(0, 0, 0, 0.2);
}

.type-option.active {
  background: #000;
  color: #fff;
  cursor: default;
}

.type-option.disabled:not(.active) {
  opacity: 0.3;
  cursor: not-allowed;
  background: #fafafa;
}

.type-icon {
  font-size: 32px;
  line-height: 1;
}

.type-name {
  font-size: 13px;
  text-transform: capitalize;
}

.current-indicator {
  position: absolute;
  top: 8px;
  right: 8px;
  font-size: 10px;
  font-weight: 700;
  background: #fff;
  color: #000;
  padding: 2px 6px;
  border-radius: 2px;
}

.dialog-footer {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 2px solid #e0e0e0;
}

.help-text {
  margin: 0;
  font-size: 12px;
  color: #666;
  line-height: 1.5;
  background: #f9f9f9;
  padding: 12px;
  border-left: 3px solid #000;
}

.help-text strong {
  color: #000;
  font-weight: 700;
}
</style>
