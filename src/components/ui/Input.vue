/**
 * Input Component - shadcn-style with UnoCSS
 */

<script setup lang="ts">
import { computed, ref } from 'vue';
import { cn } from '@/lib/utils';

export interface InputProps {
  modelValue?: string;
  type?: 'text' | 'search' | 'email' | 'password' | 'number';
  placeholder?: string;
  disabled?: boolean;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const props = withDefaults(defineProps<InputProps>(), {
  type: 'text',
  size: 'md',
  disabled: false,
  readonly: false,
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

const inputElement = ref<HTMLInputElement | null>(null);

const inputClass = computed(() => {
  const base = 'w-full font-bold border-2 sm:border-3 border-base-black dark:border-white bg-base-white dark:bg-dark-bg-primary text-base-black dark:text-dark-text-primary rounded-lg shadow-hard-sm focus:outline-none focus:border-accent-cyan focus:shadow-hard transition-all duration-100 placeholder:opacity-50 disabled:opacity-50 disabled:cursor-not-allowed';

  const sizes = {
    sm: 'px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm',
    md: 'px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base',
    lg: 'px-4 sm:px-5 py-2.5 sm:py-3 text-base sm:text-lg',
  };

  return cn(base, sizes[props.size]);
});

function handleInput(e: Event) {
  const target = e.target as HTMLInputElement;
  emit('update:modelValue', target.value);
}

function focus() {
  inputElement.value?.focus();
}

defineExpose({ focus });
</script>

<template>
  <input
    ref="inputElement"
    :type="type"
    :value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    :readonly="readonly"
    :class="inputClass"
    @input="handleInput"
  />
</template>
