<script setup lang="ts">
import type { Note } from '../stores/notes';
import { useI18n } from 'vue-i18n';

const props = defineProps<{ note: Note }>();
const emit = defineEmits<{ (e: 'delete'): void }>();
const { t } = useI18n();
</script>

<template>
  <article class="note brutal-surface">
    <div class="bubble">
      <p class="text">{{ props.note.text }}</p>
      <time class="time" :title="new Date(props.note.created).toLocaleString()">
        {{ new Date(props.note.created).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}) }}
      </time>
    </div>
    <button class="del" @click="emit('delete')" :aria-label="t('delete')">×</button>
  </article>
</template>

<style scoped>
.note { display: flex; gap: .5rem; align-items: flex-start; padding: .35rem .5rem .5rem; position: relative; }
.bubble {
  flex: 1;
  background: var(--accent-alt);
  border: 2px solid var(--border);
  border-radius: var(--radius);
  padding: .6rem .75rem .55rem;
  box-shadow: 2px 2px 0 #111;
  position: relative;
}
.text { margin: 0 0 .4rem; white-space: pre-wrap; word-wrap: break-word; }
.time { font-size: .65rem; opacity: .7; position: absolute; bottom: 4px; right: 6px; }
.del { background: var(--accent); line-height: 1; padding: .3rem .55rem; align-self: center; }
</style>
