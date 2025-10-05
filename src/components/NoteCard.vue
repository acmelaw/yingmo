/**
 * Universal Note Card Component - WhatsApp Style
 */
<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import type { Note } from '@/types/note';
import { moduleRegistry } from '@/core/ModuleRegistry';
import { Badge, Button } from '@/components/ui';

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

const displayType = computed(() => props.note.viewAs || props.note.type);
const hasCategory = computed(() => Boolean(props.note.category));
const showTransformBadge = computed(() => Boolean(props.note.viewAs));

const displayModule = computed(() => {
  const modules = moduleRegistry.getModulesForType(displayType.value);
  return modules.length > 0 ? modules[0] : null;
});

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

const viewerComponent = computed(() => displayModule.value?.components?.viewer ?? null);
const editorComponent = computed(() => moduleDefinition.value?.components?.editor ?? null);
const supportsEditing = computed(() => Boolean(editorComponent.value));

const noteActions = computed(() => moduleRegistry.getActionsForNote(props.note));
const noteTransforms = computed(() => moduleRegistry.getTransformsForType(props.note.type));
const hasTransforms = computed(() => noteTransforms.value.length > 0);

function toggleEdit() {
  if (!supportsEditing.value) return;
  isEditing.value = !isEditing.value;
}
</script>

<template>
  <article class="note-card flex items-start gap-2 sm:gap-2.5 mb-2 sm:mb-3 op-0 translate-y-10px animate-[slide-up_0.2s_ease-out_forwards]">
    <!-- Message Bubble (WhatsApp style) -->
    <div class="msg-out flex-1">
      <!-- Metadata badges at top -->
      <div class="flex flex-wrap gap-1 sm:gap-1.5 mb-2">
        <Badge v-if="hasCategory" variant="category">{{ note.category }}</Badge>
        <Badge v-for="tag in note.tags ?? []" :key="tag" variant="tag">#{{ tag }}</Badge>
        <Badge
          v-if="showTransformBadge"
          variant="type"
          :title="`Original: ${note.type}, viewing as: ${displayType}`"
        >
          🔄 {{ note.type }} → {{ displayType }}
        </Badge>
        <Badge v-else variant="type">{{ displayType }}</Badge>
      </div>

      <!-- Note content (editable or view mode) -->
      <component
        v-if="isEditing && editorComponent"
        :is="editorComponent"
        :note="note"
        :readonly="false"
        @update="(updates: Partial<Note>) => emit('update', updates)"
        class="mb-2 text-sm sm:text-base"
      />
      <component
        v-else-if="viewerComponent"
        :is="viewerComponent"
        :note="note"
        :readonly="true"
        class="mb-2 text-sm sm:text-base"
      />
      <div v-else class="mb-2 text-brutal-pink text-xs sm:text-sm font-black">
        ⚠️ Unsupported note type: {{ note.type }}
      </div>

      <!-- Transform hint -->
      <div v-if="hasTransforms && mode === 'view'" class="mb-2">
        <button
          @click="emit('transform')"
          class="text-2xs sm:text-xs font-black uppercase underline hover:text-brutal-pink transition-colors"
        >
          🔄 {{ noteTransforms.length }} transform{{ noteTransforms.length !== 1 ? 's' : '' }}
        </button>
      </div>

      <!-- Timestamp (WhatsApp style - bottom right) -->
      <time
        class="block text-right text-2xs sm:text-xs op-70 font-black mt-1"
        :datetime="(wasUpdated ? updatedAt : createdAt).toISOString()"
        :title="titleLabel"
      >
        {{ timeLabel }}{{ wasUpdated ? ' ✓✓' : '' }}
      </time>
    </div>

    <!-- Action buttons column -->
    <div class="flex flex-col gap-1 sm:gap-1.5 shrink-0">
      <Button
        v-if="supportsEditing"
        variant="secondary"
        size="icon"
        class="w-10 h-10 sm:w-11 sm:h-11 text-base sm:text-lg"
        type="button"
        :aria-label="isEditing ? 'Done' : 'Edit'"
        @click="toggleEdit"
      >
        {{ isEditing ? '✅' : '✏️' }}
      </Button>
      <Button
        variant="secondary"
        size="icon"
        class="w-10 h-10 sm:w-11 sm:h-11 text-base sm:text-lg"
        type="button"
        @click="emit('transform')"
        title="Transform"
      >
        🔄
      </Button>
      <Button
        variant="secondary"
        size="icon"
        class="w-10 h-10 sm:w-11 sm:h-11 text-base sm:text-lg"
        type="button"
        @click="emit('archive')"
        title="Archive"
      >
        📦
      </Button>
      <Button
        variant="danger"
        size="icon"
        class="w-10 h-10 sm:w-11 sm:h-11 text-base sm:text-lg"
        type="button"
        @click="emit('delete')"
        title="Delete"
      >
        ×
      </Button>
    </div>
  </article>
</template>
