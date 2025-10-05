<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import type { NoteType, Note } from '@/types/note';
import { moduleRegistry } from '@/core/ModuleRegistry';
import { getNoteContent } from '@/types/note';
import { Badge, Button } from '@/components/ui';

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
  <div class="w-full">
    <!-- Hashtag helper - above input -->
    <Transition
      enter-active-class="transition-all duration-150 ease-out"
      enter-from-class="op-0 translate-y-[-10px]"
      enter-to-class="op-100 translate-y-0"
      leave-active-class="transition-all duration-150 ease-out"
      leave-from-class="op-100 translate-y-0"
      leave-to-class="op-0 translate-y-[-10px]"
    >
      <div
        v-if="hashtagCount > 0"
        class="flex items-center gap-2 mb-2 flex-wrap px-1"
      >
        <Badge variant="category">
          #️⃣ {{ hashtagCount }} {{ hashtagCount === 1 ? 'tag' : 'tags' }}
        </Badge>
        <div class="flex flex-wrap gap-1.5">
          <Badge
            v-for="tag in detectedHashtags"
            :key="tag"
            variant="tag"
          >
            {{ tag }}
          </Badge>
        </div>
      </div>
    </Transition>

    <!-- Main Input Bar (WhatsApp Style) -->
    <div class="flex items-end gap-2">
      <!-- Left: Quick Actions -->
      <div class="flex gap-1.5 shrink-0">
        <!-- Emoji Picker -->
        <div class="relative">
          <Button
            variant="secondary"
            size="icon"
            aria-label="Emoji"
            @click="triggerAction(defaultEmojiAction)"
            title="Add emoji"
          >
            😊
          </Button>

          <!-- Emoji Menu -->
          <Transition
            enter-active-class="animate-[brutal-pop_0.15s_ease-out]"
            leave-active-class="animate-[brutal-pop_0.1s_ease-in_reverse]"
          >
            <div
              v-if="menuOpen === 'emoji' && defaultEmojiAction.items?.length"
              class="absolute bottom-full left-0 mb-2 p-2 bg-brutal-white border-3 border-brutal-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-50 grid grid-cols-6 gap-1 max-w-[280px]"
            >
              <button
                v-for="item in defaultEmojiAction.items"
                :key="item.id"
                type="button"
                class="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center bg-brutal-white border-2 border-brutal-black hover:bg-brutal-yellow transition-all duration-75 cursor-pointer text-base sm:text-lg"
                @click="selectActionItem(defaultEmojiAction, item)"
              >
                {{ item.label }}
              </button>
            </div>
          </Transition>
        </div>

        <!-- Type Selector (if multiple types) -->
        <div v-if="availableTypes.length > 1" class="relative">
          <Button
            variant="secondary"
            size="icon"
            class="bg-brutal-cyan text-brutal-black"
            @click="menuOpen = menuOpen === 'note-type' ? null : 'note-type'"
            :title="'Type: ' + selectedType"
          >
            {{ getNoteTypeIcon(selectedType) }}
          </Button>

          <!-- Type Menu -->
          <Transition
            enter-active-class="animate-[brutal-pop_0.15s_ease-out]"
            leave-active-class="animate-[brutal-pop_0.1s_ease-in_reverse]"
          >
            <div v-if="menuOpen === 'note-type'" class="absolute bottom-full left-0 mb-2 p-2 bg-brutal-white border-3 border-brutal-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-50 min-w-[140px]">
              <button
                v-for="type in availableTypes"
                :key="type"
                type="button"
                class="w-full px-3 py-2 text-left bg-brutal-white text-brutal-black border-2 border-brutal-black mb-1.5 last:mb-0 hover:bg-brutal-yellow transition-all duration-75 cursor-pointer font-black uppercase text-xs sm:text-sm"
                :class="{ 'bg-brutal-green': type === selectedType }"
                @click="changeType(type)"
              >
                {{ getNoteTypeIcon(type) }} {{ type }}
              </button>
            </div>
          </Transition>
        </div>
      </div>

      <!-- Center: Editor (flexible) -->
      <div class="flex-1 min-w-0">
        <component
          v-if="editorComponent"
          :is="editorComponent"
          :note="draftNote"
          :readonly="false"
          @update="handleEditorUpdate"
          @keydown="onKey"
          class="w-full text-sm sm:text-base"
        />
        <div v-else class="p-3 text-xs sm:text-sm text-brutal-text-secondary font-black border-2 border-brutal-black bg-brutal-white">
          No editor for {{ selectedType }}
        </div>
      </div>

      <!-- Right: Send Button -->
      <div class="shrink-0">
        <Button
          variant="primary"
          size="lg"
          class="flex items-center gap-1.5"
          :disabled="!isTyping"
          @click="send"
          title="Send message"
        >
          <span class="hidden sm:inline">{{ t('send') }}</span>
          <span class="text-lg sm:text-xl">⚡</span>
        </Button>
      </div>
    </div>

    <!-- Typing indicator (optional) -->
    <Transition
      enter-active-class="transition-opacity duration-200"
      enter-from-class="op-0"
      enter-to-class="op-100"
      leave-active-class="transition-opacity duration-200"
      leave-from-class="op-100"
      leave-to-class="op-0"
    >
      <div v-if="isTyping && !hashtagCount" class="mt-1.5 text-2xs sm:text-xs text-brutal-text-secondary font-black flex items-center gap-1 px-1">
        ✍️ typing...
      </div>
    </Transition>
  </div>
</template>
