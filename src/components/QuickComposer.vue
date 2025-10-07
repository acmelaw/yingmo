<!--
  QuickComposer - WhatsApp-style message input
  Simple, fast, mobile-first
-->
<script setup lang="ts">
import { ref, computed, watch, nextTick } from "vue";
import { storeToRefs } from "pinia";
import { Button, ColorPicker } from "./ui";
import type { NoteType, NoteColor } from "../types/note";
import { moduleRegistry } from "@/core/ModuleRegistry";
import { parseSlashCommand } from "@/core/SlashCommandParser";

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
// REMOVED: selectedType - slash commands now auto-determine type, defaults to "text"
const selectedColor = ref<NoteColor>("default");
const inputEl = ref<HTMLTextAreaElement | null>(null);
// REMOVED: showTypePicker, typeButtons, selectedTypeIndex - no manual type selection
const showColorPicker = ref(false);
const showEmojiPicker = ref(false);

// === Computed ===
const canSend = computed(() => input.value.trim().length > 0);

// Detect hashtags in current input
const detectedHashtags = computed(() => {
  const matches = input.value.match(/#[\p{L}\p{N}_-]+/gu);
  return matches ? [...new Set(matches)] : [];
});

const hasHashtags = computed(() => detectedHashtags.value.length > 0);

// Build slash command map from registered modules
const slashCommandMap = computed(() => {
  const map: Record<string, NoteType> = {};
  const commands = moduleRegistry.getAllSlashCommands();

  commands.forEach(({ command, module }) => {
    const type = module.supportedTypes[0];
    if (type) {
      map[command.command.toLowerCase()] = type;
      command.aliases?.forEach(alias => {
        map[alias.toLowerCase()] = type;
      });
    }
  });

  return map;
});

// Detect slash commands using the parser
const detectedSlashCommand = computed(() => {
  const trimmed = input.value.trim();
  if (!trimmed.startsWith('/')) return null;

  const parsed = parseSlashCommand(trimmed);
  if (!parsed) return null;

  const slashCmd = moduleRegistry.getSlashCommand(parsed.command);
  if (!slashCmd) return null;

  return {
    command: parsed.rawCommand || parsed.command,
    type: slashCmd.module.supportedTypes[0] || 'text'
  };
});

// Helper for slash command indicator
function getTypeIcon(type: NoteType): string {
  const icons: Record<string, string> = {
    text: "📝",
    markdown: "📄",
    code: "💻",
    "rich-text": "✏️",
    image: "🖼️",
    "smart-layer": "🤖",
    todo: "✅",
    "chord-sheet": "🎸",
  };
  return icons[type] || "📋";
}

// NOTE: We do NOT auto-apply slash command types here.
// The slash command detection is only for UI feedback (showing the indicator).
// The actual type resolution happens in handleAdd by parsing the slash command.
// This keeps the architecture pure: slash commands are parsed once, in one place.

// === Methods ===
function send() {
  let text = input.value.trim();
  if (!text) return;

  // DON'T strip slash command - handleAdd needs the full text with k-v parameters
  // The parser in handleAdd will extract command, parameters, and content
  // Type is always "text" - handleAdd will determine actual type from slash command

  emit("submit", text, "text", selectedColor.value !== 'default' ? selectedColor.value : undefined);

  // Reset
  input.value = "";
  selectedColor.value = "default";
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
}

// REMOVED: selectType, handleTypePickerKeydown - no manual type selection

// Auto-resize textarea
function autoResize() {
  if (!inputEl.value) return;
  inputEl.value.style.height = "auto";
  inputEl.value.style.height = `${inputEl.value.scrollHeight}px`;
}

watch(input, autoResize);

// REMOVED: watch(showTypePicker) - no type picker

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
    <div class="flex items-end gap-1.5 sm:gap-2 w-full max-w-4xl">
    <!-- REMOVED: Type selector - slash commands now auto-determine type -->

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
