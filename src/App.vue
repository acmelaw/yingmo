<script setup lang="ts">
import { ref, onMounted } from "vue";
import NoteShell from "./components/NoteShell.vue";
import ServerSelector from "./components/ServerSelector.vue";
import { useSettingsStore } from "@/stores/settings";

const settings = useSettingsStore();
const showServerSelector = ref(false);

onMounted(() => {
  // Show server selector on first run or if no server is configured
  if (!settings.syncEnabled && settings.servers.length === 0) {
    showServerSelector.value = true;
  }
});

function handleConnected() {
  console.log("Connected to server");
}

function handleOffline() {
  console.log("Continuing in offline mode");
  settings.syncEnabled = false;
}

function openServerSelector() {
  showServerSelector.value = true;
}
</script>

<template>
  <div class="chat-container">
    <NoteShell @open-server-selector="openServerSelector" />
    <ServerSelector
      v-model="showServerSelector"
      @connected="handleConnected"
      @offline="handleOffline"
    />
  </div>
</template>
