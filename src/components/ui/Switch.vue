/**
 * Switch Component - shadcn-style with UnoCSS
 */

<script setup lang="ts">
import { computed } from 'vue';
import { cn } from '@/lib/utils';

export interface SwitchProps {
  modelValue?: boolean;
  disabled?: boolean;
}

const props = withDefaults(defineProps<SwitchProps>(), {
  modelValue: false,
  disabled: false,
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
}>();

function toggle() {
  if (!props.disabled) {
    emit('update:modelValue', !props.modelValue);
  }
}
</script>

<template>
  <button
    type="button"
    role="switch"
    :aria-checked="modelValue"
    :disabled="disabled"
    @click="toggle"
    :class="cn(
      'relative inline-flex h-6 sm:h-7 w-11 sm:w-13 shrink-0 cursor-pointer items-center rounded-full border-2 sm:border-3 border-base-black dark:border-white transition-all duration-100 disabled:cursor-not-allowed disabled:opacity-50',
      modelValue ? 'bg-accent-green' : 'bg-base-white dark:bg-dark-bg-tertiary'
    )"
  >
    <span
      :class="cn(
        'pointer-events-none block h-4 sm:h-5 w-4 sm:w-5 rounded-full bg-base-white border-2 border-base-black dark:border-white shadow-hard-sm transition-transform duration-100',
        modelValue ? 'translate-x-6 sm:translate-x-7' : 'translate-x-0.5'
      )"
    />
  </button>
</template>
