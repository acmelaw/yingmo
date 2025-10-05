/**
 * Button Component - shadcn-style with UnoCSS
 * Supports variants and sizes
 */

<script setup lang="ts">
import { computed } from 'vue';
import { cn } from '@/lib/utils';

export interface ButtonProps {
  variant?: 'default' | 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

const props = withDefaults(defineProps<ButtonProps>(), {
  variant: 'default',
  size: 'md',
  type: 'button',
  disabled: false,
});

const buttonClass = computed(() => {
  const base = 'inline-flex items-center justify-center font-black uppercase tracking-wide border-2 sm:border-3 border-base-black dark:border-white transition-all duration-100 cursor-pointer touch-manipulation select-none disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none';
  
  const variants = {
    default: 'bg-base-white text-base-black hover:(-translate-x-0.5 -translate-y-0.5) active:(translate-x-0.5 translate-y-0.5) shadow-hard hover:shadow-hard-hover active:shadow-hard-active dark:(bg-dark-bg-primary text-dark-text-primary shadow-dark-hard hover:shadow-dark-hard-hover active:shadow-dark-hard-active)',
    primary: 'bg-accent-green text-base-black hover:(-translate-x-0.5 -translate-y-0.5 bg-accent-cyan) active:(translate-x-0.5 translate-y-0.5) shadow-hard hover:shadow-hard-hover active:shadow-hard-active dark:(shadow-dark-hard hover:shadow-dark-hard-hover active:shadow-dark-hard-active)',
    secondary: 'bg-accent-cyan text-base-black hover:(-translate-x-0.5 -translate-y-0.5 bg-accent-yellow) active:(translate-x-0.5 translate-y-0.5) shadow-hard hover:shadow-hard-hover active:shadow-hard-active dark:(shadow-dark-hard hover:shadow-dark-hard-hover active:shadow-dark-hard-active)',
    danger: 'bg-accent-pink text-base-white hover:(-translate-x-0.5 -translate-y-0.5 bg-semantic-error) active:(translate-x-0.5 translate-y-0.5) shadow-hard hover:shadow-hard-hover active:shadow-hard-active dark:(shadow-dark-hard hover:shadow-dark-hard-hover active:shadow-dark-hard-active)',
    ghost: 'bg-transparent text-base-black dark:text-dark-text-primary hover:bg-base-black/10 dark:hover:bg-white/10 border-transparent',
    outline: 'bg-transparent text-base-black dark:text-dark-text-primary hover:bg-base-black hover:text-base-white dark:hover:bg-white dark:hover:text-base-black',
  };
  
  const sizes = {
    sm: 'px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm gap-1 min-h-[36px] rounded-md',
    md: 'px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 text-sm sm:text-base gap-1.5 sm:gap-2 min-h-[44px] rounded-md sm:rounded-lg',
    lg: 'px-4 sm:px-6 md:px-8 py-3 sm:py-4 text-base sm:text-lg gap-2 sm:gap-2.5 min-h-[48px] rounded-lg',
    icon: 'w-11 h-11 sm:w-12 sm:h-12 min-w-[44px] min-h-[44px] text-lg sm:text-xl rounded-md sm:rounded-lg',
  };
  
  return cn(base, variants[props.variant], sizes[props.size]);
});
</script>

<template>
  <button
    :type="type"
    :disabled="disabled"
    :class="buttonClass"
  >
    <slot />
  </button>
</template>
