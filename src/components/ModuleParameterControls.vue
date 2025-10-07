/**
 * Module Parameter Controls - Display and edit module parameters
 */
<script setup lang="ts">
import { computed } from 'vue';
import type { Note } from '@/types/note';
import type { ModuleParameter } from '@/types/module';
import { Button } from '@/components/ui';
import { moduleRegistry } from '@/core/ModuleRegistry';

interface Props {
  note: Note;
  compact?: boolean;
}

interface Emits {
  (e: 'update', updates: Partial<Note>): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const parameters = computed(() => {
  return moduleRegistry.getParametersForType(props.note.type);
});

function updateParameter(param: ModuleParameter, value: any) {
  emit('update', {
    metadata: {
      ...props.note.metadata,
      [param.id]: value,
    },
  });
}

function getParameterValue(param: ModuleParameter): any {
  return props.note.metadata?.[param.id] ?? param.defaultValue;
}
</script>

<template>
  <div v-if="parameters.length > 0" :class="[
    'parameter-controls',
    compact ? 'flex flex-wrap gap-2 items-center' : 'space-y-3'
  ]">
    <div
      v-for="param in parameters"
      :key="param.id"
      :class="compact ? 'flex items-center gap-2' : 'space-y-1'"
    >
      <!-- Number input -->
      <div v-if="param.type === 'number'" class="flex items-center gap-2">
        <label :for="`param-${param.id}`" class="text-xs font-bold whitespace-nowrap">
          {{ param.label }}:
        </label>
        <div class="flex items-center gap-1">
          <Button
            v-if="param.min !== undefined"
            size="sm"
            variant="secondary"
            @click="updateParameter(param, Math.max(param.min, getParameterValue(param) - (param.step || 1)))"
            :disabled="getParameterValue(param) <= (param.min ?? -Infinity)"
          >
            -
          </Button>
          <input
            :id="`param-${param.id}`"
            type="number"
            :value="getParameterValue(param)"
            :min="param.min"
            :max="param.max"
            :step="param.step"
            @input="updateParameter(param, Number(($event.target as HTMLInputElement).value))"
            class="w-16 px-2 py-1 text-sm border-2 border-base-black dark:border-white rounded font-bold text-center"
          />
          <Button
            v-if="param.max !== undefined"
            size="sm"
            variant="secondary"
            @click="updateParameter(param, Math.min(param.max, getParameterValue(param) + (param.step || 1)))"
            :disabled="getParameterValue(param) >= (param.max ?? Infinity)"
          >
            +
          </Button>
        </div>
      </div>

      <!-- String input -->
      <div v-else-if="param.type === 'string'" class="flex items-center gap-2">
        <label :for="`param-${param.id}`" class="text-xs font-bold whitespace-nowrap">
          {{ param.label }}:
        </label>
        <input
          :id="`param-${param.id}`"
          type="text"
          :value="getParameterValue(param)"
          @input="updateParameter(param, ($event.target as HTMLInputElement).value)"
          :placeholder="param.description"
          class="flex-1 px-2 py-1 text-sm border-2 border-base-black dark:border-white rounded font-bold"
        />
      </div>

      <!-- Select input -->
      <div v-else-if="param.type === 'select'" class="flex items-center gap-2">
        <label :for="`param-${param.id}`" class="text-xs font-bold whitespace-nowrap">
          {{ param.label }}:
        </label>
        <select
          :id="`param-${param.id}`"
          :value="getParameterValue(param)"
          @change="updateParameter(param, ($event.target as HTMLSelectElement).value)"
          class="px-2 py-1 text-sm border-2 border-base-black dark:border-white rounded font-bold bg-white dark:bg-dark-bg-primary"
        >
          <option
            v-for="option in param.options"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </select>
      </div>

      <!-- Boolean input -->
      <div v-else-if="param.type === 'boolean'" class="flex items-center gap-2">
        <label :for="`param-${param.id}`" class="text-xs font-bold whitespace-nowrap cursor-pointer">
          <input
            :id="`param-${param.id}`"
            type="checkbox"
            :checked="getParameterValue(param)"
            @change="updateParameter(param, ($event.target as HTMLInputElement).checked)"
            class="mr-2"
          />
          {{ param.label }}
        </label>
      </div>
    </div>
  </div>
</template>

<style scoped>
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type="number"] {
  -moz-appearance: textfield;
}
</style>
