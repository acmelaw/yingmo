<template>
  <div class="image-editor">
    <div v-if="!imageUrl" class="upload-area">
      <input
        ref="fileInputRef"
        type="file"
        accept="image/*"
        @change="handleFileSelect"
        class="file-input"
        hidden
      />

      <div
        @click="triggerFileInput"
        @dragover.prevent
        @drop.prevent="handleDrop"
        class="drop-zone"
      >
        <div class="upload-icon">📷</div>
        <p class="upload-text">Click to upload or drag and drop</p>
        <p class="upload-hint">PNG, JPG, GIF up to 10MB</p>
      </div>
    </div>

    <div v-else class="image-preview">
      <img :src="imageUrl" :alt="localAlt" class="preview-image" />

      <div class="image-controls">
        <input
          v-model="localAlt"
          @input="handleAltChange"
          placeholder="Image description (optional)"
          class="alt-input"
        />

        <button @click="removeImage" class="remove-btn">
          Remove Image
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted } from "vue";
import type { ImageNote } from "@/types/note";

const props = defineProps<{
  note: ImageNote;
}>();

const emit = defineEmits<{
  (e: "update", updates: Partial<ImageNote>): void;
}>();

const fileInputRef = ref<HTMLInputElement | null>(null);
const imageUrl = ref(props.note.url || "");
const localAlt = ref(props.note.alt || "");

function triggerFileInput() {
  fileInputRef.value?.click();
}

async function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    await processFile(file);
  }
}

async function handleDrop(event: DragEvent) {
  const file = event.dataTransfer?.files[0];
  if (file && file.type.startsWith("image/")) {
    await processFile(file);
  }
}

async function processFile(file: File) {
  // Create object URL for preview
  const url = URL.createObjectURL(file);
  imageUrl.value = url;

  // Get image dimensions
  const img = new Image();
  img.src = url;
  await new Promise((resolve) => {
    img.onload = resolve;
  });

  // Convert to base64 for storage
  const reader = new FileReader();
  reader.onload = (e) => {
    const base64 = e.target?.result as string;

    emit("update", {
      blob: base64,
      url,
      width: img.width,
      height: img.height,
    });
  };
  reader.readAsDataURL(file);
}

function handleAltChange() {
  emit("update", { alt: localAlt.value });
}

function removeImage() {
  if (imageUrl.value.startsWith("blob:")) {
    URL.revokeObjectURL(imageUrl.value);
  }
  imageUrl.value = "";
  emit("update", { blob: "", url: "", alt: "" });
}

// Watch for external updates
watch(
  () => props.note.url,
  (newValue) => {
    if (newValue !== imageUrl.value) {
      imageUrl.value = newValue || "";
    }
  }
);

watch(
  () => props.note.alt,
  (newValue) => {
    if (newValue !== localAlt.value) {
      localAlt.value = newValue || "";
    }
  }
);

// Cleanup on unmount
onUnmounted(() => {
  if (imageUrl.value.startsWith("blob:")) {
    URL.revokeObjectURL(imageUrl.value);
  }
});
</script>

<style scoped>
.image-editor {
  min-height: 300px;
}

.upload-area {
  height: 100%;
}

.drop-zone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  border: 3px dashed #000;
  background: #fafafa;
  cursor: pointer;
  transition: all 0.2s;
}

.drop-zone:hover {
  background: #f0f0f0;
  border-color: #333;
}

.upload-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.upload-text {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
}

.upload-hint {
  font-size: 14px;
  color: #666;
}

.image-preview {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.preview-image {
  width: 100%;
  height: auto;
  border: 2px solid #000;
  object-fit: contain;
  max-height: 500px;
}

.image-controls {
  display: flex;
  gap: 8px;
}

.alt-input {
  flex: 1;
  padding: 8px 12px;
  border: 2px solid #000;
  font-size: 14px;
}

.alt-input:focus {
  outline: none;
  box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.1);
}

.remove-btn {
  padding: 8px 16px;
  background: #fff;
  border: 2px solid #000;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.remove-btn:hover {
  background: #fee;
  border-color: #c00;
  color: #c00;
}
</style>
