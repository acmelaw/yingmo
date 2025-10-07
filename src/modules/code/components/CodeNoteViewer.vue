<template>
  <div class="code-viewer">
    <div class="viewer-header">
      <span class="language-badge">{{ language }}</span>
      <span v-if="filename" class="filename">{{ filename }}</span>
    </div>

    <pre class="code-content"><code>{{ codeContent }}</code></pre>

    <div class="viewer-footer">
      <span class="char-count">{{ codeContent.length }} characters</span>
      <span class="line-count">{{ lineCount }} lines</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { Note } from "@/types/note";
import { getNoteContent, getNoteMeta } from "@/types/note";

const props = defineProps<{
  note: Note;
}>();

// Unified: get content and metadata
const codeContent = computed(() => getNoteContent(props.note));
const language = computed(() =>
  getNoteMeta<string>(props.note, "language", "text")
);
const filename = computed(() => getNoteMeta<string>(props.note, "filename"));

const lineCount = computed(() => {
  return codeContent.value.split("\n").length;
});
</script>

<style scoped>
.code-viewer {
  display: flex;
  flex-direction: column;
}

.viewer-header {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 8px;
  padding: 8px;
  background: #f0f0f0;
  border: 2px solid #000;
}

.language-badge {
  padding: 4px 12px;
  background: #000;
  color: #fff;
  font-weight: 600;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.filename {
  font-family: "SF Mono", Monaco, monospace;
  font-size: 14px;
  color: #666;
}

.code-content {
  padding: 12px;
  border: 2px solid #000;
  background: #fafafa;
  overflow-x: auto;
  font-family:
    "SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New",
    monospace;
  font-size: 14px;
  line-height: 1.5;
  margin: 0;
}

.code-content code {
  display: block;
  white-space: pre;
  tab-size: 2;
}

.viewer-footer {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  padding: 4px 8px;
  border-top: 2px solid #000;
  font-size: 12px;
  color: #666;
}

.char-count,
.line-count {
  font-family: "SF Mono", Monaco, monospace;
}

.view-mode-notice {
  margin-top: 12px;
  padding: 12px;
  background: #fff3cd;
  border: 2px solid #000;
  border-left: 4px solid #ffc107;
  font-size: 12px;
  font-weight: 600;
  color: #856404;
}
</style>
