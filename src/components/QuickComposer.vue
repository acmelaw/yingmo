<!--
  QuickComposer - WhatsApp-style message input
  Simple, fast, mobile-first
-->
<script setup lang="ts">
import { computed, ref, watch, nextTick } from "vue";
import { Button, ColorPicker } from "./ui";
import type { NoteType, NoteColor } from "../types/note";

const props = withDefaults(
  defineProps<{
    availableTypes?: NoteType[];
  }>(),
  {
    availableTypes: () => ["text"],
  }
);

const emit = defineEmits<{
  (e: "submit", text: string, type: NoteType, color?: NoteColor): void;
}>();

// === State ===
const input = ref("");
const selectedType = ref<NoteType>("text");
const selectedColor = ref<NoteColor>("default");
const inputEl = ref<HTMLTextAreaElement | null>(null);
const showTypePicker = ref(false);
const showColorPicker = ref(false);
const showEmojiPicker = ref(false);
const selectedTypeIndex = ref(0);
const typeButtons = ref<HTMLButtonElement[]>([]);

// === Computed ===
const canSend = computed(() => input.value.trim().length > 0);

// Detect hashtags in current input
const detectedHashtags = computed(() => {
  const matches = input.value.match(/#[\p{L}\p{N}_-]+/gu);
  return matches ? [...new Set(matches)] : [];
});

const hasHashtags = computed(() => detectedHashtags.value.length > 0);

// Detect slash commands
const slashCommandMap: Record<string, NoteType> = {
  '/text': 'text',
  '/markdown': 'markdown',
  '/md': 'markdown',
  '/code': 'code',
  '/todo': 'todo',
  '/rich': 'rich-text',
  '/richtext': 'rich-text',
  '/image': 'image',
  '/img': 'image',
  '/smart': 'smart-layer',
  '/ai': 'smart-layer',
};

const detectedSlashCommand = computed(() => {
  const trimmed = input.value.trim().toLowerCase();
  for (const [cmd, type] of Object.entries(slashCommandMap)) {
    if (trimmed.startsWith(cmd + ' ') || trimmed === cmd) {
      return { command: cmd, type };
    }
  }
  return null;
});

function getTypeIcon(type: NoteType): string {
  const icons: Record<string, string> = {
    text: "📝",
    markdown: "📄",
    code: "💻",
    "rich-text": "✏️",
    image: "🖼️",
    "smart-layer": "🤖",
    todo: "✅",
  };
  return icons[type] || "📋";
}

const typeIcon = computed(() => getTypeIcon(selectedType.value));

// Auto-detect and apply slash commands
watch(detectedSlashCommand, (cmd) => {
  if (cmd && props.availableTypes.includes(cmd.type)) {
    selectedType.value = cmd.type;
  }
});

// === Methods ===
function send() {
  let text = input.value.trim();
  if (!text) return;

  // Remove slash command from text if present
  if (detectedSlashCommand.value) {
    text = text.slice(detectedSlashCommand.value.command.length).trim();
    if (!text) return; // Don't send if only slash command with no content
  }

  emit("submit", text, selectedType.value, selectedColor.value !== 'default' ? selectedColor.value : undefined);

  // Reset
  input.value = "";
  selectedColor.value = "default";
  showTypePicker.value = false;
  showColorPicker.value = false;
  showEmojiPicker.value = false;

  // Keep focus for rapid note-taking (WhatsApp style)
  nextTick(() => {
    inputEl.value?.focus();
  });
}

function handleKeyDown(e: KeyboardEvent) {
  // Send on Enter (unless Shift+Enter for new line)
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    send();
  }

  // Close type picker on Escape
  if (e.key === "Escape") {
    showTypePicker.value = false;
  }
}

function selectType(type: NoteType) {
  selectedType.value = type;
  showTypePicker.value = false;
  nextTick(() => inputEl.value?.focus());
}

function handleTypePickerKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    e.preventDefault();
    showTypePicker.value = false;
    inputEl.value?.focus();
  } else if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    const type = props.availableTypes[selectedTypeIndex.value];
    if (type) selectType(type);
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    selectedTypeIndex.value = (selectedTypeIndex.value + 1) % props.availableTypes.length;
    typeButtons.value[selectedTypeIndex.value]?.focus();
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    selectedTypeIndex.value = selectedTypeIndex.value === 0
      ? props.availableTypes.length - 1
      : selectedTypeIndex.value - 1;
    typeButtons.value[selectedTypeIndex.value]?.focus();
  }
}

