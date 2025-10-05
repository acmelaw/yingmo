<script setup lang="ts">
import { ref, computed } from 'vue';
import { useNotesStore } from '../stores/notes';

const store = useNotesStore();
const searchInput = ref<HTMLInputElement | null>(null);
const showSuggestions = ref(false);

const searchQuery = computed({
  get: () => store.searchQuery,
  set: (value: string) => {
    store.searchQuery = value;
    showSuggestions.value = value.length > 0;
  },
});

// Get all unique tags from notes
const allTags = computed(() => {
  const tagSet = new Set<string>();
  store.notes.forEach(note => {
    note.tags?.forEach(tag => tagSet.add(tag));
  });
  return Array.from(tagSet).sort();
});

// Get suggested tags based on search query
const suggestedTags = computed(() => {
  if (!searchQuery.value) return [];

  const query = searchQuery.value.toLowerCase();
  const startsWith = query.startsWith('#') ? query.substring(1) : query;

  return allTags.value
    .filter((tag: string) => tag.toLowerCase().includes(startsWith))
    .slice(0, 5);
});

// Check if query looks like a hashtag search
const isHashtagQuery = computed(() => searchQuery.value.startsWith('#'));

function selectTag(tag: string) {
  // Just set the search query to filter by tag
  searchQuery.value = `#${tag}`;
  showSuggestions.value = false;
  searchInput.value?.blur();
}

function clearSearch() {
  searchQuery.value = '';
  showSuggestions.value = false;
}

function onFocus() {
  if (searchQuery.value.length > 0) {
    showSuggestions.value = true;
  }
}

function onBlur() {
  // Delay to allow click on suggestions
  setTimeout(() => {
    showSuggestions.value = false;
  }, 200);
}

defineExpose({
  focus: () => searchInput.value?.focus(),
  clear: clearSearch,
});
</script>

<template>
  <div class="relative w-full">
    <div class="relative flex items-center bg-brutal-white border-3 border-brutal-black p-3 transition-all duration-200 focus-within:(border-brutal-green shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] translate-x-[-1px] translate-y-[-1px])">
      <span class="text-lg mr-2 op-70">🔍</span>
      <input
        ref="searchInput"
        v-model="searchQuery"
        type="text"
        class="flex-1 bg-transparent border-none outline-none px-2 py-3 text-base font-bold text-brutal-black placeholder:text-brutal-text-secondary"
        placeholder="Search notes or #tags..."
        @focus="onFocus"
        @blur="onBlur"
      />
      <button
        v-if="searchQuery"
        @click="clearSearch"
        class="bg-brutal-yellow border-2 border-brutal-black rounded-full w-6 h-6 flex items-center justify-center text-xs font-black cursor-pointer transition-all duration-150 hover:(scale-110 bg-brutal-pink text-brutal-white)"
        type="button"
        aria-label="Clear search"
      >
        ✕
      </button>
    </div>

    <!-- Tag suggestions dropdown -->
    <Transition
      enter-active-class="animate-[slide-down_0.2s_cubic-bezier(0.34,1.56,0.64,1)]"
      leave-active-class="transition-all duration-150"
      enter-from-class="op-0 translate-y-[-10px]"
      enter-to-class="op-100 translate-y-0"
      leave-from-class="op-100 translate-y-0"
      leave-to-class="op-0 translate-y-[-10px]"
    >
      <div v-if="showSuggestions && suggestedTags.length > 0" class="absolute top-[calc(100%+8px)] left-0 right-0 bg-brutal-white border-3 border-brutal-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] max-h-[300px] overflow-y-auto z-100">
        <div class="px-4 py-3 pb-2 border-b-2 border-brutal-black bg-bg-secondary">
          <span class="text-xs font-black uppercase op-70">
            {{ isHashtagQuery ? 'Matching Tags' : 'Suggested Tags' }}
          </span>
        </div>
        <button
          v-for="tag in suggestedTags"
          :key="tag"
          @click="selectTag(tag)"
          class="w-full flex items-center gap-2 px-4 py-3 border-none bg-transparent border-b-2 border-brutal-black last:border-b-0 cursor-pointer transition-all duration-150 text-left hover:(bg-brutal-green translate-x-1)"
          type="button"
        >
          <span class="text-lg font-black text-brutal-green">#</span>
          <span class="flex-1 text-base font-bold text-brutal-black">{{ tag }}</span>
          <span class="text-xs font-black px-2 py-0.5 bg-brutal-cyan border-2 border-brutal-black text-brutal-black">
            {{ store.notes.filter(n => n.tags?.includes(tag)).length }}
          </span>
        </button>
      </div>
    </Transition>
  </div>
</template>
