<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';

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
  }>(),
  {
    actions: () => [],
  }
);

const emit = defineEmits<{
  (e: 'submit', text: string): void;
}>();

const { t } = useI18n();

const draft = ref('');
const menuOpen = ref<string | null>(null);
const textareaRef = ref<HTMLTextAreaElement | null>(null);
const showHashtagHelper = ref(false);

const isTyping = computed(() => draft.value.trim().length > 0);

// Extract hashtags from the current draft (Unicode-aware)
const detectedHashtags = computed(() => {
  const matches = draft.value.match(/#[\p{L}\p{N}_]+/gu);
  return matches ? [...new Set(matches)] : [];
});

// Show hashtag count and visual feedback
const hashtagCount = computed(() => detectedHashtags.value.length);

const defaultEmojiAction = computed<ComposerAction>(() => ({
  id: 'emoji',
  label: t('emoji'),
  icon: '😊',
  type: 'menu',
  items: [
    '😀', '😅', '😍', '🤔', '🔥', '🎉',
    '✅', '🙌', '📌', '🧠', '🚀', '✨',
    '💡', '⭐', '💯', '👍', '❤️', '�',
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
  nextTick(() => {
    textareaRef.value?.focus();
  });
}

function append(value: string) {
  draft.value += value;
  adjustTextareaHeight();
}

function closeMenus() {
  menuOpen.value = null;
  showHashtagHelper.value = false;
}

function send() {
  if (!draft.value.trim()) return;
  emit('submit', draft.value.trim());
  draft.value = '';
  closeMenus();
  focusInput();
  adjustTextareaHeight();
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
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

function adjustTextareaHeight() {
  if (textareaRef.value) {
    textareaRef.value.style.height = 'auto';
    const newHeight = Math.min(textareaRef.value.scrollHeight, 150);
    textareaRef.value.style.height = newHeight + 'px';
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

watch(draft, () => {
  adjustTextareaHeight();
  // Hide hashtag helper when space is typed
  if (draft.value.endsWith(' ') || draft.value.endsWith('\n')) {
    showHashtagHelper.value = false;
  }
});
</script>

<template>
  <div class="relative">
    <!-- Hashtag helper tooltip -->
    <Transition name="slide-up">
      <div
        v-if="hashtagCount > 0"
        class="mb-2 flex items-center gap-2 text-xs font-bold"
      >
        <span class="brutal-badge">
          #️⃣ {{ hashtagCount }} {{ hashtagCount === 1 ? 'tag' : 'tags' }}
        </span>
        <div class="flex flex-wrap gap-1">
          <span
            v-for="tag in detectedHashtags"
            :key="tag"
            class="brutal-tag text-xs"
          >
            {{ tag }}
          </span>
        </div>
      </div>
    </Transition>

    <div class="flex items-end gap-3">
      <!-- Action Buttons -->
      <div class="flex items-center gap-2">
        <div v-for="action in allActions" :key="action.id" class="relative">
          <button
            type="button"
            class="brutal-btn-icon"
            :aria-label="action.label"
            @click="triggerAction(action)"
            :aria-expanded="action.type === 'menu' ? menuOpen === action.id : undefined"
          >
            <span v-if="action.icon" aria-hidden="true">{{ action.icon }}</span>
            <span v-else class="text-xs font-bold">{{ action.label }}</span>
          </button>

          <!-- Emoji Picker -->
          <Transition name="slide-up">
            <div
              v-if="action.type === 'menu' && menuOpen === action.id && action.items?.length"
              class="brutal-emoji-picker"
            >
              <button
                v-for="item in action.items"
                :key="item.id"
                type="button"
                class="brutal-emoji-btn"
                :aria-label="item.label"
                @click="selectActionItem(action, item)"
              >
                <span aria-hidden="true">{{ item.icon ?? item.label }}</span>
              </button>
            </div>
          </Transition>
        </div>
      </div>

      <!-- Text Input -->
      <div class="relative flex-1">
        <textarea
          ref="textareaRef"
          v-model="draft"
          class="brutal-input w-full resize-none"
          :placeholder="t('placeholder')"
          rows="1"
          @keydown="onKey"
          @input="adjustTextareaHeight"
        />

        <!-- Typing indicator -->
        <Transition name="fade">
          <div
            v-if="isTyping && !hashtagCount"
            class="absolute -top-6 left-0 text-xs font-bold uppercase tracking-wide opacity-60"
          >
            ✍️ {{ t('writing') }}
          </div>
        </Transition>
      </div>

      <!-- Send Button -->
      <button
        type="button"
        class="brutal-btn-send"
        :aria-label="t('send')"
        :disabled="!isTyping"
        @click="send"
      >
        <span class="text-xl">➤</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
textarea {
  min-height: 52px;
  max-height: 150px;
  line-height: 1.5;
}
</style>
