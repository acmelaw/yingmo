<template>
  <Dialog v-model:open="isOpen" @update:open="(val: boolean) => { if (!val) onClose(); }">
    <DialogContent class="max-w-2xl">
      <DialogHeader>
        <DialogTitle class="flex items-start gap-3">
          <span class="text-4xl">🌐</span>
          <div class="flex flex-col gap-1">
            <span class="uppercase font-black text-lg tracking-wider">Select Server</span>
            <p class="text-xs text-brutal-text-secondary font-normal normal-case tracking-normal">
              Connect to a Vue Notes sync server to unlock real-time collaboration and cross-device sync.
            </p>
          </div>
        </DialogTitle>
      </DialogHeader>

      <!-- Connection Status Banners -->
      <div v-if="connectionState.connected" class="flex items-center gap-3 p-4 border-3 border-brutal-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-brutal-green">
        <div class="text-2xl">✅</div>
        <div class="flex-1 flex flex-col gap-1">
          <p class="text-sm font-black uppercase tracking-wider">Connected to {{ connectionState.server?.name }}</p>
          <p class="text-xs tracking-wide">{{ connectionState.server?.url }}</p>
        </div>
        <Button size="sm" variant="secondary" @click="handleDisconnect">
          Disconnect
        </Button>
      </div>

      <div v-else-if="connectionState.error" class="flex items-center gap-3 p-4 border-3 border-brutal-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-brutal-pink text-brutal-white">
        <div class="text-2xl">⚠️</div>
        <div class="flex-1 flex flex-col gap-1">
          <p class="text-sm font-black uppercase tracking-wider">Connection failed</p>
          <p class="text-xs tracking-wide">{{ connectionState.error }}</p>
        </div>
      </div>

      <!-- Server Configuration -->
      <div class="flex flex-col gap-4">
        <h3 class="text-sm font-black uppercase tracking-widest">Server configuration</h3>
        <div class="flex flex-col gap-2">
          <label for="server-url" class="text-xs font-black uppercase tracking-widest">Server URL</label>
          <div class="flex items-center gap-3">
            <Input
              id="server-url"
              v-model="serverUrl"
              :disabled="connectionState.connecting"
              placeholder="http://localhost:4444"
              class="flex-1"
              @keydown.enter="handleConnect"
            />
            <Button
              variant="secondary"
              size="icon"
              :disabled="discovering || connectionState.connecting"
              @click="handleAutoDiscover"
              aria-label="Auto-discover servers"
            >
              <span v-if="discovering" class="inline-block w-4 h-4 border-3 border-brutal-black border-t-transparent rounded-full animate-spin" aria-hidden="true"></span>
              <span v-else>🔍</span>
            </Button>
          </div>
          <p v-if="urlError" class="text-xs text-brutal-pink font-black uppercase tracking-wide">{{ urlError }}</p>
        </div>

        <div class="flex flex-col gap-2">
          <label for="server-name" class="text-xs font-black uppercase tracking-widest">Server name (optional)</label>
          <Input
            id="server-name"
            v-model="serverName"
            :disabled="connectionState.connecting"
            placeholder="My Server"
          />
        </div>
      </div>

      <!-- Authentication -->
      <div class="flex flex-col gap-4">
        <h3 class="text-sm font-black uppercase tracking-widest">Authentication</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="flex flex-col gap-2">
            <label for="server-email" class="text-xs font-black uppercase tracking-widest">Email</label>
            <Input
              id="server-email"
              v-model="email"
              :disabled="connectionState.connecting"
              placeholder="you@example.com"
              @keydown.enter="handleConnect"
            />
            <p v-if="authError" class="text-xs text-brutal-pink font-black uppercase tracking-wide">{{ authError }}</p>
          </div>
          <div class="flex flex-col gap-2">
            <label for="display-name" class="text-xs font-black uppercase tracking-widest">Display name (optional)</label>
            <Input
              id="display-name"
              v-model="displayName"
              :disabled="connectionState.connecting"
              placeholder="Your name"
            />
          </div>
          <div class="flex flex-col gap-2 md:col-span-2">
            <label for="tenant" class="text-xs font-black uppercase tracking-widest">Workspace slug (optional)</label>
            <Input
              id="tenant"
              v-model="tenantSlug"
              :disabled="connectionState.connecting"
              placeholder="default"
            />
            <p class="text-xs text-brutal-text-secondary">Leave blank to use the default workspace.</p>
          </div>
        </div>
      </div>

      <!-- Quick Connect -->
      <div class="flex flex-col gap-4">
        <h3 class="text-sm font-black uppercase tracking-widest">Quick connect</h3>
        <div class="flex flex-wrap gap-3">
          <Button size="sm" variant="secondary" @click="setUrl('http://localhost:4444')">
            Localhost
          </Button>
          <Button size="sm" variant="secondary" @click="showCustomPort = true">
            Custom port
          </Button>
        </div>
      </div>

      <!-- Saved Servers -->
      <div v-if="savedServers.length > 0" class="flex flex-col gap-4">
        <h3 class="text-sm font-black uppercase tracking-widest">Saved servers</h3>
        <ul class="flex flex-col gap-3">
          <li v-for="server in savedServers" :key="server.url" class="flex items-center gap-3">
            <button
              type="button"
              class="flex-1 flex items-start gap-3 p-3 border-3 border-brutal-black bg-brutal-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all text-left"
              @click="selectSavedServer(server)"
            >
              <span class="text-xl">{{ currentServerConfig?.url === server.url ? '●' : '○' }}</span>
              <span class="flex flex-col gap-0.5 flex-1">
                <span class="text-sm font-black uppercase tracking-wider">{{ server.name }}</span>
                <span class="text-xs text-brutal-text-secondary">{{ server.url }}</span>
                <span v-if="server.lastConnected" class="text-xs text-brutal-text-secondary">
                  Last used: {{ formatDate(server.lastConnected) }}
                </span>
              </span>
            </button>
            <Button
              variant="secondary"
              size="icon"
              aria-label="Remove saved server"
              @click="handleRemoveServer(server.url)"
            >
              🗑️
            </Button>
          </li>
        </ul>
      </div>

      <!-- Discovered Servers -->
      <div v-if="discoveredServers.length > 0" class="flex flex-col gap-4">
        <h3 class="text-sm font-black uppercase tracking-widest">Discovered servers</h3>
        <ul class="flex flex-col gap-3">
          <li v-for="server in discoveredServers" :key="server.url" class="flex items-center gap-3">
            <div class="flex-1 flex items-start gap-3 p-3 border-3 border-brutal-black bg-brutal-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <span class="text-xl">📡</span>
              <span class="flex flex-col gap-0.5 flex-1">
                <span class="text-sm font-black uppercase tracking-wider">{{ server.name }}</span>
                <span class="text-xs text-brutal-text-secondary">{{ server.url }}</span>
              </span>
            </div>
            <Button size="sm" variant="primary" @click="selectDiscoveredServer(server)">
              Connect
            </Button>
          </li>
        </ul>
      </div>

      <!-- Footer -->
      <DialogFooter class="flex-col sm:flex-row gap-4 pt-4 border-t-2 border-brutal-border-color">
        <div class="flex flex-col gap-1 flex-1">
          <p class="text-sm font-black uppercase">Prefer to stay local?</p>
          <p class="text-xs text-brutal-text-secondary">You can keep working offline and sync later.</p>
        </div>
        <div class="flex flex-wrap gap-3">
          <Button variant="ghost" @click="handleOfflineMode">
            Continue offline
          </Button>
          <Button
            variant="primary"
            :disabled="!serverUrl || connectionState.connecting"
            @click="handleConnect"
          >
            <template v-if="connectionState.connecting">Connecting…</template>
            <template v-else>Connect</template>
          </Button>
        </div>
      </DialogFooter>

      <!-- Custom Port Dialog -->
      <Dialog v-model:open="showCustomPort">
        <DialogContent class="max-w-sm">
          <DialogHeader>
            <DialogTitle class="uppercase font-black text-lg tracking-wider">Custom port</DialogTitle>
          </DialogHeader>
          <div class="flex flex-col gap-2">
            <label for="custom-port" class="text-xs font-black uppercase tracking-widest">Port</label>
            <Input
              id="custom-port"
              v-model="customPortInput"
              placeholder="4444"
              @keydown.enter="applyCustomPort"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" @click="showCustomPort = false">Cancel</Button>
            <Button variant="primary" @click="applyCustomPort">Apply</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useServerConnection } from "@/composables/useServerConnection";
