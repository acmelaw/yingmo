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
import { ref, watch, computed } from "vue";
import type { CodeNote } from "@/types/note";
import { getNoteContent, getNoteMeta, setNoteMeta } from "@/types/note";
import { getLanguageDisplayName } from "../utils";

const props = defineProps<{
  note: CodeNote;
}>();

const emit = defineEmits<{
  update: [data: Partial<CodeNote>];
}>();

const localCode = ref(getNoteContent(props.note));
const localLanguage = ref(getNoteMeta<string>(props.note, 'language', 'javascript'));
const localFilename = ref(getNoteMeta<string>(props.note, 'filename', ''));

watch(
  () => getNoteContent(props.note),
  (newCode) => {
    localCode.value = newCode;
  }
);

watch(
  () => getNoteMeta<string>(props.note, 'language'),
  (newLanguage) => {
    if (newLanguage) {
      localLanguage.value = newLanguage;
    }
  }
);

watch(
  () => getNoteMeta<string>(props.note, 'filename'),
  (newFilename) => {
    localFilename.value = newFilename || "";
  }
);

function updateCode() {
  emit("update", { content: localCode.value });
}

function updateLanguage() {
  emit("update", { 
    metadata: { 
      ...props.note.metadata, 
      language: localLanguage.value 
    } 
  });
}

function updateFilename() {
  emit("update", { 
    metadata: { 
      ...props.note.metadata, 
      filename: localFilename.value 
    } 
  });
}

const lineCount = computed(() => {
  return localCode.value.split('\n').length;
});

const handleInput = () => {
  updateCode();
};

const handleLanguageChange = () => {
  updateLanguage();
};

const handleFilenameChange = () => {
  updateFilename();
};
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
