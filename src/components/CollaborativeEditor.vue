<script setup lang="ts">
import { watch, computed, onBeforeUnmount } from "vue";
import { useEditor, EditorContent } from "@tiptap/vue-3";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Link from "@tiptap/extension-link";
import Highlight from "@tiptap/extension-highlight";
import * as Y from "yjs";

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
  fieldName: "content",
  placeholder: "Start writing...",
  editable: true,
  username: "Anonymous",
  userColor: "#ff6b6b",
  autoFocus: false,
});

const emit = defineEmits<{
  (e: "update", content: string): void;
  (e: "ready"): void;
}>();

const editor = useEditor({
  extensions: [
    StarterKit.configure({
      history: false,
    }),
    Collaboration.configure({
      document: props.ydoc,
      field: props.fieldName,
    }),
    CollaborationCursor.configure({
      provider: null,
      user: {
        name: props.username,
        color: props.userColor,
      },
    }),
    Placeholder.configure({
      placeholder: props.placeholder,
    }),
    TaskList,
    TaskItem.configure({
      nested: true,
    }),
    Link.configure({
      openOnClick: false,
    }),
    Highlight,
  ],
  editable: props.editable,
  autofocus: props.autoFocus,
  editorProps: {
    attributes: {
      class:
        "prose prose-sm sm:prose lg:prose-lg xl:prose-xl focus:outline-none min-h-[200px] px-4 py-3",
    },
  },
  onUpdate: ({ editor }) => {
    emit("update", editor.getHTML());
  },
  onCreate: () => {
    emit("ready");
  },
});

watch(
  () => props.editable,
  (editable) => {
    editor.value?.setEditable(editable);
  }
);

watch([() => props.username, () => props.userColor], ([name, color]) => {
  editor.value?.chain().updateUser({ name, color }).run();
});

const canUndo = computed(() => editor.value?.can().undo() ?? false);
const canRedo = computed(() => editor.value?.can().redo() ?? false);

const toggleBold = () => editor.value?.chain().focus().toggleBold().run();
const toggleItalic = () => editor.value?.chain().focus().toggleItalic().run();
const toggleStrike = () => editor.value?.chain().focus().toggleStrike().run();
const toggleCode = () => editor.value?.chain().focus().toggleCode().run();
const toggleHighlight = () =>
  editor.value?.chain().focus().toggleHighlight().run();
const toggleTaskList = () =>
  editor.value?.chain().focus().toggleTaskList().run();
const toggleBulletList = () =>
  editor.value?.chain().focus().toggleBulletList().run();
const toggleOrderedList = () =>
  editor.value?.chain().focus().toggleOrderedList().run();

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
  setHeading,
});
</script>

