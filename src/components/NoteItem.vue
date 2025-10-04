<script setup lang="ts">
import { computed, ref, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import { useNotesStore } from '../stores/notes';

import type { Note } from '../stores/notes';

const props = defineProps<{ note: Note }>();
const emit = defineEmits<{ (e: 'delete'): void }>();
const { t } = useI18n();
const store = useNotesStore();

const isEditing = ref(false);
const editText = ref('');
const editTags = ref<string[]>([]);
const newTag = ref('');
const editTextarea = ref<HTMLTextAreaElement | null>(null);
const showTagInput = ref(false);

const createdAt = computed(() => new Date(props.note.created));
const updatedAt = computed(() => new Date(props.note.updated));
const timeLabel = computed(() => {
  const date = props.note.updated > props.note.created ? updatedAt.value : createdAt.value;
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();
  
  if (isToday) {
    return new Intl.DateTimeFormat(undefined, { 
      hour: '2-digit', 
      minute: '2-digit'
    }).format(date);
  } else {
    return new Intl.DateTimeFormat(undefined, { 
      month: 'short',
      day: 'numeric',
      hour: '2-digit', 
      minute: '2-digit'
    }).format(date);
  }
});
const titleLabel = computed(() => createdAt.value.toLocaleString());
const wasUpdated = computed(() => props.note.updated > props.note.created);
const hasEditHistory = computed(() => (props.note.editHistory?.length || 0) > 1);

// Alternate between sent/received styling for visual variety
const isSent = computed(() => {
  // Use the note's ID hash to determine styling for consistency
  const hash = props.note.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return hash % 2 === 0;
});

// Use tags from note (no longer extracting from text)
const allTags = computed(() => props.note.tags || []);

function startEdit() {
  isEditing.value = true;
  editText.value = props.note.text;
  editTags.value = [...(props.note.tags || [])];
  showTagInput.value = false;
  nextTick(() => {
    if (editTextarea.value) {
      editTextarea.value.focus();
      editTextarea.value.style.height = 'auto';
      editTextarea.value.style.height = editTextarea.value.scrollHeight + 'px';
    }
  });
}

function cancelEdit() {
  isEditing.value = false;
  editText.value = '';
  editTags.value = [];
  newTag.value = '';
  showTagInput.value = false;
}

function saveEdit() {
  const trimmedText = editText.value.trim();
  if (!trimmedText) return;

  const hasChanged = 
    trimmedText !== props.note.text ||
    JSON.stringify(editTags.value.sort()) !== JSON.stringify((props.note.tags || []).sort());

  if (hasChanged) {
    store.update(props.note.id, { 
      text: trimmedText,
      tags: editTags.value.length > 0 ? editTags.value : undefined
    });
  }
  
  isEditing.value = false;
  editText.value = '';
  editTags.value = [];
  newTag.value = '';
  showTagInput.value = false;
}

function handleRemoveTag(tag: string) {
  if (isEditing.value) {
    // In edit mode, just update local state
    editTags.value = editTags.value.filter(t => t !== tag);
  } else {
    // In view mode, update store
    store.removeTag(props.note.id, tag);
  }
}

function handleAddTag() {
  const tag = newTag.value.trim().toLowerCase().replace(/^#/, '');
  if (!tag || editTags.value.includes(tag)) {
    newTag.value = '';
    return;
  }
  
  editTags.value.push(tag);
  newTag.value = '';
}

function handleTagClick(tag: string) {
  // Toggle tag filtering
  store.toggleTag(tag);
}

function adjustTextareaHeight(e: Event) {
  const textarea = e.target as HTMLTextAreaElement;
  textarea.style.height = 'auto';
  textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
}

function onEditKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    saveEdit();
  } else if (e.key === 'Escape') {
    e.preventDefault();
    cancelEdit();
  }
}

function onTagInputKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    e.preventDefault();
    handleAddTag();
  } else if (e.key === 'Escape') {
    e.preventDefault();
    showTagInput.value = false;
    newTag.value = '';
  }
}
</script>

