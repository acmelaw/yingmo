<script setup lang="ts">
import { computed } from "vue";
import type { Note } from "@/types/note";
import { getNoteContent } from "@/types/note";

const props = defineProps<{
  note: Note;
}>();

// UNIFIED: Just get content from any note type!
// No need to check types or extract from different fields
const originalText = computed(() => getNoteContent(props.note));

const encryptedText = computed(() => {
  return rot13(originalText.value);
});

function rot13(text: string): string {
  return text.replace(/[a-zA-Z]/g, (char) => {
    const base = char <= 'Z' ? 65 : 97;
    return String.fromCharCode(((char.charCodeAt(0) - base + 13) % 26) + base);
  });
}
</script>

<template>
  <div class="caesar-cipher-viewer">
    <div class="cipher-container">
      <div class="cipher-section">
        <h3>🔓 Original Text</h3>
        <div class="text-content">
          {{ originalText }}
        </div>
      </div>

      <div class="cipher-arrow">
        ROT13 →
      </div>

      <div class="cipher-section encrypted">
        <h3>🔐 Encrypted Text</h3>
        <div class="text-content">
          {{ encryptedText }}
        </div>
      </div>
    </div>

    <div class="cipher-hint">
      💡 ROT13 is a simple letter substitution cipher that replaces each letter with the letter 13 positions after it in the alphabet.
    </div>
  </div>
</template>

<style scoped>
.caesar-cipher-viewer {
  padding: 16px;
}

.cipher-container {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 16px;
  align-items: start;
  margin-bottom: 16px;
}

@media (max-width: 768px) {
  .cipher-container {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .cipher-arrow {
    text-align: center;
    transform: rotate(90deg);
  }
}

.cipher-section {
  border: 2px solid #000;
  padding: 16px;
  background: #fff;
}

.cipher-section.encrypted {
  background: #1a1a1a;
  color: #00ff00;
  font-family: 'Courier New', monospace;
}

.cipher-section h3 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.text-content {
  line-height: 1.6;
  word-wrap: break-word;
  white-space: pre-wrap;
}

.cipher-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: bold;
  color: #666;
  padding: 16px 0;
}

.cipher-hint {
  padding: 12px;
  background: #fff3cd;
  border: 2px solid #000;
  border-left: 4px solid #ffc107;
  font-size: 12px;
  line-height: 1.5;
  color: #856404;
}
</style>
