<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

const emit = defineEmits<{ (e: 'submit', text: string): void }>();
const { t } = useI18n();

const draft = ref('');

function send() {
  if (!draft.value.trim()) return;
  emit('submit', draft.value);
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
  <form class="composer" @submit.prevent="send">
    <textarea
      v-model="draft"
      :placeholder="t('placeholder')"
      @keydown="onKey"
    />
    <div class="row">
      <button type="submit">+</button>
    </div>
  </form>
</template>

<style scoped>
.composer { display: flex; flex-direction: column; gap: .5rem; }
.row { display: flex; justify-content: flex-end; }
textarea { font-family: inherit; line-height: 1.3; }
</style>
