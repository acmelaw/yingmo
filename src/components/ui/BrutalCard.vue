<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  variant?: 'default' | 'sm' | 'lg';
  hover?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  hover: false,
});

const classes = computed(() => {
  const variants = {
    default: 'card-brutal',
    sm: 'card-brutal-sm',
    lg: 'card-brutal-lg',
  };

  return [
    variants[props.variant],
    props.hover && 'card-brutal-hover',
  ].filter(Boolean).join(' ');
});
</script>

<template>
  <div :class="classes">
    <slot />
  </div>
</template>
