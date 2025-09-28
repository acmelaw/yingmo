<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const emit = defineEmits<{ (e: 'submit', text: string): void }>();
const { t } = useI18n();

const draft = ref('');
const isTyping = computed(() => draft.value.trim().length > 0);

function send() {
  if (!draft.value.trim()) return;
  emit('submit', draft.value.trim());
  draft.value = '';
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    send();
  }
}
</script>

<template>
  <form class="flex flex-col gap-3" @submit.prevent="send">
    <textarea
      v-model="draft"
      class="textarea-brutal"
      :placeholder="t('placeholder')"
      @keydown="onKey"
    />
    <div class="flex items-center justify-end gap-3">
      <span v-if="isTyping" class="text-xs uppercase tracking-wide text-ink/60">{{ t('writing') }}</span>
      <button type="submit" class="btn-brutal grid h-11 w-11 place-items-center text-xl" aria-label="Send note">
        +
      </button>
    </div>
  </form>
</template>
