/**
 * Universal Note Card Component
 * Renders any note type using module-registered components
 */

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { Note } from '@/types/note';
import { moduleRegistry } from '@/core/ModuleRegistry';

const props = defineProps<{ 
  note: Note;
  mode?: 'view' | 'edit' | 'preview';
}>();

const emit = defineEmits<{ 
  (e: 'delete'): void;
  (e: 'update', updates: Partial<Note>): void;
  (e: 'archive'): void;
  (e: 'transform'): void;
}>();

const { t } = useI18n();

const createdAt = computed(() => new Date(props.note.created));
const updatedAt = computed(() => new Date(props.note.updated));
const timeLabel = computed(() =>
  new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(
    props.note.updated > props.note.created ? updatedAt.value : createdAt.value
  )
);
const titleLabel = computed(() => createdAt.value.toLocaleString());
const wasUpdated = computed(() => props.note.updated > props.note.created);

// Get the appropriate component for this note type
const noteComponent = computed(() => {
  const modules = moduleRegistry.getModulesForType(props.note.type);
  if (modules.length === 0) return null;

  const module = modules[0];
  const mode = props.mode || 'view';

  if (mode === 'edit' && module.components?.editor) {
    return module.components.editor;
  }
  
  if (mode === 'preview' && module.components?.preview) {
    return module.components.preview;
  }

  return module.components?.viewer || null;
});

// Get available actions for this note
const noteActions = computed(() => moduleRegistry.getActionsForNote(props.note));

// Get available transforms for this note type
const noteTransforms = computed(() => moduleRegistry.getTransformsForType(props.note.type));

const hasTransforms = computed(() => noteTransforms.value.length > 0);
</script>

<template>
  <article class="note-card flex items-start gap-3">
    <div class="bubble-surface flex-1 px-3 py-3">
      <!-- Note metadata -->
      <div v-if="note.category || note.tags?.length" class="mb-2 flex flex-wrap gap-2">
        <span
          v-if="note.category"
          class="inline-block rounded bg-ink/10 px-2 py-0.5 text-[0.65rem] font-medium dark:bg-white/10"
        >
          {{ note.category }}
        </span>
        <span
          v-for="tag in note.tags"
          :key="tag"
          class="inline-block rounded bg-accent/20 px-2 py-0.5 text-[0.65rem] font-medium"
        >
          #{{ tag }}
        </span>
        <span
          class="inline-block rounded bg-blue-500/20 px-2 py-0.5 text-[0.65rem] font-medium"
        >
          {{ note.type }}
        </span>
      </div>

      <!-- Note content - dynamically rendered based on type -->
      <component
        v-if="noteComponent"
        :is="noteComponent"
        :note="note"
        :readonly="mode === 'view'"
        @update="(updates: Partial<Note>) => emit('update', updates)"
        class="mb-2"
      />
      <div v-else class="mb-2 text-sm opacity-70">
        Unsupported note type: {{ note.type }}
      </div>

      <!-- Transform indicator -->
      <div v-if="hasTransforms && mode === 'view'" class="mb-2">
        <button
          @click="emit('transform')"
          class="text-xs text-accent hover:underline"
        >
          🔄 {{ noteTransforms.length }} transform{{ noteTransforms.length !== 1 ? 's' : '' }} available
        </button>
      </div>

      <!-- Timestamp -->
      <time
        class="text-[0.68rem] uppercase tracking-wide opacity-70"
        :datetime="(wasUpdated ? updatedAt : createdAt).toISOString()"
        :title="titleLabel"
      >
        {{ timeLabel }}{{ wasUpdated ? ' (edited)' : '' }}
      </time>
    </div>

    <!-- Actions -->
    <div class="flex flex-col gap-2">
      <button
        v-if="mode === 'view'"
        class="chip-brutal grid h-10 w-10 place-items-center text-sm"
        type="button"
        :aria-label="t('archive')"
        @click="emit('archive')"
        title="Archive"
      >
        📦
      </button>
      <button
        class="btn-brutal grid h-10 w-10 place-items-center text-lg"
        type="button"
        :aria-label="t('delete')"
        @click="emit('delete')"
      >
        ×
      </button>
    </div>
  </article>
</template>

<style scoped>
.note-card {
  transition: all 0.2s ease;
}

.note-card:hover {
  transform: translateY(-1px);
}
</style>
