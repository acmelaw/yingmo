<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import type { Note } from '../stores/notes';

const props = defineProps<{ note: Note }>();
const emit = defineEmits<{ (e: 'delete'): void }>();
const { t } = useI18n();

const createdAt = computed(() => new Date(props.note.created));
const timeLabel = computed(() =>
  new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(createdAt.value),
);
const titleLabel = computed(() => createdAt.value.toLocaleString());
</script>

<template>
  <article class="flex items-start gap-3">
    <div class="bubble-surface flex-1 px-3 py-3">
      <p class="mb-2 whitespace-pre-wrap break-words text-sm leading-relaxed md:text-base">
        {{ props.note.text }}
      </p>
      <time
        class="text-[0.68rem] uppercase tracking-wide opacity-70"
        :datetime="createdAt.toISOString()"
        :title="titleLabel"
      >
        {{ timeLabel }}
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
