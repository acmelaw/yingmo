<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useHead } from '@unhead/vue';

import Composer, { type ComposerAction } from './Composer.vue';
import NoteItem from './NoteItem.vue';
import { useNotesStore } from '../stores/notes';

const { t } = useI18n();
const store = useNotesStore();
const notes = computed(() => store.notes);

const containerRef = ref<HTMLElement | null>(null);
const composerOpen = ref(true);
const composerFocusKey = ref(1);

const appTitle = computed(() => t('appName'));
const empty = computed(() => notes.value.length === 0);
const fabLabel = computed(() => t('openComposer'));

const composerActions = computed<ComposerAction[]>(() => [
  {
    id: 'check',
    label: t('insertCheck'),
    icon: '✅',
    onTrigger: (ctx) => {
      ctx.append(' ✅');
      ctx.focus();
    },
  },
]);

useHead(() => ({
  title: appTitle.value,
  meta: [
    {
      name: 'description',
      content: t('empty'),
    },
  ],
}));

function scrollToLatest() {
  if (containerRef.value) {
    containerRef.value.scrollTo({
      top: containerRef.value.scrollHeight,
      behavior: 'smooth',
    });
  }
}

function handleAdd(text: string) {
  if (!text.trim()) return;
  store.add(text.trim());
  nextTick(() => {
    scrollToLatest();
  });
}

function remove(id: string) {
  store.remove(id);
}

function closeComposer() {
  composerOpen.value = false;
}

function openComposer() {
  composerOpen.value = true;
  nextTick(() => {
    composerFocusKey.value += 1;
  });
}

</script>

<template>
  <div class="relative min-h-screen bg-bg text-ink">
    <div class="mx-auto flex min-h-screen flex-col px-4 pb-28 pt-6 md:px-8">
      <div class="relative mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4">
        <header class="surface sticky top-4 z-30 flex items-center justify-between gap-3 px-4 py-3 md:px-6 md:py-4">
          <h1 class="text-lg font-semibold tracking-wide">{{ appTitle }}</h1>
          <button
            type="button"
            class="chip-brutal hidden h-10 rounded-full px-4 text-sm font-semibold md:inline-flex md:items-center md:gap-2"
            :aria-label="composerOpen ? t('closeComposer') : t('openComposer')"
            @click="composerOpen ? closeComposer() : openComposer()"
          >
            <span aria-hidden="true">{{ composerOpen ? '−' : '+' }}</span>
            <span>{{ composerOpen ? t('closeComposer') : t('openComposer') }}</span>
          </button>
        </header>

        <main class="surface flex min-h-0 flex-1 flex-col gap-4 p-4 md:p-6">
          <div ref="containerRef" class="scroll-y pb-40" :data-empty="empty">
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
        </main>
      </div>
    </div>

    <Transition name="fade">
      <div
        v-if="composerOpen"
        class="fixed inset-x-4 bottom-6 z-40 flex justify-center md:bottom-8"
      >
        <Composer
          :actions="composerActions"
          :focus-key="composerFocusKey"
          class="w-full max-w-3xl md:w-[36rem]"
          @submit="handleAdd"
          @close="closeComposer"
        />
      </div>
    </Transition>

    <Transition name="fade">
      <button
        v-if="!composerOpen"
        class="fab-brutal fixed bottom-6 right-6 z-40 md:bottom-8 md:right-10"
        type="button"
        :aria-label="fabLabel"
        @click="openComposer"
      >
        +
      </button>
    </Transition>
  </div>
</template>
