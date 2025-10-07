/** * Dialog Title Component */

<script setup lang="ts">
import { cn } from "@/lib/utils";

export interface DialogTitleProps {
  class?: string;
}

const props = defineProps<DialogTitleProps>();
</script>

<template>
  <h3
    :class="
      cn('text-lg sm:text-xl font-black uppercase tracking-wide', props.class)
    "
  >
    <slot />
  </h3>
</template>
