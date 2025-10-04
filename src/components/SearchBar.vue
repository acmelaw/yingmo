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
  <div class="search-bar-wrapper">
    <div class="search-bar">
      <span class="search-icon">🔍</span>
      <input
        ref="searchInput"
        v-model="searchQuery"
        type="text"
        class="search-input"
        placeholder="Search notes or #tags..."
        @focus="onFocus"
        @blur="onBlur"
      />
      <button
        v-if="searchQuery"
        @click="clearSearch"
        class="clear-btn"
        type="button"
        aria-label="Clear search"
      >
        ✕
      </button>
    </div>

    <!-- Tag suggestions dropdown -->
    <div v-if="showSuggestions && suggestedTags.length > 0" class="suggestions-dropdown">
      <div class="suggestions-header">
        <span class="text-xs font-bold uppercase opacity-70">
          {{ isHashtagQuery ? 'Matching Tags' : 'Suggested Tags' }}
        </span>
      </div>
      <button
        v-for="tag in suggestedTags"
        :key="tag"
        @click="selectTag(tag)"
        class="suggestion-item"
        type="button"
      >
        <span class="suggestion-hash">#</span>
        <span class="suggestion-tag">{{ tag }}</span>
        <span class="suggestion-count">
          {{ store.notes.filter(n => n.tags?.includes(tag)).length }}
        </span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.search-bar-wrapper {
  position: relative;
  width: 100%;
}

.search-bar {
  position: relative;
  display: flex;
  align-items: center;
  background: var(--brutal-surface);
  border: 3px solid var(--brutal-border);
  border-radius: 12px;
  padding: 0 12px;
  transition: all 0.2s;
}

.search-bar:focus-within {
  border-color: var(--brutal-primary);
  box-shadow: 3px 3px 0 0 var(--brutal-shadow);
  transform: translate(-1px, -1px);
}

.search-icon {
  font-size: 18px;
  margin-right: 8px;
  opacity: 0.7;
}

.search-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  padding: 12px 8px;
  font-size: 15px;
  font-weight: 500;
  color: var(--brutal-text);
}

.search-input::placeholder {
  color: var(--brutal-text-muted);
}

.clear-btn {
  background: var(--brutal-warning);
  border: 2px solid var(--brutal-border);
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s;
}

.clear-btn:hover {
  transform: scale(1.1);
  background: #ff5252;
  color: white;
}

.suggestions-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  background: var(--brutal-surface);
  border: 3px solid var(--brutal-border);
  border-radius: 12px;
  box-shadow: 4px 4px 0 0 var(--brutal-shadow);
  max-height: 300px;
  overflow-y: auto;
  z-index: 100;
  animation: slide-down 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes slide-down {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.suggestions-header {
  padding: 12px 16px 8px;
  border-bottom: 2px solid var(--brutal-border);
  background: var(--brutal-surface-secondary);
}

.suggestion-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border: none;
  background: transparent;
  border-bottom: 2px solid var(--brutal-border);
  cursor: pointer;
  transition: all 0.15s;
  text-align: left;
}

.suggestion-item:last-child {
  border-bottom: none;
}

.suggestion-item:hover {
  background: var(--brutal-accent);
  transform: translateX(4px);
}

.suggestion-hash {
  font-size: 18px;
  font-weight: 700;
  color: var(--brutal-primary);
}

.suggestion-tag {
  flex: 1;
  font-size: 15px;
  font-weight: 600;
  color: var(--brutal-text);
}

.suggestion-count {
  font-size: 12px;
  font-weight: 700;
  padding: 2px 8px;
  background: var(--brutal-secondary);
  border: 2px solid var(--brutal-border);
  border-radius: 8px;
  color: white;
}
</style>
