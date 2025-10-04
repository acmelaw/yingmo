<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import type { Note } from '../stores/notes';

const props = defineProps<{ note: Note }>();
const emit = defineEmits<{ (e: 'delete'): void }>();
const { t } = useI18n();

const createdAt = computed(() => new Date(props.note.created));
const updatedAt = computed(() => new Date(props.note.updated));
const timeLabel = computed(() =>
  new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(
    props.note.updated > props.note.created ? updatedAt.value : createdAt.value
  ),
);
const titleLabel = computed(() => createdAt.value.toLocaleString());
const wasUpdated = computed(() => props.note.updated > props.note.created);
</script>

<template>
  <article class="flex items-start gap-3">
    <div class="bubble-surface flex-1 px-3 py-3">
      <div v-if="note.category || note.tags?.length" class="mb-2 flex flex-wrap gap-2">
        <span
          v-if="note.category"
          class="inline-block rounded bg-ink/10 px-2 py-0.5 text-[0.65rem] font-medium dark:bg-white/10"
        >
          {{ note.category }}
        </span>
        <span
          v-for="tag in note.tags"
          :key="tag"
          class="inline-block rounded bg-accent/20 px-2 py-0.5 text-[0.65rem] font-medium"
        >
          #{{ tag }}
        </span>
      </div>
      <p class="mb-2 whitespace-pre-wrap break-words text-sm leading-relaxed md:text-base">
        {{ props.note.text }}
      </p>
      <time
        class="text-[0.68rem] uppercase tracking-wide opacity-70"
        :datetime="(wasUpdated ? updatedAt : createdAt).toISOString()"
        :title="titleLabel"
      >
        {{ timeLabel }}{{ wasUpdated ? ' (edited)' : '' }}
      </time>
    </div>
    <button
      class="btn-brutal grid h-10 w-10 place-items-center text-lg"
      type="button"
      :aria-label="t('delete')"
      @click="emit('delete')"
    >
      ×
    </button>
  </article>
</template>
