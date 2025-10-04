<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import type { NoteType, Note } from '@/types/note';
import { moduleRegistry } from '@/core/ModuleRegistry';
import { getNoteContent } from '@/types/note';

export interface ComposerActionItem {
  id: string;
  label: string;
  value?: string;
  icon?: string;
}

export interface ComposerActionContext {
  append: (value: string) => void;
  focus: () => void;
  close: () => void;
}

export interface ComposerAction {
  id: string;
  label: string;
  icon?: string;
  type?: 'button' | 'menu';
  items?: ComposerActionItem[];
  onTrigger?: (ctx: ComposerActionContext) => void;
  onSelect?: (item: ComposerActionItem, ctx: ComposerActionContext) => void;
}

const props = withDefaults(
  defineProps<{
    actions?: ComposerAction[];
    availableTypes?: NoteType[];
  }>(),
  {
    actions: () => [],
    availableTypes: () => ['text'],
  }
);

const emit = defineEmits<{
  (e: 'submit', text: string, type: NoteType): void;
  (e: 'create-advanced', type: NoteType): void;
}>();

const { t } = useI18n();

const selectedType = ref<NoteType>('text');
const menuOpen = ref<string | null>(null);
const showHashtagHelper = ref(false);

// Create a draft note that the editor will work with
const draftNote = ref<Note>({
  id: 'draft',
  type: selectedType.value,
  content: '',
  metadata: {},
  created: Date.now(),
  updated: Date.now(),
} as Note);

// Get the editor component for the selected type
const editorComponent = computed(() => {
  const modules = moduleRegistry.getModulesForType(selectedType.value);
  return modules.length > 0 && modules[0].components?.editor 
    ? modules[0].components.editor 
    : null;
});

// Extract text content for hashtag detection
const draftText = computed(() => getNoteContent(draftNote.value));

const isTyping = computed(() => draftText.value.trim().length > 0);

