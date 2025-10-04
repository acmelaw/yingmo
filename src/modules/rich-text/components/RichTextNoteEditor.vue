<template>
  <div class="rich-text-editor">
    <div class="editor-toolbar">
      <button @click="toggleBold" :class="{ active: isBold }" class="toolbar-btn" title="Bold">
        <strong>B</strong>
      </button>
      <button @click="toggleItalic" :class="{ active: isItalic }" class="toolbar-btn" title="Italic">
        <em>I</em>
      </button>
      <button @click="toggleUnderline" :class="{ active: isUnderline }" class="toolbar-btn" title="Underline">
        <u>U</u>
      </button>
      <div class="toolbar-divider"></div>
      <button @click="insertLink" class="toolbar-btn" title="Insert Link">
        🔗
      </button>
      <button @click="insertList" class="toolbar-btn" title="Bullet List">
        •
      </button>
    </div>

    <div
      ref="editorRef"
      class="editor-content"
      contenteditable="true"
      @input="handleInput"
      @blur="handleBlur"
      v-html="localHtml"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from "vue";
import type { RichTextNote } from "@/types/note";

const props = defineProps<{
  note: RichTextNote;
}>();

const emit = defineEmits<{
  (e: "update", updates: Partial<RichTextNote>): void;
}>();

const editorRef = ref<HTMLElement | null>(null);
const localHtml = ref(props.note.html || "");
const isBold = ref(false);
const isItalic = ref(false);
const isUnderline = ref(false);

function handleInput() {
  if (editorRef.value) {
    const html = editorRef.value.innerHTML;
    localHtml.value = html;

    // Convert HTML to simple content structure
    const content = htmlToContent(html);

    emit("update", {
      html,
      content,
    });
  }

  updateToolbarState();
}

function handleBlur() {
  updateToolbarState();
}

function updateToolbarState() {
  isBold.value = document.queryCommandState("bold");
  isItalic.value = document.queryCommandState("italic");
  isUnderline.value = document.queryCommandState("underline");
}

function toggleBold() {
  document.execCommand("bold", false);
  editorRef.value?.focus();
  updateToolbarState();
  handleInput();
}

function toggleItalic() {
  document.execCommand("italic", false);
  editorRef.value?.focus();
  updateToolbarState();
  handleInput();
}

function toggleUnderline() {
  document.execCommand("underline", false);
  editorRef.value?.focus();
  updateToolbarState();
  handleInput();
}

function insertLink() {
  const url = prompt("Enter URL:");
  if (url) {
    document.execCommand("createLink", false, url);
    editorRef.value?.focus();
    handleInput();
  }
}

function insertList() {
  document.execCommand("insertUnorderedList", false);
  editorRef.value?.focus();
  handleInput();
}

// Simple HTML to content converter
function htmlToContent(html: string): any {
  return {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: editorRef.value?.innerText || "",
          },
        ],
      },
    ],
  };
}

// Watch for external updates
watch(
  () => props.note.html,
  (newValue) => {
    if (newValue && newValue !== localHtml.value) {
      localHtml.value = newValue;
    }
  }
);

onMounted(() => {
  if (editorRef.value && !localHtml.value) {
    editorRef.value.innerHTML = "";
  }
});
</script>

<style scoped>
.rich-text-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 300px;
}

.editor-toolbar {
  display: flex;
  gap: 4px;
  padding: 8px;
  border: 2px solid #000;
  border-bottom: none;
  background: #f0f0f0;
}

.toolbar-btn {
  padding: 6px 12px;
  background: #fff;
  border: 2px solid #000;
  cursor: pointer;
  font-weight: 500;
  min-width: 36px;
  transition: all 0.2s;
}

.toolbar-btn:hover {
  background: #e0e0e0;
}

.toolbar-btn.active {
  background: #000;
  color: #fff;
}

.toolbar-divider {
  width: 2px;
  background: #000;
  margin: 0 4px;
}

.editor-content {
  flex: 1;
  padding: 12px;
  border: 2px solid #000;
  background: #fff;
  overflow-y: auto;
  line-height: 1.6;
  min-height: 200px;
  cursor: text;
}

.editor-content:focus {
  outline: none;
  box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.1);
}

.editor-content:empty:before {
  content: "Start typing...";
  color: #999;
}

.editor-content :deep(a) {
  color: #0066cc;
  text-decoration: underline;
}

.editor-content :deep(ul) {
  margin: 8px 0;
  padding-left: 24px;
}

.editor-content :deep(li) {
  margin: 4px 0;
}
</style>