<template>
  <div class="w-full">
    <div
      v-if="editable"
      class="mb-2 flex flex-wrap items-center gap-1 p-2 border-2 border-brutal-black bg-brutal-white"
    >
      <div class="flex gap-1">
        <button
          :class="{
            'bg-brutal-pink text-brutal-white border-brutal-pink':
              isActive('bold'),
          }"
          class="min-w-8 h-8 px-2 border-1 border-brutal-black bg-transparent cursor-pointer text-sm font-bold transition-all duration-150 hover:bg-black/5"
          title="Bold (Cmd+B)"
          @click="toggleBold"
        >
          <strong>B</strong>
        </button>
        <button
          :class="{
            'bg-brutal-pink text-brutal-white border-brutal-pink':
              isActive('italic'),
          }"
          class="min-w-8 h-8 px-2 border-1 border-brutal-black bg-transparent cursor-pointer text-sm font-bold transition-all duration-150 hover:bg-black/5"
          title="Italic (Cmd+I)"
          @click="toggleItalic"
        >
          <em>I</em>
        </button>
        <button
          :class="{
            'bg-brutal-pink text-brutal-white border-brutal-pink':
              isActive('strike'),
          }"
          class="min-w-8 h-8 px-2 border-1 border-brutal-black bg-transparent cursor-pointer text-sm font-bold transition-all duration-150 hover:bg-black/5"
          title="Strikethrough"
          @click="toggleStrike"
        >
          <s>S</s>
        </button>
        <button
          :class="{
            'bg-brutal-pink text-brutal-white border-brutal-pink':
              isActive('code'),
          }"
          class="min-w-8 h-8 px-2 border-1 border-brutal-black bg-transparent cursor-pointer text-sm font-bold transition-all duration-150 hover:bg-black/5"
          title="Code"
          @click="toggleCode"
        >
          &lt;/&gt;
        </button>
      </div>

      <div class="w-1px h-6 bg-brutal-black op-20 mx-1"></div>

      <div class="flex gap-1">
        <button
          :class="{
            'bg-brutal-pink text-brutal-white border-brutal-pink': isActive(
              'heading',
              { level: 1 }
            ),
          }"
          class="min-w-8 h-8 px-2 border-1 border-brutal-black bg-transparent cursor-pointer text-sm font-bold transition-all duration-150 hover:bg-black/5"
          title="Heading 1"
          @click="setHeading(1)"
        >
          H1
        </button>
        <button
          :class="{
            'bg-brutal-pink text-brutal-white border-brutal-pink': isActive(
              'heading',
              { level: 2 }
            ),
          }"
          class="min-w-8 h-8 px-2 border-1 border-brutal-black bg-transparent cursor-pointer text-sm font-bold transition-all duration-150 hover:bg-black/5"
          title="Heading 2"
          @click="setHeading(2)"
        >
          H2
        </button>
        <button
          :class="{
            'bg-brutal-pink text-brutal-white border-brutal-pink': isActive(
              'heading',
              { level: 3 }
            ),
          }"
          class="min-w-8 h-8 px-2 border-1 border-brutal-black bg-transparent cursor-pointer text-sm font-bold transition-all duration-150 hover:bg-black/5"
          title="Heading 3"
          @click="setHeading(3)"
        >
          H3
        </button>
      </div>

      <div class="w-1px h-6 bg-brutal-black op-20 mx-1"></div>

      <div class="flex gap-1">
        <button
          :class="{
            'bg-brutal-pink text-brutal-white border-brutal-pink':
              isActive('bulletList'),
          }"
          class="min-w-8 h-8 px-2 border-1 border-brutal-black bg-transparent cursor-pointer text-sm font-bold transition-all duration-150 hover:bg-black/5"
          title="Bullet List"
          @click="toggleBulletList"
        >
          •
        </button>
        <button
          :class="{
            'bg-brutal-pink text-brutal-white border-brutal-pink':
              isActive('orderedList'),
          }"
          class="min-w-8 h-8 px-2 border-1 border-brutal-black bg-transparent cursor-pointer text-sm font-bold transition-all duration-150 hover:bg-black/5"
          title="Numbered List"
          @click="toggleOrderedList"
        >
          1.
        </button>
        <button
          :class="{
            'bg-brutal-pink text-brutal-white border-brutal-pink':
              isActive('taskList'),
          }"
          class="min-w-8 h-8 px-2 border-1 border-brutal-black bg-transparent cursor-pointer text-sm font-bold transition-all duration-150 hover:bg-black/5"
          title="Task List"
          @click="toggleTaskList"
        >
          ☑
        </button>
      </div>

      <div class="w-1px h-6 bg-brutal-black op-20 mx-1"></div>

      <button
        :class="{
          'bg-brutal-pink text-brutal-white border-brutal-pink':
            isActive('highlight'),
        }"
        class="min-w-8 h-8 px-2 border-1 border-brutal-black bg-transparent cursor-pointer text-sm font-bold transition-all duration-150 hover:bg-black/5"
        title="Highlight"
        @click="toggleHighlight"
      >
        🖍️
      </button>
    </div>

    <div class="min-h-50 bg-brutal-white border-2 border-brutal-black">
      <EditorContent :editor="editor" />
    </div>
  </div>
</template>

<style>
/* ProseMirror editor styles - unscoped for proper cascading */
.ProseMirror {
  outline: none;
  min-height: 200px;
  padding: 12px 16px;
}

.ProseMirror p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  float: left;
  color: #adb5bd;
  pointer-events: none;
  height: 0;
}

.ProseMirror h1 {
  font-size: 2em;
  font-weight: bold;
  margin: 0.67em 0;
}

.ProseMirror h2 {
  font-size: 1.5em;
  font-weight: bold;
  margin: 0.75em 0;
}

.ProseMirror h3 {
  font-size: 1.17em;
  font-weight: bold;
  margin: 0.83em 0;
}

.ProseMirror ul,
.ProseMirror ol {
  padding-left: 1.5em;
  margin: 0.5em 0;
}

.ProseMirror ul[data-type="taskList"] {
  list-style: none;
  padding-left: 0;
}

.ProseMirror ul[data-type="taskList"] li {
  display: flex;
  align-items: flex-start;
  margin: 0.25em 0;
}

.ProseMirror ul[data-type="taskList"] li > label {
  margin-right: 0.5em;
  user-select: none;
}

.ProseMirror ul[data-type="taskList"] li > div {
  flex: 1;
}

.ProseMirror code {
  background-color: rgba(97, 97, 97, 0.1);
  border-radius: 0.25em;
  padding: 0.15em 0.3em;
  font-family: monospace;
  font-size: 0.9em;
}

.ProseMirror mark {
  background-color: #fef08a;
  border-radius: 0.25em;
  padding: 0.1em 0.2em;
}

.dark .ProseMirror mark {
  background-color: #854d0e;
}

.collaboration-cursor__caret {
  border-left: 2px solid;
  border-right: 2px solid;
  margin-left: -1px;
  margin-right: -1px;
  pointer-events: none;
  position: relative;
  word-break: normal;
}

.collaboration-cursor__label {
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
