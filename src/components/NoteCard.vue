/**
 * Universal Note Card Component
 * Renders any note type using module-registered components
 */

<script setup lang="ts">
import { computed, ref } from 'vue';
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

const isEditing = ref(false);

// Use viewAs if set, otherwise use actual type
const displayType = computed(() => props.note.viewAs || props.note.type);

// Get the module for the display type (for viewer)
const displayModule = computed(() => {
  const modules = moduleRegistry.getModulesForType(displayType.value);
  return modules.length > 0 ? modules[0] : null;
});

// Get the module for the actual type (for editor - always edit with original type)
const moduleDefinition = computed(() => {
  const modules = moduleRegistry.getModulesForType(props.note.type);
  return modules.length > 0 ? modules[0] : null;
});

const createdAt = computed(() => new Date(props.note.created));
const updatedAt = computed(() => new Date(props.note.updated));
const timeLabel = computed(() =>
  new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(
    props.note.updated > props.note.created ? updatedAt.value : createdAt.value
  )
);
const titleLabel = computed(() => createdAt.value.toLocaleString());
const wasUpdated = computed(() => props.note.updated > props.note.created);

// Viewer uses display type, editor uses actual type
const viewerComponent = computed(() => displayModule.value?.components?.viewer ?? null);
const editorComponent = computed(() => moduleDefinition.value?.components?.editor ?? null);

const supportsEditing = computed(() => Boolean(editorComponent.value));

// Get available actions for this note
const noteActions = computed(() => moduleRegistry.getActionsForNote(props.note));

// Get available transforms for this note type
const noteTransforms = computed(() => moduleRegistry.getTransformsForType(props.note.type));

const hasTransforms = computed(() => noteTransforms.value.length > 0);

function toggleEdit() {
  if (!supportsEditing.value) return;
  isEditing.value = !isEditing.value;
}
</script>

<template>
  <article class="note-card note-bubble">
    <div class="bubble-content">
      <!-- Note metadata -->
      <div class="note-meta">
        <span
          v-if="note.category"
          class="meta-tag meta-category"
        >
          {{ note.category }}
        </span>
        <span
          v-for="tag in note.tags ?? []"
          :key="tag"
          class="meta-tag meta-hashtag"
        >
          #{{ tag }}
        </span>
        <span
          v-if="note.viewAs"
          class="meta-tag meta-transform"
          :title="`Original type: ${note.type}, viewing as: ${note.viewAs}`"
        >
          🔄 {{ note.type }} → {{ note.viewAs }}
        </span>
        <span
          v-else
          class="meta-tag meta-type"
        >
          {{ note.type }}
        </span>
      </div>

      <!-- Note content - dynamically rendered based on type -->
      <component
        v-if="isEditing && editorComponent"
        :is="editorComponent"
        :note="note"
        :readonly="false"
        @update="(updates: Partial<Note>) => emit('update', updates)"
        class="note-body"
      />
      <component
        v-else-if="viewerComponent"
        :is="viewerComponent"
        :note="note"
        :readonly="true"
        class="note-body"
      />
      <div v-else class="note-body note-error">
        Unsupported note type: {{ note.type }}
      </div>

      <!-- Transform indicator -->
      <div v-if="hasTransforms && mode === 'view'" class="transform-hint">
        <button
          @click="emit('transform')"
          class="transform-btn"
        >
          🔄 {{ noteTransforms.length }} transform{{ noteTransforms.length !== 1 ? 's' : '' }} available
        </button>
      </div>

      <!-- Timestamp -->
      <time
        class="note-timestamp"
        :datetime="(wasUpdated ? updatedAt : createdAt).toISOString()"
        :title="titleLabel"
      >
        {{ timeLabel }}{{ wasUpdated ? ' (edited)' : '' }}
      </time>
    </div>

    <!-- Actions -->
    <div class="note-actions">
      <button
        v-if="supportsEditing"
        class="action-btn"
        type="button"
        :aria-label="isEditing ? t('done') || 'Done' : t('edit') || 'Edit'"
        @click="toggleEdit"
      >
        <span v-if="isEditing">✅</span>
        <span v-else>✏️</span>
      </button>
      <button
        class="action-btn"
        type="button"
        :aria-label="'Transform'"
        @click="emit('transform')"
        title="Transform to different type"
      >
        🔄
      </button>
      <button
        class="action-btn"
        type="button"
        :aria-label="t('archive')"
        @click="emit('archive')"
        title="Archive"
      >
        📦
      </button>
      <button
        class="action-btn action-delete"
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
/* === BRUTAL NOTE CARD - MESSAGE BUBBLE === */
.note-card {
  display: flex;
  align-items: flex-start;
  gap: var(--space-md);
  margin-bottom: var(--space-lg);
  animation: brutal-slide-up 0.15s ease-out;
}