import type { ServerConfig } from "@/stores/settings";
import { useAuthStore } from "@/stores/auth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui";
import { Button, Input } from "@/components/ui";

interface Props {
  modelValue: boolean;
}

interface Emits {
  (e: "update:modelValue", value: boolean): void;
  (e: "connected"): void;
  (e: "offline"): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const {
  state: connectionState,
  currentServerConfig,
  savedServers,
  connect,
  disconnect,
  removeServer,
  autoDiscover,
} = useServerConnection();

const auth = useAuthStore();

const serverUrl = ref("http://localhost:4444");
const serverName = ref("");
const urlError = ref("");
const discovering = ref(false);
const discoveredServers = ref<ServerConfig[]>([]);
const showCustomPort = ref(false);
const customPort = ref(4444);
const customPortInput = ref(String(customPort.value));
const email = ref(auth.state.email ?? "");
const displayName = ref(auth.state.name ?? "");
const tenantSlug = ref(auth.state.tenantSlug ?? "");
const authError = ref("");

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

function setUrl(url: string) {
  serverUrl.value = url;
  urlError.value = "";
}

function validateUrl(): boolean {
  if (!serverUrl.value) {
    urlError.value = "Please enter a server URL";
    return false;
  }

  try {
    new URL(serverUrl.value);
    urlError.value = "";
    return true;
  } catch {
    urlError.value = "Invalid URL format";
    return false;
  }
}

async function handleConnect() {
  if (!validateUrl()) return;
  if (!email.value || !email.value.includes("@")) {
    authError.value = "Valid email is required";
    return;
  }

  authError.value = "";

  const success = await connect(serverUrl.value, serverName.value || undefined);
  if (success) {
    try {
      await auth.login(
        serverUrl.value,
        email.value.trim(),
        displayName.value.trim() || undefined,
        tenantSlug.value.trim() || undefined
      );
      emit("connected");
      isOpen.value = false;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Authentication failed";
      authError.value = message;
      await disconnect();
    }
  }
}

async function handleDisconnect() {
  await auth.logout();
  disconnect();
  authError.value = "";
}

function handleOfflineMode() {
  auth.clearSession();
  emit("offline");
  isOpen.value = false;
}

function selectSavedServer(server: ServerConfig) {
  serverUrl.value = server.url;
  serverName.value = server.name;
  handleConnect();
}

function selectDiscoveredServer(server: ServerConfig) {
  serverUrl.value = server.url;
  serverName.value = server.name;
  handleConnect();
}

async function handleRemoveServer(url: string) {
  removeServer(url);
}

async function handleAutoDiscover() {
  discovering.value = true;
  try {
    const servers = await autoDiscover();
    discoveredServers.value = servers;
    if (servers.length === 0) {
      urlError.value = "No servers found on local network";
    }
  } catch (error) {
    console.error("Auto-discover failed:", error);
    urlError.value = "Failed to discover servers";
  } finally {
    discovering.value = false;
  }
}

function applyCustomPort() {
  const parsed = Number(customPortInput.value.trim());
  if (!Number.isFinite(parsed) || parsed <= 0) {
    urlError.value = "Enter a valid port number";
    return;
  }

  customPort.value = parsed;
  customPortInput.value = String(parsed);
  serverUrl.value = `http://localhost:${parsed}`;
  showCustomPort.value = false;
  urlError.value = "";
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;

  return date.toLocaleDateString();
}

watch(showCustomPort, (open) => {
  if (open) {
    customPortInput.value = String(customPort.value);
  }
});

function onClose() {
  if (!connectionState.value.connected) {
    emit("offline");
  }
  isOpen.value = false;
}
</script>
