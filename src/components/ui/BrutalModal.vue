<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue';

interface Props {
  modelValue: boolean;
  closeOnEscape?: boolean;
  closeOnClickOutside?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  closeOnEscape: true,
  closeOnClickOutside: true,
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'close'): void;
}>();

const modalRef = ref<HTMLElement | null>(null);

function close() {
  emit('update:modelValue', false);
  emit('close');
}

function handleEscape(event: KeyboardEvent) {
  if (props.closeOnEscape && event.key === 'Escape' && props.modelValue) {
    close();
  }
}

function handleClickOutside(event: MouseEvent) {
  if (
    props.closeOnClickOutside &&
    props.modelValue &&
    modalRef.value &&
    !modalRef.value.contains(event.target as Node)
  ) {
    close();
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleEscape);
  document.addEventListener('mousedown', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscape);
  document.removeEventListener('mousedown', handleClickOutside);
});

// Prevent body scroll when modal is open
watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
});
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="modelValue" class="modal-overlay">
        <Transition name="slide-up">
          <div v-if="modelValue" ref="modalRef" class="modal-brutal">
            <slot :close="close" />
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
