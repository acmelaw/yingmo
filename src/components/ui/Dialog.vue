/** * Dialog Component - shadcn-style with UnoCSS * Modal overlay with backdrop
*/

<script setup lang="ts">
import { computed } from "vue";
import { cn } from "@/lib/utils";

export interface DialogProps {
  open?: boolean;
  size?: "sm" | "md" | "lg" | "xl" | "full";
}

const props = withDefaults(defineProps<DialogProps>(), {
  open: false,
  size: "md",
});

const emit = defineEmits<{
  (e: "close"): void;
}>();

const dialogClass = computed(() => {
  const base =
    "relative bg-base-white dark:bg-dark-bg-primary border-3 sm:border-4 border-base-black dark:border-white shadow-hard-xl dark:shadow-dark-hard-xl rounded-lg overflow-hidden";

  const sizes = {
    sm: "w-full max-w-sm",
    md: "w-full max-w-md sm:max-w-lg",
    lg: "w-full max-w-lg sm:max-w-2xl",
    xl: "w-full max-w-2xl sm:max-w-4xl",
    full: "w-full max-w-[95vw]",
  };

  return cn(base, sizes[props.size]);
});

function handleBackdropClick() {
  emit("close");
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200"
      leave-active-class="transition-opacity duration-150"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="fixed inset-0 z-50 bg-base-black/60 dark:bg-base-black/80 backdrop-blur-sm"
        @click.self="handleBackdropClick"
      >
        <div class="flex items-center justify-center min-h-screen p-4">
          <Transition
            enter-active-class="transition-all duration-200"
            leave-active-class="transition-all duration-150"
            enter-from-class="opacity-0 scale-95 -translate-y-4"
            leave-to-class="opacity-0 scale-95 translate-y-4"
          >
            <div v-if="open" :class="dialogClass" @click.stop>
              <slot />
            </div>
          </Transition>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
