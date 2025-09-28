<script setup lang="ts">
import { ref, computed, nextTick } from 'vue';
import { useNotesStore } from '../stores/notes';
import NoteItem from './NoteItem.vue';
import Composer from './Composer.vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const store = useNotesStore();

const containerRef = ref<HTMLElement | null>(null);

function handleAdd(text: string) {
  if (!text.trim()) return;
  store.add(text.trim());
  nextTick(() => {
    if (containerRef.value) {
      containerRef.value.scrollTop = containerRef.value.scrollHeight;
    }
  });
}

function remove(id: string) {
  store.remove(id);
}

const empty = computed(() => store.notes.length === 0);
</script>

<template>
  <div class="layout">
    <header class="app-header brutal-surface">
      <h1>{{ t('appName') }}</h1>
    </header>
    <main class="main brutal-surface">
      <div ref="containerRef" class="notes" :data-empty="empty">
        <TransitionGroup name="fade" tag="div">
          <NoteItem
            v-for="n in store.notes"
            :key="n.id"
            :note="n"
            @delete="remove(n.id)"
          />
        </TransitionGroup>
        <p v-if="empty" class="empty">{{ t('empty') }}</p>
      </div>
      <Composer @submit="handleAdd" />
    </main>
  </div>
</template>

<style scoped>
.layout {
  flex: 1;
  display: grid;
  grid-template-rows: auto 1fr;
  padding: var(--gap);
  gap: var(--gap);
  max-width: 900px;
  margin: 0 auto;
  width: 100%;
}
.app-header {
  padding: 0.85rem 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.app-header h1 { font-size: 1.15rem; margin: 0; letter-spacing: .5px; }

.main { display: flex; flex-direction: column; padding: var(--gap); gap: var(--gap); }

.notes {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--gap);
  padding: .25rem .25rem 0 .25rem;
  position: relative;
}
.empty {
  margin: 0;
  opacity: 0.6;
  font-size: 0.9rem;
  text-align: center;
  padding: 2rem 1rem;
}
</style>
