<script setup lang="ts">
import { watch, computed, onBeforeUnmount } from 'vue';
import { useEditor, EditorContent } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Link from '@tiptap/extension-link';
import Highlight from '@tiptap/extension-highlight';
import * as Y from 'yjs';

interface Props {
  ydoc: Y.Doc;
  fieldName?: string;
  placeholder?: string;
  editable?: boolean;
  username?: string;
  userColor?: string;
  autoFocus?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  fieldName: 'content',
  placeholder: 'Start writing...',
  editable: true,
  username: 'Anonymous',
  userColor: '#ff6b6b',
  autoFocus: false
});

const emit = defineEmits<{
  (e: 'update', content: string): void;
  (e: 'ready'): void;
}>();

const editor = useEditor({
  extensions: [
    StarterKit.configure({
      history: false
    }),
    Collaboration.configure({
      document: props.ydoc,
      field: props.fieldName
    }),
    CollaborationCursor.configure({
      provider: null,
      user: {
        name: props.username,
        color: props.userColor
      }
    }),
    Placeholder.configure({
      placeholder: props.placeholder
    }),
    TaskList,
    TaskItem.configure({
      nested: true
    }),
    Link.configure({
      openOnClick: false
    }),
    Highlight
  ],
  editable: props.editable,
  autofocus: props.autoFocus,
  editorProps: {
    attributes: {
      class:
        'prose prose-sm sm:prose lg:prose-lg xl:prose-xl focus:outline-none min-h-[200px] px-4 py-3'
    }
  },
  onUpdate: ({ editor }) => {
    emit('update', editor.getHTML());
  },
  onCreate: () => {
    emit('ready');
  }
});

watch(
  () => props.editable,
  (editable) => {
    editor.value?.setEditable(editable);
  }
);

watch(
  [() => props.username, () => props.userColor],
  ([name, color]) => {
    editor.value?.chain().updateUser({ name, color }).run();
  }
);

const canUndo = computed(() => editor.value?.can().undo() ?? false);
const canRedo = computed(() => editor.value?.can().redo() ?? false);

const toggleBold = () => editor.value?.chain().focus().toggleBold().run();
const toggleItalic = () => editor.value?.chain().focus().toggleItalic().run();
const toggleStrike = () => editor.value?.chain().focus().toggleStrike().run();
const toggleCode = () => editor.value?.chain().focus().toggleCode().run();
const toggleHighlight = () => editor.value?.chain().focus().toggleHighlight().run();
const toggleTaskList = () => editor.value?.chain().focus().toggleTaskList().run();
const toggleBulletList = () => editor.value?.chain().focus().toggleBulletList().run();
const toggleOrderedList = () => editor.value?.chain().focus().toggleOrderedList().run();

const setHeading = (level: 1 | 2 | 3) => {
  editor.value?.chain().focus().toggleHeading({ level }).run();
};

const isActive = (name: string, attrs?: Record<string, any>) => {
  return editor.value?.isActive(name, attrs) ?? false;
};

onBeforeUnmount(() => {
  editor.value?.destroy();
});

defineExpose({
  editor,
  toggleBold,
  toggleItalic,
  toggleStrike,
  toggleCode,
  toggleHighlight,
  setHeading
});
</script>

