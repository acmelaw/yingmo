/**
 * Select Component - shadcn-style with UnoCSS
 */

<script setup lang="ts">
import { computed } from 'vue';
import { cn } from '@/lib/utils';

export interface SelectProps {
  modelValue?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const props = withDefaults(defineProps<SelectProps>(), {
  size: 'md',
  disabled: false,
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

const selectClass = computed(() => {
  const base = 'w-full font-bold border-2 sm:border-3 border-base-black dark:border-white bg-base-white dark:bg-dark-bg-primary text-base-black dark:text-dark-text-primary rounded-lg shadow-hard-sm focus:outline-none focus:border-accent-cyan focus:shadow-hard transition-all duration-100 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed appearance-none bg-no-repeat bg-right pr-8';
  
  const sizes = {
    sm: 'px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm',
    md: 'px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base',
    lg: 'px-4 sm:px-5 py-2.5 sm:py-3 text-base sm:text-lg',
  };
  
  return cn(base, sizes[props.size]);
});

function handleChange(e: Event) {
  const target = e.target as HTMLSelectElement;
  emit('update:modelValue', target.value);
}
</script>

<template>
  <div class="relative">
    <select
      :value="modelValue"
      :disabled="disabled"
      :class="selectClass"
      @change="handleChange"
    >
      <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>
      <option
        v-for="option in options"
        :key="option.value"
        :value="option.value"
      >
        {{ option.label }}
      </option>
    </select>
    <div class="pointer-events-none absolute inset-y-0 right-2 flex items-center text-base-black dark:text-dark-text-primary font-black">
      ▼
    </div>
  </div>
</template>
