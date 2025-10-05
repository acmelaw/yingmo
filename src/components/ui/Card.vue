/**
 * Card Component - shadcn-style with UnoCSS
 */

<script setup lang="ts">
import { computed } from 'vue';
import { cn } from '@/lib/utils';

export interface CardProps {
  variant?: 'default' | 'elevated' | 'outline';
  class?: string;
}

const props = withDefaults(defineProps<CardProps>(), {
  variant: 'default',
});

const cardClass = computed(() => {
  const base = 'rounded-lg sm:rounded-xl overflow-hidden';
  
  const variants = {
    default: 'bg-base-white dark:bg-dark-bg-secondary border-2 sm:border-3 border-base-black dark:border-white shadow-hard',
    elevated: 'bg-base-white dark:bg-dark-bg-secondary border-2 sm:border-3 border-base-black dark:border-white shadow-hard-lg',
    outline: 'bg-transparent border-2 sm:border-3 border-base-black dark:border-white',
  };
  
  return cn(base, variants[props.variant], props.class);
});
</script>

<template>
  <div :class="cardClass">
    <slot />
  </div>
</template>
