<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  variant?: 'default' | 'primary' | 'secondary' | 'accent';
  removable?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  removable: false,
});

const emit = defineEmits<{
  (e: 'remove'): void;
  (e: 'click'): void;
}>();

const classes = computed(() => {
  const variants = {
    default: 'chip-brutal',
    primary: 'chip-brutal chip-brutal-primary',
    secondary: 'chip-brutal chip-brutal-secondary',
    accent: 'chip-brutal chip-brutal-accent',
  };

  return variants[props.variant];
});
</script>

<template>
  <span :class="classes" @click="emit('click')">
    <slot />
    <button
      v-if="removable"
      class="ml-1 text-xs opacity-70 hover:opacity-100"
      type="button"
      @click.stop="emit('remove')"
    >
      ×
    </button>
  </span>
</template>
