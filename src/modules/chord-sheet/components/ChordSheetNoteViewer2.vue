<script setup lang="ts">
import { computed } from "vue";
import {
  detectFormat,
  transposeSheet,
  extractChords,
  extractMetadata,
  convertFormat,
  type ChordFormat,
} from "../formats";
import type { ChordSheetNote } from "@/types/note";

const props = defineProps<{
  note: ChordSheetNote;
}>();

const emit = defineEmits<{
  update: [updates: Partial<ChordSheetNote>];
}>();

// Get metadata and transposed content
const metadata = computed(() => extractMetadata(props.note.content));
const displayContent = computed(() => {
  const transpose = props.note.metadata?.transpose || 0;
  return transposeSheet(props.note.content, transpose);
});

// Detect current format
const currentFormat = computed(() => detectFormat(props.note.content));

// Extract chord palette
const chordPalette = computed(() => extractChords(displayContent.value));

// Cycle through formats
function cycleFormat() {
  const formats: ChordFormat[] = ["inline", "tab", "chordpro"];
  const currentIndex = formats.indexOf(currentFormat.value);
  const nextFormat = formats[(currentIndex + 1) % formats.length];
  const converted = convertFormat(props.note.content, nextFormat);
  emit("update", { content: converted });
}

// Format labels
const formatLabel = computed(() => {
  switch (currentFormat.value) {
    case "inline":
      return "📝 Inline";
    case "tab":
      return "📄 Tab";
    case "chordpro":
      return "🎸 ChordPro";
  }
});

// Parse content for display - using any to avoid TypeScript template issues
const lines = computed((): any[] => {
  const content = displayContent.value;
  const format = currentFormat.value;

  if (format === "tab") {
    // Tab format: highlight chord lines
    return content.split("\n").map((line) => ({
      type: line.includes("|")
        ? "chords"
        : line.startsWith("#")
          ? "lyrics"
          : "plain",
      content: line.replace(/^#\s*/, ""),
    }));
  } else if (format === "chordpro") {
    // ChordPro: parse [C]lyrics
    return content
      .split("\n")
      .filter((l) => !l.match(/^\{[^}]+\}/))
      .map((line) => {
        if (/\[([A-G][#b]?[^\]]*)\]/.test(line)) {
          const parts: Array<{ type: "chord" | "text"; content: string }> = [];
          let lastIndex = 0;

          line.replace(/\[([A-G][#b]?[^\]]*)\]/g, (match, chord, index) => {
            if (index > lastIndex) {
              parts.push({
                type: "text",
                content: line.slice(lastIndex, index),
              });
            }
            parts.push({ type: "chord", content: chord });
            lastIndex = index + match.length;
            return match;
          });

          if (lastIndex < line.length) {
            parts.push({ type: "text", content: line.slice(lastIndex) });
          }

          return { hasChords: true, parts };
        }
        return { hasChords: false, content: line };
      });
  } else {
    // Inline format
    return content.split("\n").map((line) => {
      if (/\[([A-G][#b]?[^\]]*)\]/.test(line)) {
        const parts: Array<{ type: "chord" | "text"; content: string }> = [];
        let lastIndex = 0;

        line.replace(/\[([A-G][#b]?[^\]]*)\]/g, (match, chord, index) => {
          if (index > lastIndex) {
            parts.push({ type: "text", content: line.slice(lastIndex, index) });
          }
          parts.push({ type: "chord", content: chord });
          lastIndex = index + match.length;
          return match;
        });

        if (lastIndex < line.length) {
          parts.push({ type: "text", content: line.slice(lastIndex) });
        }

        return { hasChords: true, parts };
      }
      return { hasChords: false, content: line };
    });
  }
});
</script>

<template>
  <div class="chord-sheet-viewer">
    <!-- Format toggle and metadata -->
    <div class="flex items-center justify-between mb-4">
      <Button variant="outline" size="sm" @click="cycleFormat">
        {{ formatLabel }}
      </Button>

      <!-- Metadata display -->
      <div
        v-if="Object.keys(metadata).length > 0"
        class="text-sm text-gray-600 dark:text-gray-400"
      >
        <span v-if="metadata.title">{{ metadata.title }}</span>
        <span v-if="metadata.artist"> - {{ metadata.artist }}</span>
        <span v-if="metadata.key"> ({{ metadata.key }})</span>
      </div>
    </div>

    <!-- Chord palette -->
    <div v-if="chordPalette.length > 0" class="flex flex-wrap gap-2 mb-4">
      <span
        v-for="chord in chordPalette"
        :key="chord"
        class="px-2 py-1 text-xs font-mono bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded"
      >
        {{ chord }}
      </span>
    </div>

    <!-- Content display -->
    <div v-if="currentFormat === 'tab'" class="font-mono text-sm space-y-1">
      <div v-for="(line, i) in lines" :key="i">
        <div
          v-if="line.type === 'chords'"
          class="text-blue-600 dark:text-blue-400 font-bold"
        >
          {{ line.content }}
        </div>
        <div
          v-else-if="line.type === 'lyrics'"
          class="text-gray-800 dark:text-gray-200"
        >
          {{ line.content }}
        </div>
        <div v-else class="text-gray-500 dark:text-gray-500">
          {{ line.content }}
        </div>
      </div>
    </div>

    <!-- ChordPro/Inline display -->
    <div v-else class="space-y-2">
      <div v-for="(line, i) in lines" :key="i" class="leading-relaxed">
        <template v-if="line.hasChords">
          <span v-for="(part, j) in line.parts" :key="j">
            <span
              v-if="part.type === 'chord'"
              class="inline-block px-1.5 py-0.5 text-xs font-bold bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded mx-0.5"
            >
              {{ part.content }}
            </span>
            <span v-else>{{ part.content }}</span>
          </span>
        </template>
        <template v-else>
          {{ line.content }}
        </template>
      </div>
    </div>
  </div>
</template>
