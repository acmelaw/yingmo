/**
 * Badge Component - shadcn-style with UnoCSS
 */

<script setup lang="ts">
import { computed } from 'vue';
import { cn } from '@/lib/utils';

export interface BadgeProps {
  variant?: 'default' | 'tag' | 'category' | 'type' | 'success' | 'error' | 'warning';
}

const props = withDefaults(defineProps<BadgeProps>(), {
  variant: 'default',
});

const badgeClass = computed(() => {
  const base = 'inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 text-2xs sm:text-xs font-black uppercase border-1.5 sm:border-2 border-base-black dark:border-white rounded shadow-hard-sm dark:shadow-dark-hard-sm';

  const variants = {
    default: 'bg-base-white text-base-black',
    tag: 'bg-accent-pink text-base-white',
    category: 'bg-accent-cyan text-base-black',
    type: 'bg-accent-yellow text-base-black',
    success: 'bg-semantic-success text-base-black',
    error: 'bg-semantic-error text-base-white',
    warning: 'bg-semantic-warning text-base-black',
  };

  return cn(base, variants[props.variant]);
});
</script>

<template>
  <span :class="badgeClass">
    <slot />
  </span>
</template>
