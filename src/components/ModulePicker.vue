<script setup lang="ts">
import { computed, ref, onMounted } from "vue";
import { moduleRegistry } from "@/core/ModuleRegistry";
import type { NoteType } from "@/types/note";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogContent,
  Button,
} from "./ui";

const emit = defineEmits<{
  (e: "select", noteType: NoteType): void;
  (e: "close"): void;
}>();

const availableModules = computed(() => {
  return moduleRegistry
    .getAllModules()
    .filter((m) => m.capabilities?.canCreate !== false);
});

const selectedIndex = ref(0);
const moduleButtons = ref<HTMLButtonElement[]>([]);

onMounted(() => {
  if (moduleButtons.value[0]) {
    moduleButtons.value[0].focus();
  }
});

function selectModule(module: any) {
  const noteType = module.supportedTypes[0] as NoteType;
  emit("select", noteType);
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === "ArrowDown") {
    e.preventDefault();
    selectedIndex.value =
      (selectedIndex.value + 1) % availableModules.value.length;
    moduleButtons.value[selectedIndex.value]?.focus();
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    selectedIndex.value =
      selectedIndex.value === 0
        ? availableModules.value.length - 1
        : selectedIndex.value - 1;
    moduleButtons.value[selectedIndex.value]?.focus();
  } else if (e.key === "ArrowRight" && selectedIndex.value % 2 === 0) {
    e.preventDefault();
    if (selectedIndex.value + 1 < availableModules.value.length) {
      selectedIndex.value += 1;
      moduleButtons.value[selectedIndex.value]?.focus();
    }
  } else if (e.key === "ArrowLeft" && selectedIndex.value % 2 === 1) {
    e.preventDefault();
    selectedIndex.value -= 1;
    moduleButtons.value[selectedIndex.value]?.focus();
  }
}

function getIcon(type: NoteType): string {
  const icons: Record<NoteType, string> = {
    text: "📝",
    markdown: "📄",
    code: "💻",
    "rich-text": "✏️",
    image: "🖼️",
    "smart-layer": "🤖",
    todo: "✅",
    "chord-sheet": "🎵",
  };
  return icons[type] || "📋";
}
</script>

<template>
  <Dialog :open="true" size="lg" @close="emit('close')">
    <DialogHeader>
      <div class="flex-1">
        <DialogTitle>Create New Note</DialogTitle>
        <DialogDescription> Choose a format to get started </DialogDescription>
      </div>
      <Button
        variant="ghost"
        size="icon"
        class="shrink-0"
        @click="emit('close')"
      >
        ✕
      </Button>
    </DialogHeader>

    <DialogContent>
      <div
        class="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3"
        role="group"
        aria-label="Note type selection"
        @keydown="handleKeydown"
      >
        <button
          v-for="(module, index) in availableModules"
          :key="module.id"
          :ref="
            (el) => {
              if (el) moduleButtons[index] = el as HTMLButtonElement;
            }
          "
          type="button"
          :aria-label="`Create ${module.name} note - ${module.description}`"
          class="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 text-left border-2 sm:border-3 border-base-black dark:border-white rounded-lg bg-base-white dark:bg-dark-bg-secondary hover:(-translate-x-0.5 -translate-y-0.5) hover:shadow-hard active:(translate-x-0.5 translate-y-0.5) shadow-hard-sm transition-all duration-100 group"
          @click="selectModule(module)"
        >
          <div class="text-3xl sm:text-4xl shrink-0">
            {{ getIcon(module.supportedTypes[0]) }}
          </div>

          <div class="flex-1 min-w-0">
            <div
              class="font-black text-sm sm:text-base uppercase text-base-black dark:text-dark-text-primary"
            >
              {{ module.name }}
            </div>
            <p
              class="text-2xs sm:text-xs mt-0.5 opacity-75 font-bold line-clamp-2"
            >
              {{ module.description }}
            </p>
          </div>

          <div
            class="text-lg sm:text-xl font-black opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all shrink-0"
          >
            →
          </div>
        </button>
      </div>
    </DialogContent>
  </Dialog>
</template>
