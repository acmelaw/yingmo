/**
 * Chord Sheet Viewer - displays chord sheets with transposition
 */
<script setup lang="ts">
import { computed } from 'vue';
import type { ChordSheetNote } from '@/types/note';
import { transposeChordSheet, extractChords, isPlainTextFormat, bracketToPlainText, plainTextToBracket } from '../utils/chordTransposer';
import { parseSlashCommand } from '@/core/SlashCommandParser';
import Button from '@/components/ui/Button.vue';

interface Props {
  note: ChordSheetNote;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  update: [note: Partial<ChordSheetNote>];
}>();

// Parse slash command from content to extract parameters and actual content
const parsedContent = computed(() => {
  const parsed = parseSlashCommand(props.note.content);
  if (parsed && (parsed.command === '/chords' || parsed.command === '/chord' || parsed.command === '/guitar')) {
    return {
      parameters: parsed.parameters,
      content: parsed.content
    };
  }
  // No slash command, use content as-is
  return {
    parameters: {},
    content: props.note.content
  };
});

// Transpose from slash command parameters or metadata (fallback)
const transpose = computed(() =>
  parsedContent.value.parameters.transpose ?? props.note.metadata?.transpose ?? 0
);

// Other parameters from slash command
const key = computed(() => parsedContent.value.parameters.key);
const artist = computed(() => parsedContent.value.parameters.artist);
const title = computed(() => parsedContent.value.parameters.title);

const displayContent = computed(() => {
  return transposeChordSheet(parsedContent.value.content, transpose.value);
});

const chords = computed(() => {
  return extractChords(displayContent.value);
});

const isPlainText = computed(() => isPlainTextFormat(displayContent.value));

// Type definitions for parsed lines
type PlainTextLine = {
  type: 'chords' | 'lyrics' | 'plain';
  content: string;
};

type BracketLine = {
  hasChords: true;
  parts: Array<{ type: 'chord' | 'text'; content: string }>;
} | {
  hasChords: false;
  content: string;
};

// Toggle between plain text and bracket format
function toggleFormat() {
  const currentContent = props.note.content;
  const newContent = isPlainText.value
    ? plainTextToBracket(currentContent)
    : bracketToPlainText(currentContent);

  emit('update', { content: newContent });
}

// Parse content into lines with chords and lyrics
const parsedLines = computed((): PlainTextLine[] | BracketLine[] => {
  const content = displayContent.value;
  const lines = content.split('\n');

  // If plain text format, just return lines as-is for monospace display
  if (isPlainText.value) {
    return lines.map(line => {
      const isChordLine = !line.trim().startsWith('#') && /[A-G][#b]?/.test(line);
      const isLyricLine = line.trim().startsWith('#');

      return {
        type: isChordLine ? 'chords' as const : isLyricLine ? 'lyrics' as const : 'plain' as const,
        content: isLyricLine ? line.replace(/^#\s*/, '') : line
      };
    });
  }

  // Bracket format - parse into chord/text parts
  return lines.map(line => {
    // Check if line contains chords
    const hasChords = /\[([A-G][#b]?[^\]]*)\]/.test(line);

    if (hasChords) {
      // Split line into chord and lyric parts
      const parts: Array<{ type: 'chord' | 'text', content: string }> = [];
      let lastIndex = 0;

      const regex = /\[([A-G][#b]?[^\]]*)\]/g;
      let match;

      while ((match = regex.exec(line)) !== null) {
        // Add text before chord
        if (match.index > lastIndex) {
          parts.push({
            type: 'text',
            content: line.substring(lastIndex, match.index)
          });
        }

        // Add chord
        parts.push({
          type: 'chord',
          content: match[1]
        });

        lastIndex = regex.lastIndex;
      }

      // Add remaining text
      if (lastIndex < line.length) {
        parts.push({
          type: 'text',
          content: line.substring(lastIndex)
        });
      }

      return { hasChords: true as const, parts };
    }

    return { hasChords: false as const, content: line };
  });
});
</script>

<template>
  <div class="chord-sheet-viewer">
    <!-- Song metadata from slash command parameters -->
    <div v-if="title || artist" class="mb-4 pb-3 border-b-2 border-base-black dark:border-white">
      <h2 v-if="title" class="text-xl font-black mb-1">
        {{ title }}
      </h2>
      <p v-if="artist" class="text-sm font-bold opacity-70">
        {{ artist }}
      </p>
    </div>

    <!-- Transpose indicator and format toggle -->
    <div class="mb-3 flex items-center gap-2 flex-wrap">
      <div v-if="transpose !== 0" class="px-3 py-1.5 bg-accent-cyan border-2 border-base-black dark:border-white inline-block font-black text-xs rounded">
        ⚡ Transposed {{ transpose > 0 ? '+' : '' }}{{ transpose }} semitones
        <span v-if="key">
          (Key: {{ key }})
        </span>
      </div>

      <Button
        @click="toggleFormat"
        size="sm"
        variant="secondary"
        class="font-black text-xs"
      >
        {{ isPlainText ? '📝 Switch to Inline' : '📄 Switch to Tab Format' }}
      </Button>
    </div>

    <!-- Chord palette -->
    <div v-if="chords.length > 0" class="mb-4 flex flex-wrap gap-1.5">
      <span
        v-for="chord in chords"
        :key="chord"
        class="px-2 py-1 bg-accent-yellow border-2 border-base-black dark:border-white font-black text-xs rounded"
      >
        {{ chord }}
      </span>
    </div>

    <!-- Chord sheet content -->
    <div class="chord-sheet-content font-mono text-sm leading-relaxed">
      <!-- Plain text tab format -->
      <template v-if="isPlainText">
        <div v-for="(line, index) in parsedLines as PlainTextLine[]" :key="index" class="mb-1">
          <div
            v-if="line.type === 'chords'"
            class="text-accent-blue font-black"
          >
            {{ line.content }}
          </div>
          <div
            v-else-if="line.type === 'lyrics'"
            class="ml-0 opacity-90"
          >
            {{ line.content }}
          </div>
          <div v-else>
            {{ line.content }}
          </div>
        </div>
      </template>

      <!-- Bracket format with inline chords -->
      <template v-else>
        <div v-for="(line, index) in parsedLines as BracketLine[]" :key="index" class="mb-2">
          <div v-if="line.hasChords" class="chord-line">
            <span v-for="(part, pIndex) in line.parts" :key="pIndex">
              <span
                v-if="part.type === 'chord'"
                class="chord inline-block px-1.5 py-0.5 bg-accent-blue text-base-black border-2 border-base-black dark:border-white font-black text-xs rounded mx-0.5"
              >
                {{ part.content }}
              </span>
              <span v-else class="lyric">{{ part.content }}</span>
            </span>
          </div>
          <div v-else class="lyric-line">
            {{ line.content }}
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.chord-sheet-viewer {
  @apply p-4;
}

.chord-sheet-content {
  white-space: pre-wrap;
  word-break: break-word;
}

.chord-line {
  @apply mb-1;
}

.lyric-line {
  @apply mb-1 ml-1;
}

.chord {
  vertical-align: top;
}
</style>
