<template>
  <div
    class="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
  >
    <span class="text-gray-700 dark:text-gray-300">{{ description }}</span>
    <kbd
      class="px-3 py-1.5 text-sm font-mono font-semibold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm"
    >
      {{ keys }}
    </kbd>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  keys: string;
  description: string;
}>();
</script>