// Auto-resize textarea
function autoResize() {
  if (!inputEl.value) return;
  inputEl.value.style.height = "auto";
  inputEl.value.style.height = `${inputEl.value.scrollHeight}px`;
}

watch(input, autoResize);

// Reset type picker index when menu opens
watch(showTypePicker, (isOpen) => {
  if (isOpen) {
    selectedTypeIndex.value = props.availableTypes.indexOf(selectedType.value);
    if (selectedTypeIndex.value === -1) selectedTypeIndex.value = 0;
  }
});

// Expose focus method for parent components (e.g., Cmd+N shortcut)
defineExpose({
  focus: () => {
    inputEl.value?.focus();
  }
});

// === Emoji support (minimal) ===
const emojis = ["😀", "😄", "😊", "👍", "🔥", "🧠", "✅", "❤️"]; // Keep ordered so tests can pick the first one
function insertEmoji(emoji: string) {
  if (!inputEl.value) return;
  const el = inputEl.value;
  const start = el.selectionStart ?? el.value.length;
  const end = el.selectionEnd ?? el.value.length;
  const before = input.value.slice(0, start);
  const after = input.value.slice(end);
  input.value = `${before}${emoji}${after}`;
  nextTick(() => {
    // place caret after inserted emoji
    const pos = start + emoji.length;
    el.setSelectionRange(pos, pos);
    el.focus();
  });
}
</script>

