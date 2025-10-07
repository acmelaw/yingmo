<template>
  <div class="rich-text-editor">
    <div v-if="editor" class="editor-toolbar">
      <button
        :class="{ active: editor.isActive('bold') }"
        class="toolbar-btn"
        title="Bold"
        @click="editor.chain().focus().toggleBold().run()"
      >
        <strong>B</strong>
      </button>
      <button
        :class="{ active: editor.isActive('italic') }"
        class="toolbar-btn"
        title="Italic"
        @click="editor.chain().focus().toggleItalic().run()"
      >
        <em>I</em>
      </button>
      <button
        :class="{ active: editor.isActive('strike') }"
        class="toolbar-btn"
        title="Strikethrough"
        @click="editor.chain().focus().toggleStrike().run()"
      >
        <s>S</s>
      </button>
      <div class="toolbar-divider"></div>
      <button
        :class="{ active: editor.isActive('bulletList') }"
        class="toolbar-btn"
        title="Bullet List"
        @click="editor.chain().focus().toggleBulletList().run()"
      >
        •
      </button>
      <button
        :class="{ active: editor.isActive('orderedList') }"
        class="toolbar-btn"
        title="Numbered List"
        @click="editor.chain().focus().toggleOrderedList().run()"
      >
        #
      </button>
    </div>

    <EditorContent :editor="editor" class="editor-content" />
  </div>
</template>

<script setup lang="ts">
import { watch, onBeforeUnmount } from "vue";
import { useEditor, EditorContent } from "@tiptap/vue-3";
import StarterKit from "@tiptap/starter-kit";
import type { RichTextNote } from "@/types/note";
import { getNoteContent, getNoteMeta } from "@/types/note";

const props = defineProps<{
  note: RichTextNote;
}>();

const emit = defineEmits<{
  update: [data: Partial<RichTextNote>];
}>();

const editor = useEditor({
  extensions: [StarterKit],
  content: getNoteContent(props.note),
  onUpdate: ({ editor }) => {
    const html = editor.getHTML();
    const json = editor.getJSON();
    emit("update", {
      content: html,
      metadata: {
        ...props.note.metadata,
        format: "html",
        tiptapContent: json,
      },
    });
  },
});

watch(
  () => getNoteContent(props.note),
  (newContent) => {
    if (editor.value && editor.value.getHTML() !== newContent) {
      editor.value.commands.setContent(newContent);
    }
  }
);

onBeforeUnmount(() => {
  editor.value?.destroy();
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
  border: 3px solid #000;
  border-bottom: none;
  background: #f0f0f0;
}

.toolbar-btn {
  padding: 6px 12px;
  background: #fff;
  border: 2px solid #000;
  cursor: pointer;
  font-weight: 700;
  min-width: 36px;
  transition: all 0.15s;
  text-transform: uppercase;
  font-size: 14px;
}

.toolbar-btn:hover {
  background: #e0e0e0;
  transform: translate(-1px, -1px);
  box-shadow: 2px 2px 0 #000;
}

.toolbar-btn:active {
  transform: translate(1px, 1px);
  box-shadow: none;
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
  border: 3px solid #000;
  background: #fff;
}

.editor-content :deep(.ProseMirror) {
  padding: 16px;
  min-height: 200px;
  outline: none;
  line-height: 1.6;
}

.editor-content :deep(.ProseMirror:focus) {
  outline: none;
}

.editor-content :deep(.ProseMirror p.is-editor-empty:first-child::before) {
  content: "Start typing...";
  color: #999;
  pointer-events: none;
  height: 0;
  float: left;
}

.editor-content :deep(strong) {
  font-weight: 700;
}

.editor-content :deep(em) {
  font-style: italic;
}

.editor-content :deep(s) {
  text-decoration: line-through;
}

.editor-content :deep(ul),
.editor-content :deep(ol) {
  margin: 12px 0;
  padding-left: 24px;
}

.editor-content :deep(li) {
  margin: 4px 0;
}
</style>
