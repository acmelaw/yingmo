<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  variant?: 'default' | 'primary' | 'secondary' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  icon?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  size: 'md',
  disabled: false,
  type: 'button',
  icon: false,
});

const emit = defineEmits<{
  (e: 'click', event: MouseEvent): void;
}>();

const classes = computed(() => {
  const base = props.icon ? 'btn-icon' : 'btn-brutal';
  const variants = {
    default: '',
    primary: 'btn-brutal-primary',
    secondary: 'btn-brutal-secondary',
    accent: 'btn-brutal-accent',
  };
  const sizes = {
    sm: 'btn-brutal-sm',
    md: '',
    lg: 'btn-brutal-lg',
  };

  return [
    base,
    !props.icon && variants[props.variant],
    !props.icon && sizes[props.size],
  ].filter(Boolean).join(' ');
});

function handleClick(event: MouseEvent) {
  if (!props.disabled) {
    emit('click', event);
  }
}
</script>

<template>
  <button
    :class="classes"
    :type="type"
    :disabled="disabled"
    @click="handleClick"
  >
    <slot />
  </button>
</template>