<template>
  <div class="collaborative-editor">
    <div v-if="editable" class="toolbar surface mb-2 flex flex-wrap items-center gap-1 p-2">
      <div class="btn-group flex gap-1">
        <button
          @click="toggleBold"
          :class="{ 'is-active': isActive('bold') }"
          class="toolbar-btn"
          title="Bold (Cmd+B)"
        >
          <strong>B</strong>
        </button>
        <button
          @click="toggleItalic"
          :class="{ 'is-active': isActive('italic') }"
          class="toolbar-btn"
          title="Italic (Cmd+I)"
        >
          <em>I</em>
        </button>
        <button
          @click="toggleStrike"
          :class="{ 'is-active': isActive('strike') }"
          class="toolbar-btn"
          title="Strikethrough"
        >
          <s>S</s>
        </button>
        <button
          @click="toggleCode"
          :class="{ 'is-active': isActive('code') }"
          class="toolbar-btn"
          title="Code"
        >
          &lt;/&gt;
        </button>
      </div>

      <div class="divider"></div>

      <div class="btn-group flex gap-1">
        <button
          @click="setHeading(1)"
          :class="{ 'is-active': isActive('heading', { level: 1 }) }"
          class="toolbar-btn"
          title="Heading 1"
        >
          H1
        </button>
        <button
          @click="setHeading(2)"
          :class="{ 'is-active': isActive('heading', { level: 2 }) }"
          class="toolbar-btn"
          title="Heading 2"
        >
          H2
        </button>
        <button
          @click="setHeading(3)"
          :class="{ 'is-active': isActive('heading', { level: 3 }) }"
          class="toolbar-btn"
          title="Heading 3"
        >
          H3
        </button>
      </div>

      <div class="divider"></div>

      <div class="btn-group flex gap-1">
        <button
          @click="toggleBulletList"
          :class="{ 'is-active': isActive('bulletList') }"
          class="toolbar-btn"
          title="Bullet List"
        >
          •
        </button>
        <button
          @click="toggleOrderedList"
          :class="{ 'is-active': isActive('orderedList') }"
          class="toolbar-btn"
          title="Numbered List"
        >
          1.
        </button>
        <button
          @click="toggleTaskList"
          :class="{ 'is-active': isActive('taskList') }"
          class="toolbar-btn"
          title="Task List"
        >
          ☑
        </button>
      </div>

      <div class="divider"></div>

      <button
        @click="toggleHighlight"
        :class="{ 'is-active': isActive('highlight') }"
        class="toolbar-btn"
        title="Highlight"
      >
        🖍️
      </button>
    </div>

    <div class="editor-container surface">
      <EditorContent :editor="editor" />
    </div>
  </div>
</template>

<style scoped>
.collaborative-editor {
  width: 100%;
}

.toolbar {
  border-radius: 6px;
  border: 2px solid var(--ink, #101112);
}

.toolbar-btn {
  min-width: 32px;
  height: 32px;
  padding: 0 8px;
  border: 1px solid var(--ink, #101112);
  border-radius: 4px;
  background: transparent;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.15s;
}

.toolbar-btn:hover {
  background: rgba(0, 0, 0, 0.05);
}

.toolbar-btn.is-active {
  background: var(--accent, #ff4555);
  color: white;
  border-color: var(--accent, #ff4555);
}

.dark .toolbar-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.divider {
  width: 1px;
  height: 24px;
  background: var(--ink, #101112);
  opacity: 0.2;
  margin: 0 4px;
}

.editor-container {
  border-radius: 6px;
  min-height: 200px;
}

:deep(.ProseMirror) {
  outline: none;
  min-height: 200px;
  padding: 12px 16px;
}

:deep(.ProseMirror p.is-editor-empty:first-child::before) {
  content: attr(data-placeholder);
  float: left;
  color: #adb5bd;
  pointer-events: none;
  height: 0;
}

:deep(.ProseMirror h1) {
  font-size: 2em;
  font-weight: bold;
  margin: 0.67em 0;
}

:deep(.ProseMirror h2) {
  font-size: 1.5em;
  font-weight: bold;
  margin: 0.75em 0;
}

:deep(.ProseMirror h3) {
  font-size: 1.17em;
  font-weight: bold;
  margin: 0.83em 0;
}

:deep(.ProseMirror ul),
:deep(.ProseMirror ol) {
  padding-left: 1.5em;
  margin: 0.5em 0;
}

:deep(.ProseMirror ul[data-type='taskList']) {
  list-style: none;
  padding-left: 0;
}

:deep(.ProseMirror ul[data-type='taskList'] li) {
  display: flex;
  align-items: flex-start;
  margin: 0.25em 0;
}

:deep(.ProseMirror ul[data-type='taskList'] li > label) {
  margin-right: 0.5em;
  user-select: none;
}

:deep(.ProseMirror ul[data-type='taskList'] li > div) {
  flex: 1;
}

:deep(.ProseMirror code) {
  background-color: rgba(97, 97, 97, 0.1);
  border-radius: 0.25em;
  padding: 0.15em 0.3em;
  font-family: monospace;
  font-size: 0.9em;
}

:deep(.ProseMirror mark) {
  background-color: #fef08a;
  border-radius: 0.25em;
  padding: 0.1em 0.2em;
}

:deep(.dark .ProseMirror mark) {
  background-color: #854d0e;
}

:deep(.collaboration-cursor__caret) {
  border-left: 2px solid;
  border-right: 2px solid;
  margin-left: -1px;
  margin-right: -1px;
  pointer-events: none;
  position: relative;
  word-break: normal;
}

:deep(.collaboration-cursor__label) {
  border-radius: 3px;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  padding: 2px 6px;
  position: absolute;
  top: -1.4em;
  user-select: none;
  white-space: nowrap;
}
</style>
