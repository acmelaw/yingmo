/** * Chord Sheet Editor - edit chord sheets with live transposition */
<script setup lang="ts">
import { ref, computed, watch } from "vue";
import type { ChordSheetNote } from "@/types/note";
import {
  transposeChordSheet,
  detectKey,
  extractChords,
} from "../utils/chordTransposer";
import { Button } from "@/components/ui";

interface Props {
  note: ChordSheetNote;
}

interface Emits {
  (e: "update", updates: Partial<ChordSheetNote>): void;
  (e: "save"): void;
  (e: "cancel"): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Local state
const localContent = ref(props.note.content);
const localTranspose = ref(props.note.metadata?.transpose ?? 0);
const localTitle = ref(props.note.metadata?.title ?? "");
const localArtist = ref(props.note.metadata?.artist ?? "");

// Computed
const displayContent = computed(() => {
  return transposeChordSheet(localContent.value, localTranspose.value);
});

const detectedKey = computed(() => {
  return props.note.metadata?.originalKey ?? detectKey(localContent.value);
});

const chords = computed(() => {
  return extractChords(displayContent.value);
});

// Methods
function updateTranspose(delta: number) {
  const newValue = localTranspose.value + delta;
  if (newValue >= -12 && newValue <= 12) {
    localTranspose.value = newValue;
    emitUpdate();
  }
}

function resetTranspose() {
  localTranspose.value = 0;
  emitUpdate();
}

function emitUpdate() {
  emit("update", {
    content: localContent.value,
    metadata: {
      ...props.note.metadata,
      transpose: localTranspose.value,
      title: localTitle.value || undefined,
      artist: localArtist.value || undefined,
      originalKey: detectedKey.value || undefined,
    },
  });
}

function save() {
  emitUpdate();
  emit("save");
}

function cancel() {
  emit("cancel");
}

// Watch for external changes
watch(
  () => props.note.content,
  (newContent) => {
    localContent.value = newContent;
  }
);

watch(
  () => props.note.metadata?.transpose,
  (newTranspose) => {
    if (newTranspose !== undefined) {
      localTranspose.value = newTranspose;
    }
  }
);
</script>

<template>
  <div class="chord-sheet-editor">
    <!-- Toolbar -->
    <div
      class="toolbar flex flex-wrap items-center gap-2 mb-4 p-3 bg-bg-secondary dark:bg-dark-bg-secondary border-2 border-base-black dark:border-white rounded"
    >
      <!-- Metadata inputs -->
      <input
        v-model="localTitle"
        type="text"
        placeholder="Song title"
        class="px-2 py-1 border-2 border-base-black dark:border-white rounded font-bold text-sm bg-white dark:bg-dark-bg-primary flex-1 min-w-[150px]"
        @input="emitUpdate"
      />
      <input
        v-model="localArtist"
        type="text"
        placeholder="Artist"
        class="px-2 py-1 border-2 border-base-black dark:border-white rounded font-bold text-sm bg-white dark:bg-dark-bg-primary flex-1 min-w-[120px]"
        @input="emitUpdate"
      />

      <!-- Transpose controls -->
      <div
        class="flex items-center gap-2 px-3 py-1.5 bg-accent-cyan border-2 border-base-black dark:border-white rounded"
      >
        <span class="font-black text-xs">Transpose:</span>
        <Button
          size="sm"
          variant="secondary"
          :disabled="localTranspose <= -12"
          title="Transpose down"
          @click="updateTranspose(-1)"
        >
          -
        </Button>
        <span class="font-black text-sm min-w-[40px] text-center">
          {{ localTranspose > 0 ? "+" : "" }}{{ localTranspose }}
        </span>
        <Button
          size="sm"
          variant="secondary"
          :disabled="localTranspose >= 12"
          title="Transpose up"
          @click="updateTranspose(1)"
        >
          +
        </Button>
        <Button
          v-if="localTranspose !== 0"
          size="sm"
          variant="ghost"
          title="Reset transpose"
          @click="resetTranspose"
        >
          Reset
        </Button>
      </div>

      <!-- Detected key -->
      <div
        v-if="detectedKey"
        class="px-2 py-1 bg-accent-yellow border-2 border-base-black dark:border-white rounded font-black text-xs"
      >
        Key: {{ detectedKey }}
      </div>
    </div>

    <!-- Chord palette -->
    <div v-if="chords.length > 0" class="mb-3 flex flex-wrap gap-1.5">
      <span
        v-for="chord in chords"
        :key="chord"
        class="px-2 py-1 bg-accent-blue border-2 border-base-black dark:border-white font-black text-xs rounded cursor-pointer hover:bg-accent-yellow transition-colors"
        :title="`Click to insert ${chord}`"
        @click="localContent += ` [${chord}]`"
      >
        {{ chord }}
      </span>
    </div>

    <!-- Editor -->
    <div class="mb-4">
      <textarea
        v-model="localContent"
        class="w-full h-96 p-4 font-mono text-sm border-3 border-base-black dark:border-white rounded bg-white dark:bg-dark-bg-primary resize-y"
        placeholder="Enter chord sheet...&#10;&#10;Use [C] [Am] [F] [G] for chords&#10;&#10;Example:&#10;[C]Amazing [Am]grace how [F]sweet the [G]sound&#10;[C]That saved a [Am]wretch like [F]me[G]"
        @input="emitUpdate"
      />
      <p class="mt-2 text-xs opacity-70 font-bold">
        💡 Tip: Put chords in brackets like [C] [Am7] [Dsus4]
      </p>
    </div>

    <!-- Preview -->
    <div
      class="mb-4 p-4 bg-bg-secondary dark:bg-dark-bg-secondary border-2 border-base-black dark:border-white rounded"
    >
      <h3 class="font-black text-sm mb-3">Preview:</h3>
      <div class="font-mono text-sm whitespace-pre-wrap">
        {{ displayContent }}
      </div>
    </div>

    <!-- Actions -->
    <div class="flex gap-2 justify-end">
      <Button variant="ghost" @click="cancel"> Cancel </Button>
      <Button variant="primary" @click="save"> 💾 Save </Button>
    </div>
  </div>
</template>

<style scoped>
.chord-sheet-editor {
  @apply w-full;
}

textarea::placeholder {
  @apply opacity-50;
}
</style>