// Extract hashtags from the current draft (Unicode-aware)
const detectedHashtags = computed(() => {
  const matches = draftText.value.match(/#[\p{L}\p{N}_]+/gu);
  return matches ? [...new Set(matches)] : [];
});

// Show hashtag count and visual feedback
const hashtagCount = computed(() => detectedHashtags.value.length);

// Update draft note when type changes
watch(selectedType, (newType) => {
  // Keep content, just change type and reset metadata for new type
  const currentContent = getNoteContent(draftNote.value);
  draftNote.value = {
    id: 'draft',
    type: newType,
    content: currentContent,
    metadata: {},
    created: Date.now(),
    updated: Date.now(),
  } as Note;
});

function handleEditorUpdate(updates: Partial<Note>) {
  // Update the draft note with changes from the editor
  draftNote.value = {
    ...draftNote.value,
    ...updates,
    updated: Date.now(),
  } as Note;
}

const defaultEmojiAction = computed<ComposerAction>(() => ({
  id: 'emoji',
  label: t('emoji'),
  icon: '😊',
  type: 'menu',
  items: [
    '😀', '😅', '😍', '🤔', '🔥', '🎉',
    '✅', '🙌', '📌', '🧠', '🚀', '✨',
    '💡', '⭐', '💯', '👍', '❤️', '🎊',
    '🎯', '📝', '💬', '🎨', '🌟', '🏆'
  ].map((emoji) => ({
    id: emoji,
    label: emoji
  })),
  onSelect: (item, ctx) => {
    ctx.append(item.label);
    ctx.focus();
  }
}));

const quickHashtagAction = computed<ComposerAction>(() => ({
  id: 'hashtag',
  label: t('hashtag') || 'Add Tag',
  icon: '#️⃣',
  onTrigger: (ctx) => {
    ctx.append(' #');
    ctx.focus();
    showHashtagHelper.value = true;
  }
}));

const allActions = computed(() => [quickHashtagAction.value, ...props.actions, defaultEmojiAction.value]);

function focusInput() {
  // Focus handled by editor component
  nextTick(() => {
    // Could implement editor-specific focus if needed
  });
}

function append(value: string) {
  // Append to the current content
  const currentContent = getNoteContent(draftNote.value);
  handleEditorUpdate({ content: currentContent + value });
}

function changeType(type: NoteType) {
  selectedType.value = type;
  closeMenus();
}

function closeMenus() {
  menuOpen.value = null;
  showHashtagHelper.value = false;
}

function send() {
  const content = getNoteContent(draftNote.value);
  if (!content.trim()) return;
  
  emit('submit', content.trim(), selectedType.value);
  
  // Reset draft
  draftNote.value = {
    id: 'draft',
    type: selectedType.value,
    content: '',
    metadata: {},
    created: Date.now(),
    updated: Date.now(),
  } as Note;
  
  closeMenus();
  focusInput();
}

function createAdvanced(type: NoteType) {
  emit('create-advanced', type);
}

function selectType(type: NoteType) {
  selectedType.value = type;
  menuOpen.value = null;
}

function getNoteTypeIcon(type: NoteType): string {
  const icons: Record<NoteType, string> = {
    text: '📝',
    markdown: '📄',
    code: '💻',
    'rich-text': '✏️',
    image: '🖼️',
    'smart-layer': '🤖',
  };
  return icons[type] || '📋';
}

function onKey(e: KeyboardEvent) {
  // Only auto-send on Enter for simple text types
  // Rich editors like TipTap handle Enter themselves
  if (e.key === 'Enter' && !e.shiftKey && selectedType.value === 'text') {
    e.preventDefault();
    send();
    return;
  }
  if (e.key === 'Escape') {
    e.preventDefault();
    closeMenus();
  }

  // Show hashtag helper when # is typed
  if (e.key === '#') {
    showHashtagHelper.value = true;
  }
}

const context: ComposerActionContext = {
  append(value: string) {
    append(value);
  },
  focus() {
    focusInput();
  },
  close() {
    // Not needed in always-visible composer
  }
};

function triggerAction(action: ComposerAction) {
  if (action.type === 'menu') {
    menuOpen.value = menuOpen.value === action.id ? null : action.id;
    return;
  }
  action.onTrigger?.(context);
}

function selectActionItem(action: ComposerAction, item: ComposerActionItem) {
  if (action.onSelect) {
    action.onSelect(item, context);
  } else {
    append(item.value ?? item.label);
  }
  closeMenus();
  focusInput();
}

watch(draftText, () => {
  // Hide hashtag helper when space is typed
  if (draftText.value.endsWith(' ') || draftText.value.endsWith('\n')) {
    showHashtagHelper.value = false;
  }
});
</script>

<template>
  <div class="relative w-full">
    <!-- Hashtag helper -->
    <Transition name="brutal-slide">
      <div
        v-if="hashtagCount > 0"
        class="flex items-center gap-4 mb-4 flex-wrap"
      >
        <span class="inline-flex items-center px-3 py-1 bg-accent-cyan text-base-black border-2 border-base-black rounded-sm shadow-hard-sm font-black text-xs uppercase">
          #️⃣ {{ hashtagCount }} {{ hashtagCount === 1 ? 'tag' : 'tags' }}
        </span>
        <div class="flex flex-wrap gap-2">
          <span
            v-for="tag in detectedHashtags"
            :key="tag"
            class="inline-flex items-center px-3 py-1 bg-accent-pink text-base-white border-2 border-base-black rounded-sm shadow-hard-sm font-black text-xs uppercase"
          >
            {{ tag }}
          </span>
        </div>
      </div>
    </Transition>

    <!-- Main Composer Row -->
    <div class="grid grid-cols-[auto_1fr_auto] gap-4 items-end">
      <!-- Left: Action Buttons (6 buttons in 2 rows) -->
      <div class="grid grid-cols-2 gap-2 items-center">
        <div v-for="action in allActions" :key="action.id" class="relative">
          <button
            type="button"
            class="btn-icon"
            :aria-label="action.label"
            @click="triggerAction(action)"
            :title="action.label"
          >
            <span v-if="action.icon">{{ action.icon }}</span>
            <span v-else class="text-xs">{{ action.label.slice(0, 1) }}</span>
          </button>

          <!-- Action Menu (Emoji Picker, etc.) -->
          <Transition name="brutal-pop">
            <div
              v-if="action.type === 'menu' && menuOpen === action.id && action.items?.length"
              class="absolute bottom-full left-0 mb-2 p-2 bg-base-white dark:bg-dark-bg-primary border-3 border-base-black dark:border-white shadow-hard dark:shadow-dark-hard z-50 grid grid-cols-6 gap-1 min-w-48"
            >
              <button
                v-for="item in action.items"
                :key="item.id"
                type="button"
                class="w-10 h-10 flex items-center justify-center bg-base-white dark:bg-dark-bg-secondary border-2 border-base-black dark:border-white hover:bg-accent-yellow dark:hover:bg-accent-yellow hover:text-base-black transition-all duration-100 cursor-pointer font-black"
                @click="selectActionItem(action, item)"
              >
                {{ item.icon ?? item.label }}
              </button>
            </div>
          </Transition>
        </div>
        
        <!-- Type Selector Button -->
        <div v-if="availableTypes.length > 1" class="relative">
          <button
            type="button"
            class="w-11 h-11 flex items-center justify-center font-black border-3 border-base-black dark:border-white rounded-sm shadow-hard-sm dark:shadow-dark-hard-sm bg-accent-cyan text-base-black cursor-pointer transition-all duration-100 hover:(-translate-x-0.5 -translate-y-0.5 shadow-hard dark:shadow-dark-hard) active:(translate-x-0.5 translate-y-0.5 shadow-none)"
            @click="menuOpen = menuOpen === 'note-type' ? null : 'note-type'"
            :title="'Type: ' + selectedType"
          >
            {{ selectedType.slice(0, 1).toUpperCase() }}
          </button>
          
          <!-- Type Menu -->
          <Transition name="brutal-pop">
            <div v-if="menuOpen === 'note-type'" class="absolute bottom-full left-0 mb-2 p-2 bg-base-white dark:bg-dark-bg-primary border-3 border-base-black dark:border-white shadow-hard dark:shadow-dark-hard z-50 min-w-32">
              <button
                v-for="type in availableTypes"
                :key="type"
                type="button"
                class="w-full px-3 py-2 text-left bg-base-white dark:bg-dark-bg-secondary text-base-black dark:text-dark-text-primary border-2 border-base-black dark:border-white mb-1 last:mb-0 hover:bg-accent-yellow dark:hover:bg-accent-yellow hover:text-base-black transition-all duration-100 cursor-pointer font-black uppercase text-sm"
                :class="{ 'bg-accent-pink text-base-white': type === selectedType }"
                @click="changeType(type)"
              >
                {{ type }}
              </button>
            </div>
          </Transition>
        </div>
      </div>

      <!-- Center: Dynamic Editor -->
      <div class="flex-1 relative">
        <component
          v-if="editorComponent"
          :is="editorComponent"
          :note="draftNote"
          :readonly="false"
          @update="handleEditorUpdate"
          class="w-full"
        />
        <div v-else class="p-4 text-text-secondary dark:text-dark-text-secondary">
          <p>No editor for {{ selectedType }}</p>
        </div>

        <!-- Typing indicator -->
        <Transition name="fade">
          <div v-if="isTyping && !hashtagCount" class="absolute -bottom-6 left-0 text-xs text-text-tertiary dark:text-dark-text-tertiary font-bold flex items-center gap-1">
            ✍️ {{ t('writing') }}
          </div>
        </Transition>
      </div>

      <!-- Right: Send Button -->
      <div class="flex">
        <button
          type="button"
          class="btn-primary btn-lg"
          :disabled="!isTyping"
          @click="send"
          :title="t('send')"
        >
          ⚡ {{ t('send') }}
        </button>
      </div>
    </div>
  </div>
</template>


<style scoped>
/* === ANIMATIONS === */
@keyframes brutal-pop {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.brutal-slide-enter-active,
.brutal-slide-leave-active {
  transition: all 0.15s ease-out;
}

.brutal-slide-enter-from,
.brutal-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.brutal-pop-enter-active {
  animation: brutal-pop 0.15s ease-out;
}

.brutal-pop-leave-active {
  animation: brutal-pop 0.1s ease-in reverse;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
