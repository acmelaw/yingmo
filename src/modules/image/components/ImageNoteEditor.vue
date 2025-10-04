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
import { ref, watch, computed } from "vue";
import type { ImageNote } from "@/types/note";
import { getNoteContent, getNoteMeta } from "@/types/note";

const props = defineProps<{
  note: ImageNote;
}>();

const emit = defineEmits<{
  update: [data: Partial<ImageNote>];
}>();

const localUrl = ref(getNoteContent(props.note));
const localAlt = ref(getNoteMeta<string>(props.note, 'alt', ''));
const localWidth = ref(getNoteMeta<number>(props.note, 'width'));
const localHeight = ref(getNoteMeta<number>(props.note, 'height'));

watch(
  () => getNoteContent(props.note),
  (newUrl) => {
    localUrl.value = newUrl;
  }
);

watch(
  () => getNoteMeta<string>(props.note, 'alt'),
  (newAlt) => {
    localAlt.value = newAlt || "";
  }
);

function updateAlt() {
  emit("update", { 
    metadata: {
      ...props.note.metadata,
      alt: localAlt.value
    }
  });
}

async function handleFileUpload(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    emit("update", {
      content: url,
      metadata: {
        ...props.note.metadata,
        blob: file,
        width: img.width,
        height: img.height,
      }
    });
  };
  img.src = url;
}

const imageUrl = computed(() => localUrl.value);
const fileInputRef = ref<HTMLInputElement | null>(null);

function triggerFileInput() {
  fileInputRef.value?.click();
}

function handleFileSelect(event: Event) {
  handleFileUpload(event);
}

function handleDrop(event: DragEvent) {
  const file = event.dataTransfer?.files[0];
  if (file) {
    const fakeEvent = {
      target: { files: [file] }
    } as any;
    handleFileUpload(fakeEvent);
  }
}

function handleAltChange() {
  updateAlt();
}

function removeImage() {
  emit("update", {
    content: "",
    metadata: {
      ...props.note.metadata,
      blob: undefined,
      width: undefined,
      height: undefined,
    }
  });
}
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
