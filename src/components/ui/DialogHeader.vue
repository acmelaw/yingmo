/** * Dialog Header Component */

<script setup lang="ts">
import { cn } from "@/lib/utils";

export interface DialogHeaderProps {
  class?: string;
}

const props = defineProps<DialogHeaderProps>();
</script>

<template>
  <div
    :class="
      cn(
        'flex items-start justify-between gap-3 sm:gap-4 p-4 sm:p-6 border-b-2 sm:border-b-3 border-base-black dark:border-white',
        props.class
      )
    "
  >
    <slot />
  </div>
</template>
