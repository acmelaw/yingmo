/**
 * Universal Note Card Component - WhatsApp Style
 */
<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import type { Note, NoteColor, NoteType } from '@/types/note';
import { moduleRegistry } from '@/core/ModuleRegistry';
import { Badge, Button } from '@/components/ui';
import ModuleParameterControls from '@/components/ModuleParameterControls.vue';
import ViewAsSelector from '@/components/ViewAsSelector.vue';

const props = defineProps<{
  note: Note;
  mode?: 'view' | 'edit' | 'preview';
  // When true the card should show a selection checkbox for bulk operations
  selectable?: boolean;
  // Whether the card is currently selected
  selected?: boolean;
  // Active tag filter (to highlight)
  activeTag?: string | null;
}>();

const emit = defineEmits<{
  (e: 'delete'): void;
  (e: 'update', updates: Partial<Note>): void;
  (e: 'archive'): void;
  (e: 'pin'): void;
  (e: 'transform'): void;
  (e: 'select', selected: boolean): void;
  (e: 'tag-click', tag: string): void;
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
const hasTransforms = computed(() => true); // Always show transform button for type conversion

// Color styling helper with neo-brutalist shadows
function getColorClasses(color?: NoteColor): string {
  const colorMap: Record<NoteColor, string> = {
    'default': 'bg-base-white shadow-hard',
    'red': 'bg-red-50 border-red-500 shadow-hard-red',
    'orange': 'bg-orange-50 border-orange-500 shadow-hard-orange',
    'yellow': 'bg-yellow-50 border-yellow-500 shadow-hard-yellow',
    'green': 'bg-green-50 border-green-500 shadow-hard-green',
    'blue': 'bg-blue-50 border-blue-500 shadow-hard-blue',
    'purple': 'bg-purple-50 border-purple-500 shadow-hard-purple',
    'pink': 'bg-pink-50 border-pink-500 shadow-hard-pink',
  };
  return colorMap[color || 'default'];
}

const noteColor = computed(() => props.note.color || 'default');

function toggleEdit() {
  if (!supportsEditing.value) return;
  isEditing.value = !isEditing.value;
}

function handleEditorKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    isEditing.value = false;
  }
}
</script>

