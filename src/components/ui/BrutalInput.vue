<script setup lang="ts">
import { computed, ref, watch } from 'vue';

interface Props {
  modelValue: string;
  placeholder?: string;
  disabled?: boolean;
  multiline?: boolean;
  rows?: number;
  autofocus?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '',
  disabled: false,
  multiline: false,
  rows: 3,
  autofocus: false,
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'submit'): void;
  (e: 'keydown', event: KeyboardEvent): void;
}>();

const inputRef = ref<HTMLInputElement | HTMLTextAreaElement | null>(null);

const inputValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

function handleKeydown(event: KeyboardEvent) {
  emit('keydown', event);

  // Submit on Enter (without Shift for textarea)
  if (event.key === 'Enter' && (!props.multiline || !event.shiftKey)) {
    if (!props.multiline || event.ctrlKey || event.metaKey) {
      event.preventDefault();
      emit('submit');
    }
  }
}

function focus() {
  inputRef.value?.focus();
}

defineExpose({ focus });

watch(() => props.autofocus, (shouldFocus) => {
  if (shouldFocus) {
    setTimeout(() => focus(), 100);
  }
}, { immediate: true });
</script>

<template>
  <textarea
    v-if="multiline"
    ref="inputRef"
    v-model="inputValue"
    class="input-brutal"
    :placeholder="placeholder"
    :disabled="disabled"
    :rows="rows"
    @keydown="handleKeydown"
  />
  <input
    v-else
    ref="inputRef"
    v-model="inputValue"
    class="input-brutal"
    :placeholder="placeholder"
    :disabled="disabled"
    type="text"
    @keydown="handleKeydown"
  />
</template>
