<template>
  <div class="markdown-viewer">
    <div class="markdown-content" v-html="renderedHtml"></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { MarkdownNote } from "@/types/note";

const props = defineProps<{
  note: MarkdownNote;
}>();

const renderedHtml = computed(() => {
  return props.note.html || simpleMarkdownToHtml(props.note.markdown);
});

// Simple markdown parser (same as editor)
function simpleMarkdownToHtml(markdown: string): string {
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
.markdown-viewer {
  padding: 12px;
}

.markdown-content {
  line-height: 1.6;
}

.markdown-content :deep(h1) {
  font-size: 2em;
  margin: 0.5em 0;
  font-weight: 700;
}

.markdown-content :deep(h2) {
  font-size: 1.5em;
  margin: 0.5em 0;
  font-weight: 700;
}

.markdown-content :deep(h3) {
  font-size: 1.25em;
  margin: 0.5em 0;
  font-weight: 700;
}

.markdown-content :deep(code) {
  background: #f0f0f0;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: "SF Mono", Monaco, monospace;
}

.markdown-content :deep(pre) {
  background: #f0f0f0;
  padding: 12px;
  border: 2px solid #000;
  overflow-x: auto;
  margin: 8px 0;
}

.markdown-content :deep(a) {
  color: #0066cc;
  text-decoration: underline;
}

.markdown-content :deep(a:hover) {
  color: #0052a3;
}

.markdown-content :deep(p) {
  margin: 0.5em 0;
}
</style>
