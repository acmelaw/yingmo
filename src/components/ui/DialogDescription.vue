/** * Dialog Description Component */

<script setup lang="ts">
import { cn } from "@/lib/utils";

export interface DialogDescriptionProps {
  class?: string;
}

const props = defineProps<DialogDescriptionProps>();
</script>

<template>
  <p
    :class="
      cn(
        'text-xs sm:text-sm text-text-secondary dark:text-dark-text-secondary font-bold mt-1',
        props.class
      )
    "
  >
    <slot />
  </p>
</template>
