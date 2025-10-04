<template>
  <div class="code-editor">
    <div class="editor-header">
      <select v-model="localLanguage" @change="handleLanguageChange" class="language-select">
        <option value="javascript">JavaScript</option>
        <option value="typescript">TypeScript</option>
        <option value="python">Python</option>
        <option value="java">Java</option>
        <option value="csharp">C#</option>
        <option value="go">Go</option>
        <option value="rust">Rust</option>
        <option value="ruby">Ruby</option>
        <option value="php">PHP</option>
        <option value="html">HTML</option>
        <option value="css">CSS</option>
        <option value="sql">SQL</option>
        <option value="bash">Bash</option>
        <option value="json">JSON</option>
        <option value="yaml">YAML</option>
        <option value="markdown">Markdown</option>
      </select>

      <input
        v-model="localFilename"
        @input="handleFilenameChange"
        placeholder="filename (optional)"
        class="filename-input"
      />
    </div>

    <textarea
      v-model="localCode"
      @input="handleInput"
      class="code-input"
      placeholder="Paste or write your code here..."
      spellcheck="false"
    ></textarea>

    <div class="editor-footer">
      <span class="char-count">{{ localCode.length }} characters</span>
      <span class="line-count">{{ lineCount }} lines</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import type { CodeNote } from "@/types/note";

const props = defineProps<{
  note: CodeNote;
}>();

const emit = defineEmits<{
  (e: "update", updates: Partial<CodeNote>): void;
}>();

const localCode = ref(props.note.code);
const localLanguage = ref(props.note.language);
const localFilename = ref(props.note.filename || "");

const lineCount = computed(() => {
  return localCode.value.split("\n").length;
});

function handleInput() {
  emit("update", { code: localCode.value });
}

function handleLanguageChange() {
  emit("update", { language: localLanguage.value });
}

function handleFilenameChange() {
  emit("update", { filename: localFilename.value || undefined });
}

// Watch for external updates
watch(
  () => props.note.code,
  (newValue) => {
    if (newValue !== localCode.value) {
      localCode.value = newValue;
    }
  }
);

watch(
  () => props.note.language,
  (newValue) => {
    if (newValue !== localLanguage.value) {
      localLanguage.value = newValue;
    }
  }
);

watch(
  () => props.note.filename,
  (newValue) => {
    if (newValue !== localFilename.value) {
      localFilename.value = newValue || "";
    }
  }
);
</script>

<style scoped>
.code-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 300px;
}

.editor-header {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.language-select,
.filename-input {
  padding: 8px 12px;
  border: 2px solid #000;
  background: #fff;
  font-weight: 500;
}

.language-select {
  width: 150px;
}

.filename-input {
  flex: 1;
  font-family: "SF Mono", Monaco, monospace;
}

.language-select:focus,
.filename-input:focus {
  outline: none;
  box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.1);
}

.code-input {
  flex: 1;
  width: 100%;
  padding: 12px;
  border: 2px solid #000;
  font-family: "SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas,
    "Courier New", monospace;
  font-size: 14px;
  line-height: 1.5;
  resize: vertical;
  min-height: 200px;
  background: #fafafa;
  tab-size: 2;
}

.code-input:focus {
  outline: none;
  box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.1);
}

.editor-footer {
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
</style>
