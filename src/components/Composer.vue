<script setup lang="ts">
import { computed, ref, watch } from 'vue';
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
    focusKey?: number;
  }>(),
  {
    actions: () => [],
    focusKey: 0
  }
);

const emit = defineEmits<{
  (e: 'submit', text: string): void;
  (e: 'close'): void;
}>();

const { t } = useI18n();

const draft = ref('');
const menuOpen = ref<string | null>(null);
const textareaRef = ref<HTMLTextAreaElement | null>(null);

const isTyping = computed(() => draft.value.trim().length > 0);

const defaultEmojiAction = computed<ComposerAction>(() => ({
  id: 'emoji',
  label: t('emoji'),
  icon: '😊',
  type: 'menu',
  items: [
    '😀',
    '😅',
    '😍',
    '🤔',
    '🔥',
    '🎉',
    '✅',
    '🙌',
    '📌',
    '🧠',
    '🚀',
    '✨'
  ].map((emoji) => ({
    id: emoji,
    label: emoji
  })),
  onSelect: (item, ctx) => {
    ctx.append(item.label);
    ctx.focus();
  }
}));

const actions = computed(() => [...props.actions, defaultEmojiAction.value]);

function focusInput() {
  textareaRef.value?.focus();
}

function append(value: string) {
  draft.value += value;
}

function closeMenus() {
  menuOpen.value = null;
}

function send() {
  if (!draft.value.trim()) return;
  emit('submit', draft.value.trim());
  draft.value = '';
  closeMenus();
  focusInput();
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
}

const context: ComposerActionContext = {
  append(value: string) {
    append(value);
  },
  focus() {
    focusInput();
  },
  close() {
    emit('close');
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

watch(
  () => props.focusKey,
  () => {
    focusInput();
    closeMenus();
  },
  { immediate: true }
);
</script>

<template>
  <form class="floating-surface relative flex flex-col gap-3 p-3 md:p-4" @submit.prevent="send">
    <div class="flex items-center justify-between gap-3">
      <div class="flex items-center gap-2">
        <div v-for="action in actions" :key="action.id" class="relative">
          <button
            type="button"
            class="chip-brutal flex h-11 w-11 items-center justify-center text-lg"
            :aria-label="action.label"
            @click="triggerAction(action)"
            :aria-expanded="action.type === 'menu' ? menuOpen === action.id : undefined"
          >
            <span v-if="action.icon" aria-hidden="true">{{ action.icon }}</span>
            <span v-else class="text-[0.6rem] font-semibold uppercase tracking-wide">
              {{ action.label }}
            </span>
          </button>
          <Transition name="fade">
            <div
              v-if="action.type === 'menu' && menuOpen === action.id && action.items?.length"
              class="surface absolute bottom-[calc(100%+0.5rem)] right-0 z-50 grid grid-cols-6 gap-2 p-2"
            >
              <button
                v-for="item in action.items"
                :key="item.id"
                type="button"
                class="chip-brutal flex h-10 w-10 items-center justify-center text-lg"
                :aria-label="item.label"
                @click="selectActionItem(action, item)"
              >
                <span aria-hidden="true">{{ item.icon ?? item.label }}</span>
              </button>
            </div>
          </Transition>
        </div>
        <slot name="actions" :append="context.append" :focus="context.focus" :close="context.close" />
      </div>
      <div class="flex items-center gap-3">
        <span v-if="isTyping" class="text-[0.7rem] uppercase tracking-wide text-ink/60">
          {{ t('writing') }}
        </span>
        <button
          type="button"
          class="chip-brutal h-9 rounded-full px-4 text-xs font-semibold uppercase tracking-wide"
          @click="emit('close')"
        >
          {{ t('closeComposer') }}
        </button>
      </div>
    </div>
    <div class="relative">
      <textarea
        ref="textareaRef"
        v-model="draft"
        class="textarea-brutal min-h-[5rem] pr-16"
        :placeholder="t('placeholder')"
        @keydown="onKey"
      />
      <button
        type="submit"
        class="btn-brutal absolute bottom-3 right-3 h-11 w-11 rounded-full text-lg"
        :aria-label="t('send')"
      >
        ➤
      </button>
    </div>
  </form>
</template>
