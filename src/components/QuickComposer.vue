<!--
  QuickComposer - WhatsApp-style message input
  Simple, fast, mobile-first
-->
<script setup lang="ts">
import { computed, ref, watch, nextTick } from "vue";
import { Button } from "./ui";
import type { NoteType } from "../types/note";

const props = withDefaults(
  defineProps<{
    availableTypes?: NoteType[];
  }>(),
  {
    availableTypes: () => ["text"],
  }
);

const emit = defineEmits<{
  (e: "submit", text: string, type: NoteType): void;
}>();

// === State ===
const input = ref("");
const selectedType = ref<NoteType>("text");
const inputEl = ref<HTMLTextAreaElement | null>(null);
const showTypePicker = ref(false);
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

// === Methods ===
function send() {
  const text = input.value.trim();
  if (!text) return;

  emit("submit", text, selectedType.value);

  // Reset
  input.value = "";
  showTypePicker.value = false;

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

    <!-- Text Input -->
    <div class="flex-1 min-w-0 relative">
      <!-- Hashtag indicator -->
      <Transition
        enter-active-class="transition-all duration-150"
        enter-from-class="opacity-0 -translate-y-1"
        leave-active-class="transition-all duration-100"
        leave-to-class="opacity-0 -translate-y-1"
      >
        <div
          v-if="hasHashtags"
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
        placeholder="Type a message..."
        aria-label="Note content"
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
        :aria-label="`Send ${selectedType} note${!canSend ? ' (enter text first)' : ''}`"
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