<template>
  <div class="flex items-end gap-2">
    <!-- Type Picker (if multiple types available) -->
    <div v-if="availableTypes.length > 1" class="relative shrink-0">
      <Button
        variant="secondary"
        size="icon"
        :title="`Note type: ${selectedType}`"
        @click="showTypePicker = !showTypePicker"
      >
        {{ typeIcon }}
      </Button>

      <!-- Type Menu -->
      <Transition
        enter-active-class="transition-all duration-150"
        enter-from-class="opacity-0 scale-95 translate-y-2"
        leave-active-class="transition-all duration-100"
        leave-to-class="opacity-0 scale-95 translate-y-2"
      >
        <div
          v-if="showTypePicker"
          class="absolute bottom-full left-0 mb-2 p-2 bg-base-white dark:bg-dark-bg-primary border-3 border-base-black dark:border-white shadow-hard-xl rounded-sm z-50 min-w-40"
          role="menu"
          aria-label="Note type selection"
          @keydown="handleTypePickerKeydown"
        >
          <button
            v-for="(type, index) in availableTypes"
            :key="type"
            :ref="(el) => { if (el) typeButtons[index] = el as HTMLButtonElement }"
            type="button"
            role="menuitem"
            :aria-label="`Select ${type} note type`"
            class="w-full flex items-center gap-2 px-3 py-2 text-left font-bold text-sm border-2 border-base-black dark:border-white rounded mb-1.5 last:mb-0 transition-all duration-75"
            :class="
              type === selectedType
                ? 'bg-accent-green text-base-black'
                : 'bg-base-white dark:bg-dark-bg-tertiary hover:(bg-accent-yellow -translate-x-0.5)'
            "
            @click="selectType(type)"
          >
            <span class="text-base">{{ getTypeIcon(type) }}</span>
            <span class="uppercase">{{ type }}</span>
            <span v-if="type === selectedType" class="ml-auto text-accent-green">✓</span>
          </button>
        </div>
      </Transition>
    </div>

    <!-- Color Picker -->
    <div class="relative shrink-0">
      <Button
        variant="ghost"
        size="icon"
        :class="selectedColor !== 'default' ? 'ring-2 ring-offset-2' : ''"
        title="Note color"
        @click="showColorPicker = !showColorPicker"
      >
        🎨
      </Button>

      <!-- Color Menu -->
      <Transition
        enter-active-class="transition-all duration-150"
        enter-from-class="opacity-0 scale-95 translate-y-2"
        leave-active-class="transition-all duration-100"
        leave-to-class="opacity-0 scale-95 translate-y-2"
      >
        <div
          v-if="showColorPicker"
          class="absolute bottom-full left-0 mb-2 p-3 bg-base-white dark:bg-dark-bg-primary border-3 border-base-black dark:border-white shadow-hard-xl rounded-sm z-50"
        >
          <ColorPicker v-model="selectedColor" size="md" />
        </div>
      </Transition>
    </div>

    <!-- Emoji Picker -->
    <div class="relative shrink-0">
      <Button
        variant="ghost"
        size="icon"
        title="Emoji"
        aria-label="Emoji"
        @click="showEmojiPicker = !showEmojiPicker"
      >
        Emoji
      </Button>

      <Transition
        enter-active-class="transition-all duration-150"
        enter-from-class="opacity-0 scale-95 translate-y-2"
        leave-active-class="transition-all duration-100"
        leave-to-class="opacity-0 scale-95 translate-y-2"
      >
        <div
          v-if="showEmojiPicker"
          class="absolute bottom-full left-0 mb-2 p-2 bg-base-white dark:bg-dark-bg-primary border-3 border-base-black dark:border-white shadow-hard-xl rounded-sm z-50 min-w-32"
          role="menu"
          aria-label="Emoji picker"
        >
          <button
            v-for="e in emojis"
            :key="e"
            type="button"
            class="inline-flex items-center justify-center w-8 h-8 m-0.5 border-2 border-base-black dark:border-white rounded hover:(-translate-x-0.5 -translate-y-0.5 shadow-hard-sm) transition-all duration-100"
            @click="insertEmoji(e)"
          >
            {{ e }}
          </button>
        </div>
      </Transition>
    </div>

    <!-- Text Input -->
    <div class="flex-1 min-w-0 relative">
      <!-- Slash command indicator -->
      <Transition
        enter-active-class="transition-all duration-150"
        enter-from-class="opacity-0 -translate-y-1"
        leave-active-class="transition-all duration-100"
        leave-to-class="opacity-0 -translate-y-1"
      >
        <div
          v-if="detectedSlashCommand"
          class="absolute -top-7 left-0 flex items-center gap-1.5 px-2 py-1 bg-accent-cyan text-base-black text-2xs font-black border-2 border-base-black rounded shadow-hard-sm"
        >
          <span>⚡</span>
          <span>{{ getTypeIcon(detectedSlashCommand.type) }} {{ detectedSlashCommand.type }}</span>
        </div>
      </Transition>

      <!-- Hashtag indicator -->
      <Transition
        enter-active-class="transition-all duration-150"
        enter-from-class="opacity-0 -translate-y-1"
        leave-active-class="transition-all duration-100"
        leave-to-class="opacity-0 -translate-y-1"
      >
        <div
          v-if="hasHashtags && !detectedSlashCommand"
          class="absolute -top-7 left-0 flex items-center gap-1.5 px-2 py-1 bg-accent-pink text-base-white text-2xs font-black border-2 border-base-black rounded shadow-hard-sm"
        >
          <span>🏷️</span>
          <span>{{ detectedHashtags.length }} tag{{ detectedHashtags.length > 1 ? 's' : '' }}</span>
        </div>
      </Transition>

      <textarea
        ref="inputEl"
        v-model="input"
        class="w-full px-3 sm:px-4 py-2.5 sm:py-3 min-h-[44px] max-h-32 font-bold text-sm sm:text-base bg-base-white dark:bg-dark-bg-tertiary text-base-black dark:text-dark-text-primary border-3 border-base-black dark:border-white rounded-lg resize-none outline-none transition-all duration-100 focus:(shadow-hard border-accent-green) placeholder:opacity-60"
        placeholder="Write your note..."
        aria-label="Write your note..."
        rows="1"
        @keydown="handleKeyDown"
      />
    </div>

    <!-- Send Button -->
    <div class="shrink-0">
      <Button
        variant="primary"
        size="lg"
        class="min-w-[44px] min-h-[44px]"
        :disabled="!canSend"
        aria-label="⚡"
        title="Send message"
        @click="send"
      >
        <span class="text-xl">⚡</span>
      </Button>
    </div>
  </div>
</template>

<style scoped>
/* Smooth textarea resize */
textarea {
  transition: height 0.1s ease-out;
}
</style>
