<template>
  <div class="chat-container">
    <header class="chat-header flex items-center justify-between gap-3 px-4">
      <slot name="header" />
    </header>

    <div class="flex flex-1 overflow-hidden">
      <!-- Left blade: rooms / navigation -->
      <aside
        v-if="computedShowLeft"
        class="hidden lg:flex w-72 max-w-xs flex-col border-r-[3px] border-base-black dark:border-white bg-bg-secondary dark:bg-dark-bg-secondary shadow-hard-sm overflow-hidden"
      >
        <slot name="left" />
      </aside>

      <!-- Center blade: primary content -->
      <main class="flex-1 flex flex-col overflow-hidden bg-bg-primary dark:bg-dark-bg-primary">
        <slot />
      </main>

      <!-- Right blade: details / metadata -->
      <aside
        v-if="computedShowRight"
        class="hidden xl:flex w-80 max-w-sm flex-col border-l-[3px] border-base-black dark:border-white bg-bg-secondary dark:bg-dark-bg-secondary shadow-hard-sm overflow-hidden"
      >
        <slot name="right" />
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{ showLeft?: boolean; showRight?: boolean }>();

const computedShowLeft = computed(() => props.showLeft ?? true);
const computedShowRight = computed(() => props.showRight ?? true);
</script>

<style scoped>
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
  background: var(--color-bg-primary, #ece5dd);
}
</style>
