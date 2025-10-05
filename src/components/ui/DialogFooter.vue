/**
 * Dialog Footer Component
 */

<script setup lang="ts">
import { cn } from '@/lib/utils';

export interface DialogFooterProps {
  class?: string;
}

const props = defineProps<DialogFooterProps>();
</script>

<template>
  <div :class="cn('flex items-center justify-end gap-2 sm:gap-3 p-4 sm:p-6 border-t-2 sm:border-t-3 border-base-black dark:border-white bg-bg-secondary dark:bg-dark-bg-secondary', props.class)">
    <slot />
  </div>
</template>