<template>
  <div class="group flex items-start gap-3" :class="isSent ? 'justify-end' : 'justify-start'">
    <!-- Delete button (left for received, hidden until hover) -->
    <button
      v-if="!isSent && !isEditing"
      class="brutal-btn-icon opacity-0 transition-opacity group-hover:opacity-100 shrink-0"
      type="button"
      :aria-label="t('delete')"
      @click="emit('delete')"
    >
      <span class="text-base">🗑️</span>
    </button>

    <!-- Message bubble -->
    <article 
      :class="[
        'relative transition-all duration-150',
        isSent ? 'brutal-message-sent' : 'brutal-message-received',
        isEditing ? 'ring-4 ring-brutal-accent' : ''
      ]"
    >
      <!-- Category Badge -->
      <div v-if="note.category" class="mb-3">
        <span class="brutal-badge">
          {{ note.category }}
        </span>
      </div>

      <!-- Editing Mode -->
      <div v-if="isEditing" class="space-y-3">
        <!-- Content Editor -->
        <textarea
          ref="editTextarea"
          v-model="editText"
          class="brutal-input w-full resize-none"
          rows="3"
          placeholder="Edit note content..."
          @input="adjustTextareaHeight"
          @keydown="onEditKeydown"
        />

        <!-- Tags Editor -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold uppercase opacity-70">Tags</span>
            <button
              @click="showTagInput = !showTagInput"
              class="brutal-btn-sm"
              style="background: var(--brutal-secondary);"
              type="button"
            >
              + Add Tag
            </button>
          </div>

          <!-- Tag Input (conditionally shown) -->
          <div v-if="showTagInput" class="flex gap-2">
            <input
              v-model="newTag"
              type="text"
              class="brutal-input flex-1 text-sm"
              placeholder="Enter tag (without #)"
              @keydown="onTagInputKeydown"
            />
            <button
              @click="handleAddTag"
              class="brutal-btn-sm"
              style="background: var(--brutal-success);"
              type="button"
            >
              ✓
            </button>
          </div>

          <!-- Current Tags -->
          <div v-if="editTags.length > 0" class="flex flex-wrap gap-2">
            <div
              v-for="tag in editTags"
              :key="tag"
              class="group/tag relative inline-flex items-center"
            >
              <span class="brutal-tag text-sm">
                #{{ tag }}
              </span>
              <button
                @click="handleRemoveTag(tag)"
                class="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-brutal-warning border-2 border-brutal-border flex items-center justify-center text-xs font-bold"
                :aria-label="`Remove tag ${tag}`"
                type="button"
              >
                ✕
              </button>
            </div>
          </div>
          <div v-else class="text-xs opacity-50 italic">
            No tags yet
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-2">
          <button @click="saveEdit" class="brutal-btn-sm flex-1" style="background: var(--brutal-success);">
            ✓ {{ t('save') }}
          </button>
          <button @click="cancelEdit" class="brutal-btn-sm flex-1" style="background: var(--brutal-warning);">
            ✕ {{ t('cancel') }}
          </button>
        </div>
      </div>

      <!-- Display Mode -->
      <div v-else>
        <!-- Message content -->
        <p class="whitespace-pre-wrap break-words text-[15px] leading-relaxed font-medium mb-2">
          {{ note.text }}
        </p>

        <!-- Tags Section (separated from content) -->
        <div v-if="allTags.length > 0" class="mb-3">
          <div class="flex flex-wrap gap-2">
            <div
              v-for="tag in allTags"
              :key="tag"
              class="group/tag relative inline-flex items-center"
            >
              <button
                @click="handleTagClick(tag)"
                class="brutal-tag cursor-pointer hover:bg-brutal-accent transition-colors"
                :class="{ 'bg-brutal-accent ring-2 ring-brutal-primary': store.selectedTags.includes(tag) }"
                :title="`Click to filter by #${tag}`"
              >
                #{{ tag }}
              </button>
              <button
                @click.stop="handleRemoveTag(tag)"
                class="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-brutal-warning border-2 border-brutal-border opacity-0 group-hover/tag:opacity-100 transition-opacity flex items-center justify-center text-xs font-bold"
                :aria-label="`Remove tag ${tag}`"
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        <!-- Edit and Timestamp row -->
        <div class="flex items-center justify-between gap-3">
          <time
            class="text-[11px] font-bold uppercase tracking-wide opacity-70"
            :datetime="(wasUpdated ? updatedAt : createdAt).toISOString()"
            :title="titleLabel"
          >
            {{ timeLabel }}
            <span v-if="wasUpdated" class="ml-1" :title="t('edited') || 'Edited'">
              ✏️
            </span>
            <span v-if="hasEditHistory" class="ml-1" :title="`${note.editHistory?.length} edits`">
              📝
            </span>
          </time>
          
          <button
            @click="startEdit"
            class="brutal-btn-icon opacity-0 group-hover:opacity-100 transition-opacity !w-8 !h-8 !min-w-8 !min-h-8 text-sm"
            :aria-label="t('edit')"
          >
            ✏️
          </button>
        </div>
      </div>
    </article>

    <!-- Delete button (right for sent, hidden until hover) -->
    <button
      v-if="isSent && !isEditing"
      class="brutal-btn-icon opacity-0 transition-opacity group-hover:opacity-100 shrink-0"
      type="button"
      :aria-label="t('delete')"
      @click="emit('delete')"
    >
      <span class="text-base">🗑️</span>
    </button>
  </div>
</template>

<style scoped>
/* Additional hover effects */
.group:hover article:not(.ring-4) {
  box-shadow: 5px 5px 0 0 var(--brutal-shadow);
  transform: translate(-1px, -1px);
}

/* Edit mode specific styles */
article.ring-4 {
  box-shadow: 6px 6px 0 0 var(--brutal-shadow);
}
</style>