.note-bubble .bubble-content {
  flex: 1;
  background: var(--brutal-white);
  border: var(--brutal-border) solid var(--brutal-border-color);
  border-radius: var(--radius-sm);
  padding: var(--space-lg);
  box-shadow: var(--brutal-shadow);
  transition: all var(--transition-brutal);
}

.note-bubble:hover .bubble-content {
  transform: translate(-2px, -2px);
  box-shadow: var(--brutal-shadow-lg);
}

/* === METADATA TAGS === */
.note-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
  margin-bottom: var(--space-md);
}

.meta-tag {
  display: inline-flex;
  align-items: center;
  padding: var(--space-xs) var(--space-sm);
  font-size: var(--text-xs);
  font-weight: var(--font-black);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border: var(--brutal-border-thin) solid var(--brutal-border-color);
  border-radius: var(--radius-sm);
  box-shadow: var(--brutal-shadow-sm);
}

.meta-category {
  background: var(--brutal-cyan);
  color: var(--brutal-black);
}

.meta-hashtag {
  background: var(--brutal-pink);
  color: var(--brutal-white);
}

.meta-transform {
  background: var(--brutal-purple);
  color: var(--brutal-white);
}

.meta-type {
  background: var(--brutal-green);
  color: var(--brutal-black);
}

/* === NOTE CONTENT === */
.note-body {
  margin-bottom: var(--space-md);
  line-height: var(--line-normal);
  font-weight: var(--font-bold);
}

.note-error {
  font-size: var(--text-sm);
  color: var(--brutal-pink);
  font-style: italic;
  font-weight: var(--font-black);
}

/* === TRANSFORM HINT === */
.transform-hint {
  margin-bottom: var(--space-sm);
}

.transform-btn {
  font-size: var(--text-xs);
  color: var(--brutal-purple);
  text-decoration: underline;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  font-weight: var(--font-black);
  text-transform: uppercase;
  transition: all var(--transition-brutal);
}

.transform-btn:hover {
  color: var(--brutal-pink);
  transform: translateX(2px);
}

/* === TIMESTAMP === */
.note-timestamp {
  display: block;
  font-size: var(--text-xs);
  color: var(--brutal-black);
  opacity: 0.6;
  font-weight: var(--font-black);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* === ACTION BUTTONS === */
.note-actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.action-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--text-base);
  background: var(--brutal-white);
  border: var(--brutal-border) solid var(--brutal-border-color);
  border-radius: var(--radius-sm);
  box-shadow: var(--brutal-shadow-sm);
  cursor: pointer;
  transition: all var(--transition-brutal);
  color: var(--brutal-black);
  font-weight: var(--font-black);
}

.action-btn:hover {
  transform: translate(-1px, -1px);
  box-shadow: var(--brutal-shadow);
  background: var(--brutal-yellow);
}

.action-btn:active {
  transform: translate(1px, 1px);
  box-shadow: none;
}

.action-delete {
  font-size: var(--text-lg);
}

.action-delete:hover {
  background: var(--brutal-pink);
  color: var(--brutal-white);
}
</style>
