/** * Separator Component - shadcn-style with UnoCSS */

<script setup lang="ts">
import { computed } from "vue";
import { cn } from "@/lib/utils";

export interface SeparatorProps {
  orientation?: "horizontal" | "vertical";
  class?: string;
}

const props = withDefaults(defineProps<SeparatorProps>(), {
  orientation: "horizontal",
});

const separatorClass = computed(() => {
  const base = "bg-base-black dark:bg-white shrink-0";

  const orientations = {
    horizontal: "h-0.5 sm:h-1 w-full",
    vertical: "w-0.5 sm:w-1 h-full",
  };

  return cn(base, orientations[props.orientation], props.class);
});
</script>

<template>
  <div
    :class="separatorClass"
    role="separator"
    :aria-orientation="orientation"
  />
</template>
