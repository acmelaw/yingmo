/** * Dialog Content Component */

<script setup lang="ts">
import { cn } from "@/lib/utils";

export interface DialogContentProps {
  class?: string;
}

const props = defineProps<DialogContentProps>();
</script>

<template>
  <div
    :class="
      cn(
        'p-4 sm:p-6 space-y-3 sm:space-y-4 max-h-[60vh] overflow-y-auto',
        props.class
      )
    "
  >
    <slot />
  </div>
</template>
