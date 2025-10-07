<script setup lang="ts">
import { ref, watch, onBeforeUnmount, computed } from "vue";
import { useEditor, EditorContent } from "@tiptap/vue-3";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import * as Y from "yjs";

const props = withDefaults(
  defineProps<{
    modelValue: string;
    placeholder?: string;
    enableCollaboration?: boolean;
    collaborationDoc?: Y.Doc;
    minHeight?: string;
    maxHeight?: string;
    editable?: boolean;
  }>(),
  {
    placeholder: "Start typing...",
    enableCollaboration: false,
    minHeight: "80px",
    maxHeight: "400px",
    editable: true,
  }
);

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "update:json", value: any): void;
}>();

// Create a Y.Doc for collaboration if not provided
const ydoc = computed(() => props.collaborationDoc || new Y.Doc());

// Configure TipTap extensions
const extensions = computed(() => {
  const baseExtensions: any[] = [
    StarterKit.configure({
      // Disable history when using collaboration (Yjs handles it)
      history: props.enableCollaboration ? false : {},
    }),
    Placeholder.configure({
      placeholder: props.placeholder,
    }),
  ];

  // Add collaboration extensions if enabled
  if (props.enableCollaboration) {
    baseExtensions.push(
      Collaboration.configure({
        document: ydoc.value,
      }),
      CollaborationCursor.configure({
        provider: null, // Set externally if needed
        user: {
          name: "Anonymous",
          color: "#" + Math.floor(Math.random() * 16777215).toString(16),
        },
      })
    );
  }

  return baseExtensions;
});

const editor = useEditor({
  extensions: extensions.value,
  content: props.modelValue,
  editable: props.editable,
  onUpdate: ({ editor }) => {
    const html = editor.getHTML();
    const text = editor.getText();
    const json = editor.getJSON();

    emit("update:modelValue", text);
    emit("update:json", json);
  },
});

// Watch for external changes
watch(
  () => props.modelValue,
  (value) => {
    if (editor.value && !editor.value.isFocused) {
      const currentContent = editor.value.getText();
      if (value !== currentContent) {
        editor.value.commands.setContent(value);
      }
    }
  }
);

// Watch editable prop
watch(
  () => props.editable,
  (value) => {
    if (editor.value) {
      editor.value.setEditable(value);
    }
  }
);

onBeforeUnmount(() => {
  editor.value?.destroy();
});

// Expose editor instance for parent component
defineExpose({
  editor,
  focus: () => editor.value?.commands.focus(),
  blur: () => editor.value?.commands.blur(),
  clear: () => editor.value?.commands.clearContent(),
  setContent: (content: string) => editor.value?.commands.setContent(content),
});
</script>

<template>
  <div class="w-full">
    <EditorContent
      :editor="editor"
      class="w-full overflow-y-auto"
      :style="{
        minHeight: minHeight,
        maxHeight: maxHeight,
      }"
    />
  </div>
</template>

<style>
/* ProseMirror editor styles - unscoped for proper cascading */
.ProseMirror {
  outline: none;
  padding: 12px;
  font-size: 15px;
  line-height: 1.6;
  font-weight: 500;
}

.ProseMirror p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  float: left;
  color: #999;
  pointer-events: none;
  height: 0;
}

.ProseMirror strong {
  font-weight: 700;
}

.ProseMirror em {
  font-style: italic;
}

.ProseMirror code {
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: "Monaco", "Courier New", monospace;
  font-size: 0.9em;
}

.ProseMirror ul,
.ProseMirror ol {
  padding-left: 24px;
  margin: 8px 0;
}

.ProseMirror li {
  margin: 4px 0;
}

.ProseMirror h1 {
  font-size: 1.8em;
  font-weight: 700;
  margin: 16px 0 8px;
}

.ProseMirror h2 {
  font-size: 1.5em;
  font-weight: 700;
  margin: 14px 0 6px;
}

.ProseMirror h3 {
  font-size: 1.3em;
  font-weight: 700;
  margin: 12px 0 4px;
}

/* Collaboration cursor styles */
.collaboration-cursor__caret {
  position: relative;
  margin-left: -1px;
  margin-right: -1px;
  border-left: 2px solid;
  border-right: 2px solid;
  word-break: normal;
  pointer-events: none;
}

.collaboration-cursor__label {
  position: absolute;
  top: -1.4em;
  left: -1px;
  font-size: 12px;
  font-style: normal;
  font-weight: 600;
  line-height: normal;
  user-select: none;
  color: white;
  padding: 2px 6px;
  border-radius: 3px;
  white-space: nowrap;
}
</style>
