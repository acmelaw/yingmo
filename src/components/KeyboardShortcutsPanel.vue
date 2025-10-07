<template>
  <Transition name="modal">
    <div
      v-if="show"
      class="fixed inset-0 z-9999 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      @click.self="$emit('close')"
    >
      <div
        class="w-full max-w-2xl max-h-[80vh] overflow-y-auto bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 m-4"
        @click.stop
      >
        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
          <div>
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
              ⌨️ Keyboard Shortcuts
            </h2>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Master Vue Notes with these powerful shortcuts
            </p>
          </div>
          <button
            @click="$emit('close')"
            class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Close shortcuts panel"
          >
            <span class="text-2xl">×</span>
          </button>
        </div>

        <!-- Shortcuts Grid -->
        <div class="space-y-6">
          <!-- Navigation -->
          <section>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <span>🧭</span>
              <span>Navigation</span>
            </h3>
            <div class="space-y-2">
              <ShortcutRow
                keys="Cmd+K"
                description="Search notes"
              />
              <ShortcutRow
                keys="Cmd+1"
                description="Show all notes"
              />
              <ShortcutRow
                keys="Cmd+2"
                description="Show pinned notes"
              />
              <ShortcutRow
                keys="Cmd+3"
                description="Show archived notes"
              />
              <ShortcutRow
                keys="Esc"
                description="Close search / Exit edit mode"
              />
            </div>
          </section>

          <!-- Note Actions -->
          <section>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <span>📝</span>
              <span>Note Actions</span>
            </h3>
            <div class="space-y-2">
              <ShortcutRow
                keys="Cmd+N"
                description="Create new note (focus composer)"
              />
              <ShortcutRow
                keys="Enter"
                description="Submit note (in composer)"
              />
              <ShortcutRow
                keys="P"
                description="Pin/Unpin note"
              />
              <ShortcutRow
                keys="A"
                description="Archive note"
              />
              <ShortcutRow
                keys="D"
                description="Delete note"
              />
            </div>
          </section>

          <!-- Bulk Operations -->
          <section>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <span>🎯</span>
              <span>Bulk Operations</span>
            </h3>
            <div class="space-y-2">
              <ShortcutRow
                keys="Cmd+Shift+A"
                description="Toggle selection mode"
              />
              <ShortcutRow
                keys="Cmd+Shift+D"
                description="Delete selected notes (in selection mode)"
              />
              <ShortcutRow
                keys="Cmd+Shift+E"
                description="Archive selected notes (in selection mode)"
              />
            </div>
          </section>

          <!-- Slash Commands -->
          <section>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <span>⚡</span>
              <span>Slash Commands</span>
            </h3>
            <div class="space-y-2">
              <ShortcutRow
                v-for="cmd in slashCommands"
                :key="cmd.command"
                :keys="cmd.command"
                :description="cmd.description"
              />
            </div>
          </section>

          <!-- Help -->
          <section>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <span>❓</span>
              <span>Help</span>
            </h3>
            <div class="space-y-2">
              <ShortcutRow
                keys="Cmd+/"
                description="Show this shortcuts panel"
              />
            </div>
          </section>
        </div>

        <!-- Footer -->
        <div class="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <p class="text-sm text-gray-500 dark:text-gray-400 text-center">
            💡 Tip: Most shortcuts work from anywhere in the app
          </p>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import ShortcutRow from './ShortcutRow.vue'
import { moduleRegistry } from '@/core/ModuleRegistry'

defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

// Get slash commands from module registry
const slashCommands = computed(() => {
  return moduleRegistry.getAllSlashCommands().map(({ command, module }) => ({
    command: command.command,
    description: command.description,
    icon: command.icon,
  }))
})

// Close on Escape key
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    emit('close')
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: all 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from > div,
.modal-leave-to > div {
  transform: scale(0.95);
  opacity: 0;
}
</style>
