<template>
  <div class="markdown-editor">
    <div class="editor-tabs">
      <button
        :class="{ active: mode === 'edit' }"
        @click="mode = 'edit'"
        class="tab-btn"
      >
        Edit
      </button>
      <button
        :class="{ active: mode === 'preview' }"
        @click="mode = 'preview'"
        class="tab-btn"
      >
        Preview
      </button>
      <button
        :class="{ active: mode === 'split' }"
        @click="mode = 'split'"
        class="tab-btn"
      >
        Split
      </button>
    </div>

    <div class="editor-content" :class="{ split: mode === 'split' }">
      <textarea
        v-if="mode === 'edit' || mode === 'split'"
        v-model="localMarkdown"
        @input="handleInput"
        class="markdown-input"
        placeholder="Write your markdown here..."
      ></textarea>

      <div
        v-if="mode === 'preview' || mode === 'split'"
        class="markdown-preview"
        v-html="renderedHtml"
      ></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import type { MarkdownNote } from "@/types/note";

const props = defineProps<{
  note: MarkdownNote;
}>();

const emit = defineEmits<{
  (e: "update", updates: Partial<MarkdownNote>): void;
}>();

const mode = ref<"edit" | "preview" | "split">("split");
const localMarkdown = ref(props.note.markdown || '');

// Simple markdown to HTML converter (you can replace with a library like marked.js)
const renderedHtml = computed(() => {
  return simpleMarkdownToHtml(localMarkdown.value || '');
});

function handleInput() {
  emit("update", {
    markdown: localMarkdown.value,
    html: renderedHtml.value,
  });
}

// Watch for external updates
watch(
  () => props.note.markdown,
  (newValue) => {
    if (newValue !== localMarkdown.value) {
      localMarkdown.value = newValue;
    }
  }
);

// Simple markdown parser (basic implementation)
function simpleMarkdownToHtml(markdown: string): string {
  if (!markdown) return '';

  let html = markdown;

  // Headers
  html = html.replace(/^### (.*$)/gim, "<h3>$1</h3>");
  html = html.replace(/^## (.*$)/gim, "<h2>$1</h2>");
  html = html.replace(/^# (.*$)/gim, "<h1>$1</h1>");

  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\_\_(.*?)\_\_/g, "<strong>$1</strong>");

  // Italic
  html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");
  html = html.replace(/\_(.*?)\_/g, "<em>$1</em>");

  // Links
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>');

  // Inline code
  html = html.replace(/`(.*?)`/g, "<code>$1</code>");

  // Code blocks
  html = html.replace(
    /```(.*?)\n([\s\S]*?)```/g,
    '<pre><code class="language-$1">$2</code></pre>'
  );

  // Line breaks
  html = html.replace(/\n\n/g, "</p><p>");
  html = html.replace(/\n/g, "<br>");

  // Wrap in paragraph if not already
  if (!html.startsWith("<h") && !html.startsWith("<p")) {
    html = "<p>" + html + "</p>";
  }

  return html;
}
</script>

<style scoped>
.markdown-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 300px;
}

.editor-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 8px;
  border-bottom: 2px solid #000;
  padding-bottom: 4px;
}

.tab-btn {
  padding: 8px 16px;
  background: #fff;
  border: 2px solid #000;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.tab-btn:hover {
  background: #f0f0f0;
}

.tab-btn.active {
  background: #000;
  color: #fff;
}

.editor-content {
  flex: 1;
  display: flex;
  gap: 16px;
}

.editor-content.split {
  display: grid;
  grid-template-columns: 1fr 1fr;
}

.markdown-input {
  flex: 1;
  width: 100%;
  padding: 12px;
  border: 2px solid #000;
  font-family: "SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas,
    "Courier New", monospace;
  font-size: 14px;
  line-height: 1.6;
  resize: vertical;
  min-height: 200px;
}

.markdown-input:focus {
  outline: none;
  box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.1);
}

.markdown-preview {
  flex: 1;
  padding: 12px;
  border: 2px solid #000;
  background: #fafafa;
  overflow-y: auto;
  line-height: 1.6;
}

.markdown-preview :deep(h1) {
  font-size: 2em;
  margin: 0.5em 0;
  font-weight: 700;
}

.markdown-preview :deep(h2) {
  font-size: 1.5em;
  margin: 0.5em 0;
  font-weight: 700;
}

.markdown-preview :deep(h3) {
  font-size: 1.25em;
  margin: 0.5em 0;
  font-weight: 700;
}

.markdown-preview :deep(code) {
  background: #f0f0f0;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: "SF Mono", Monaco, monospace;
}

.markdown-preview :deep(pre) {
  background: #f0f0f0;
  padding: 12px;
  border: 2px solid #000;
  overflow-x: auto;
  margin: 8px 0;
}

.markdown-preview :deep(a) {
  color: #0066cc;
  text-decoration: underline;
}

.markdown-preview :deep(a:hover) {
  color: #0052a3;
}
</style>
