/** * View As Selector - Inline type switcher for notes * Replaces transform
dialog with immediate view switching */
<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { moduleRegistry } from "@/core/ModuleRegistry";
import type { NoteType } from "@/types/note";

const props = defineProps<{
  currentType: NoteType;
  viewAs?: NoteType;
}>();

const emit = defineEmits<{
  (e: "change", type: NoteType): void;
}>();

const showMenu = ref(false);
const menuRef = ref<HTMLElement | null>(null);

const displayType = computed(() => props.viewAs || props.currentType);

// Get all available view types
const availableTypes = computed(() => {
  const types = Array.from(
    new Set([
      "text",
      "markdown",
      "code",
      ...moduleRegistry
        .getAllModules()
        .map((m) => m.supportedTypes)
        .flat(),
    ])
  ) as NoteType[];
  return types;
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
    "chord-sheet": "🎸",
    "caesar-cipher": "🔐",
  };
  return icons[type] || "📋";
}

function selectType(type: NoteType) {
  emit("change", type);
  showMenu.value = false;
}

// Close menu when clicking outside
function handleClickOutside(event: MouseEvent) {
  if (menuRef.value && !menuRef.value.contains(event.target as Node)) {
    showMenu.value = false;
  }
}

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
});
</script>

<template>
  <div ref="menuRef" class="relative inline-block">
    <!-- Current view badge (clickable) -->
    <button
      type="button"
      class="flex items-center gap-1 px-2 py-0.5 text-2xs font-black uppercase bg-bg-secondary dark:bg-dark-bg-secondary border-2 border-base-black dark:border-white rounded cursor-pointer hover:bg-accent-yellow transition-all"
      :title="`View as: ${displayType}. Click to change view.`"
      @click="showMenu = !showMenu"
    >
      <span>{{ getTypeIcon(displayType) }}</span>
      <span>{{ displayType }}</span>
      <span class="text-[8px] opacity-60">▾</span>
    </button>

    <!-- Dropdown menu -->
    <Transition
      enter-active-class="transition-all duration-150"
      enter-from-class="opacity-0 scale-95 translate-y-1"
      leave-active-class="transition-all duration-100"
      leave-to-class="opacity-0 scale-95 translate-y-1"
    >
      <div
        v-if="showMenu"
        class="absolute top-full left-0 mt-1 p-1.5 bg-base-white dark:bg-dark-bg-primary border-3 border-base-black dark:border-white shadow-hard-xl rounded-sm z-[9999] min-w-32"
        @click.stop
      >
        <div class="text-2xs font-black uppercase opacity-60 px-2 py-1 mb-1">
          View as:
        </div>
        <button
          v-for="type in availableTypes"
          :key="type"
          type="button"
          class="w-full flex items-center gap-2 px-2 py-1.5 text-left font-bold text-xs border-2 border-base-black dark:border-white rounded mb-1 last:mb-0 transition-all duration-75"
          :class="
            type === displayType
              ? 'bg-accent-green text-base-black'
              : 'bg-base-white dark:bg-dark-bg-tertiary hover:(bg-accent-yellow -translate-x-0.5)'
          "
          @click="selectType(type)"
        >
          <span>{{ getTypeIcon(type) }}</span>
          <span class="uppercase">{{ type }}</span>
          <span v-if="type === displayType" class="ml-auto">✓</span>
        </button>
      </div>
    </Transition>
  </div>
</template>
