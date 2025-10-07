<template>
  <div class="w-full max-w-2xl mx-auto">
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
            <div
              v-if="menuOpen === 'note-type'"
              class="absolute bottom-full left-0 mb-2 p-2 bg-brutal-white border-3 border-brutal-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-50 min-w-[140px]"
            >
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
        <textarea
          v-model="draftNote.content"
          class="w-full px-3 py-2.5 min-h-[44px] max-h-32 font-bold text-sm sm:text-base bg-brutal-white text-brutal-black border-3 border-brutal-black rounded-lg resize-none outline-none transition-all duration-100 focus:(shadow-hard border-brutal-green) placeholder:opacity-60"
          placeholder="Write your note..."
          @keydown="onKeydown"
          rows="1"
        />
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

<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Button, Badge } from './ui'

// Props
const props = defineProps({
  availableTypes: {
    type: Array,
    default: () => ['text']
  },
  initialType: {
    type: String,
    default: 'text'
  }
})

// Emits
const emit = defineEmits(['submit'])

// I18n
const { t } = useI18n()

// State
const menuOpen = ref(null)
const showHashtagHelper = ref(false)
const selectedType = ref(props.initialType)
const draftNote = ref({
  id: 'draft',
  type: props.initialType,
  content: '',
  metadata: {},
  created: Date.now(),
  updated: Date.now()
})

// Computed
const isTyping = computed(() => draftNote.value.content.trim().length > 0)
const hashtagCount = computed(() => detectedHashtags.value.length)
const detectedHashtags = computed(() => {
  const content = draftNote.value.content
  const hashtags = content.match(/#[a-zA-Z0-9_]+/g)
  return hashtags ? [...new Set(hashtags)] : []
})

// Emoji data
const emojiData = [
  '😀', '😂', '🥰', '😎', '🤩', '😍', '🤗', '🤑', '🤠', '🥳',
  '😭', '😡', '🤯', '🥶', '😱', '👻', '💩', '👾', '🤖', '👋',
  '👍', '👏', '🙌', '💪', '🦾', '🦿', '🧠', '🦷', '🦴', '👀',
  '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯',
  '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🦆', '🦅'
]

// Action context
const context = {
  append(value) {
    const currentContent = draftNote.value.content
    draftNote.value.content = currentContent + value
  },
  focus() {
    // Focus logic would go here
  },
  close() {
    menuOpen.value = null
  }
}

// Components
const defaultEmojiAction = {
  id: 'emoji',
  type: 'menu',
  items: emojiData.map(emoji => ({ id: emoji, label: emoji }))
}

const editorComponent = computed(() => {
  // This would be dynamically imported based on selectedType
  // For demo purposes, we'll return a simple textarea
  return 'textarea'
})

// Methods
const triggerAction = (action) => {
  if (action.type === 'menu') {
    menuOpen.value = menuOpen.value === action.id ? null : action.id
    return
  }
  action.handler?.()
}

const selectActionItem = (action, item) => {
  if (action.id === 'emoji') {
    context.append(item.label)
  }
  menuOpen.value = null
}

const changeType = (type) => {
  selectedType.value = type
  menuOpen.value = null
}

const getNoteTypeIcon = (type) => {
  const icons = {
    text: "📝",
    markdown: "📄",
    code: "💻",
    "rich-text": "✏️",
    image: "🖼️",
    "smart-layer": "🤖",
    todo: "✅",
  }
  return icons[type] || "📋"
}

const handleEditorUpdate = (event) => {
  draftNote.value.content = event.target.value
}

const onKeydown = (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    send()
  }
}

const send = () => {
  if (!isTyping.value) return

  // Emit with text and type (matching NoteShell handleAdd signature)
  emit('submit', draftNote.value.content, selectedType.value)

  // Reset the input
  draftNote.value.content = ''
  menuOpen.value = null
  showHashtagHelper.value = false
}

// Watchers
watch(() => draftNote.value.content, (newContent) => {
  // Update the note with new content
  draftNote.value.updated = Date.now()

  // Show hashtag helper when content contains #
  showHashtagHelper.value = newContent.includes('#')
})
</script>

<style scoped>
/* Add your custom styles here */
</style>