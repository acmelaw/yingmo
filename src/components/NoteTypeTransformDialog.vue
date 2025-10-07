/** * Note Type Transform Dialog * Using shadcn-style UI components with UnoCSS
*/

<script setup lang="ts">
import type { NoteType } from "@/types/note";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogContent,
  DialogFooter,
  Button,
  Badge,
} from "./ui";

const props = defineProps<{
  currentType: NoteType | string;
  availableTypes: (NoteType | string)[];
}>();

const emit = defineEmits<{
  (e: "transform", toType: NoteType | string): void;
  (e: "close"): void;
}>();

function getIcon(type: NoteType | string): string {
  const icons: Record<string, string> = {
    text: "📝",
    markdown: "📄",
    code: "💻",
    "rich-text": "✏️",
    image: "🖼️",
    "smart-layer": "🤖",
    "caesar-cipher": "🔐",
  };
  return icons[type] || "📋";
}

function formatTypeName(type: NoteType | string): string {
  const names: Record<string, string> = {
    text: "Text",
    markdown: "Markdown",
    code: "Code",
    "rich-text": "Rich Text",
    image: "Image",
    "smart-layer": "Smart Layer",
    "caesar-cipher": "Caesar Cipher",
  };
  return names[type] || type;
}

function selectType(type: NoteType | string) {
  if (type !== props.currentType) {
    emit("transform", type);
  }
}
</script>

<template>
  <Dialog :open="true" size="lg" @close="emit('close')">
    <DialogHeader>
      <div class="flex items-start gap-3 sm:gap-4 flex-1">
        <div class="text-3xl sm:text-4xl">🔄</div>
        <div class="flex-1">
          <DialogTitle>Change View Mode</DialogTitle>
          <DialogDescription>
            Switch how this note is rendered without touching the source
            content.
          </DialogDescription>
        </div>
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
      <!-- Current Type -->
      <div
        class="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-bg-secondary dark:bg-dark-bg-secondary border-2 border-base-black dark:border-white rounded-lg"
      >
        <span class="text-xs sm:text-sm font-black uppercase opacity-75"
          >Original Type:</span
        >
        <Badge variant="type">
          {{ getIcon(currentType) }} {{ formatTypeName(currentType) }}
        </Badge>
      </div>

      <!-- Info Text -->
      <p class="text-xs sm:text-sm font-bold opacity-75">
        Choose an alternate presentation. You can flip back
        whenever—transformations are completely lossless.
      </p>

      <!-- Type Grid -->
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
        <button
          v-for="type in availableTypes"
          :key="type"
          type="button"
          :disabled="type === currentType"
          class="relative flex flex-col items-center gap-2 p-3 sm:p-4 font-black border-2 sm:border-3 border-base-black dark:border-white rounded-lg transition-all duration-100 disabled:opacity-50 disabled:cursor-not-allowed"
          :class="{
            'bg-accent-green text-base-black shadow-hard': type === currentType,
            'bg-base-white dark:bg-dark-bg-secondary text-base-black dark:text-dark-text-primary shadow-hard-sm hover:(-translate-x-0.5 -translate-y-0.5 shadow-hard) active:(translate-x-0.5 translate-y-0.5 shadow-none)':
              type !== currentType,
          }"
          @click="selectType(type)"
        >
          <span class="text-2xl sm:text-3xl">{{ getIcon(type) }}</span>
          <span class="text-xs sm:text-sm uppercase text-center">{{
            formatTypeName(type)
          }}</span>
          <span
            v-if="type === currentType"
            class="absolute top-1 right-1 text-base-black text-xs"
            >✓</span
          >
        </button>
      </div>

      <!-- Hint -->
      <div
        class="flex items-start gap-2 p-2 sm:p-3 bg-accent-yellow/20 border-2 border-accent-yellow rounded-lg"
      >
        <span class="text-base sm:text-lg shrink-0">💡</span>
        <p class="text-2xs sm:text-xs font-bold">
          View transformations never mutate your data—they're just alternate
          lenses.
        </p>
      </div>
    </DialogContent>

    <DialogFooter>
      <Button variant="secondary" @click="emit('close')"> Cancel </Button>
    </DialogFooter>
  </Dialog>
</template>
