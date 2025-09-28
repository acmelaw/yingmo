<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useHead } from '@unhead/vue';

import Composer from './Composer.vue';
import NoteItem from './NoteItem.vue';
import { useNotesStore } from '../stores/notes';

const { t } = useI18n();
const store = useNotesStore();
const notes = computed(() => store.notes);

const containerRef = ref<HTMLElement | null>(null);
const appTitle = computed(() => t('appName'));
const empty = computed(() => notes.value.length === 0);

useHead(() => ({
  title: appTitle.value,
  meta: [
    {
      name: 'description',
      content: t('empty'),
    },
  ],
}));

function handleAdd(text: string) {
  if (!text.trim()) return;
  store.add(text.trim());
  nextTick(() => {
    if (containerRef.value) {
      containerRef.value.scrollTo({ top: containerRef.value.scrollHeight, behavior: 'smooth' });
    }
  });
}

function remove(id: string) {
  store.remove(id);
}
</script>

<template>
  <div class="min-h-screen bg-bg text-ink flex justify-center px-4 py-6 md:px-8">
    <div class="w-full max-w-3xl flex flex-col gap-4">
      <header class="surface flex items-center justify-between px-4 py-3 md:px-6 md:py-4">
        <h1 class="text-lg font-semibold tracking-wide">{{ appTitle }}</h1>
      </header>

      <main class="surface flex flex-col gap-4 p-4 md:p-6">
        <div ref="containerRef" class="scroll-y" :data-empty="empty">
          <TransitionGroup name="fade" tag="div" class="flex flex-col gap-3">
            <NoteItem
              v-for="n in notes"
              :key="n.id"
              :note="n"
              @delete="remove(n.id)"
            />
          </TransitionGroup>
          <p v-if="empty" class="text-center text-sm opacity-70 py-8">{{ t('empty') }}</p>
        </div>
        <Composer class="pt-2 border-t border-ink/20" @submit="handleAdd" />
      </main>
    </div>
  </div>
</template>