<template>
  <article :class="[
    'note-card group flex items-start gap-2 sm:gap-2.5 mb-2 sm:mb-3 animate-slide-up',
    note.pinned ? 'pinned-note' : ''
  ]">
    <!-- Selection checkbox (bulk mode) -->
    <div v-if="props.selectable" class="mr-1 flex items-start shrink-0">
      <input
        type="checkbox"
        :checked="props.selected"
        @change="$emit('select', ($event.target as HTMLInputElement).checked)"
        aria-label="Select note for bulk actions"
        class="w-4 h-4 mt-1"
      />
    </div>
    <!-- Message Bubble (WhatsApp style + color coding + neo-brutalist depth) -->
    <div :class="[
      'msg-out flex-1 transition-all duration-200 rounded-lg p-3 border-2 hover:translate-x-0.5 hover:translate-y-0.5',
      getColorClasses(note.color),
      note.pinned ? 'border-l-4 border-accent-green/50 pl-3 shadow-hard-green' : ''
    ]">
      <!-- Metadata badges at top -->
      <div class="flex flex-wrap gap-1 sm:gap-1.5 mb-2">
        <Badge v-if="hasCategory" variant="category">{{ note.category }}</Badge>
        <Badge
          v-for="tag in note.tags ?? []"
          :key="tag"
          variant="tag"
          :class="[
            'cursor-pointer hover:opacity-80 transition-all',
            activeTag === tag ? 'ring-2 ring-accent-green ring-offset-2 scale-110' : ''
          ]"
          @click="emit('tag-click', tag)"
        >
          #{{ tag }}
        </Badge>
        
        <!-- View As Selector - replaces static type badge -->
        <ViewAsSelector
          :current-type="note.type"
          :view-as="note.viewAs as NoteType | undefined"
          @change="(type: NoteType) => emit('update', { viewAs: type })"
        />
        
        <!-- Show transform indicator if viewing as different type -->
        <Badge
          v-if="showTransformBadge"
          variant="tag"
          class="text-2xs opacity-70"
          :title="`Original: ${note.type}, viewing as: ${displayType}`"
        >
          🔄 {{ note.type }} → {{ displayType }}
        </Badge>
      </div>

      <!-- Note content (editable or view mode) -->
      <div v-if="isEditing && editorComponent">
        <component
          :is="editorComponent"
          :note="note"
          :readonly="false"
          @update="(updates: Partial<Note>) => emit('update', updates)"
          @close="isEditing = false"
          class="mb-2 text-sm sm:text-base"
        />
      </div>
      <!-- BRAVE UX: Double-click content to enter edit mode (industry standard like Notion/Linear) -->
      <div
        v-else-if="viewerComponent"
        @dblclick="supportsEditing && !selectable ? (isEditing = true) : null"
        :class="[
          'mb-2 text-sm sm:text-base',
          supportsEditing && !selectable ? 'cursor-text' : ''
        ]"
      >
        <component
          :is="viewerComponent"
          :note="note"
          :readonly="true"
          @update="(updates: Partial<Note>) => emit('update', updates)"
        />
      </div>
      <div v-else class="mb-2 text-brutal-pink text-xs sm:text-sm font-black">
        ⚠️ Unsupported note type: {{ note.type }}
      </div>

      <!-- Module parameters (e.g., transpose for chord sheets) -->
      <div v-if="!isEditing" class="mb-2">
        <ModuleParameterControls
          :note="note"
          compact
          @update="(updates: Partial<Note>) => emit('update', updates)"
        />
      </div>

      <!-- Transform hint -->
      <!-- REMOVED: Transform button moved to always-visible action bar -->

      <!-- Timestamp (WhatsApp style - bottom right) -->
      <div class="flex items-center justify-between gap-2">
        <time
          class="text-2xs sm:text-xs op-70 font-black"
          :datetime="(wasUpdated ? updatedAt : createdAt).toISOString()"
          :title="titleLabel"
        >
          {{ timeLabel }}{{ wasUpdated ? ' ✓✓' : '' }}
        </time>

        <!-- REMOVED: Pin indicator - now always visible in action bar -->
      </div>
    </div>

    <!-- Action buttons (ALWAYS VISIBLE - no more hover friction!) -->
    <div class="flex flex-col gap-1 shrink-0">
      <!-- REMOVED: Edit button - now double-click content to edit (industry standard) -->

      <!-- Pin/Unpin toggle -->
      <Button
        variant="secondary"
        size="icon"
        :class="[
          'w-7 h-7 text-xs sm:w-8 sm:h-8 sm:text-sm transition-all',
          note.pinned ? 'scale-110 bg-accent-green/20' : ''
        ]"
        type="button"
        @click="emit('pin')"
        :title="note.pinned ? 'Unpin (P)' : 'Pin (P)'"
        :aria-label="note.pinned ? 'Unpin note (keyboard shortcut: P)' : 'Pin note (keyboard shortcut: P)'"
      >
        {{ note.pinned ? '⭐' : '📌' }}
      </Button>

      <!-- Archive -->
      <Button
        variant="secondary"
        size="icon"
        class="w-7 h-7 text-xs sm:w-8 sm:h-8 sm:text-sm opacity-70 hover:opacity-100"
        type="button"
        @click="emit('archive')"
        title="Archive (A)"
        aria-label="Archive note (keyboard shortcut: A)"
      >
        📦
      </Button>

      <!-- Delete (danger zone - subtle) -->
      <Button
        variant="danger"
        size="icon"
        class="w-7 h-7 text-xs sm:w-8 sm:h-8 sm:text-sm opacity-40 hover:opacity-100"
        type="button"
        @click="emit('delete')"
        title="Delete (D)"
        aria-label="Delete note (keyboard shortcut: D)"
      >
        ×
      </Button>
    </div>
  </article>
</template>
