<template>
  <q-dialog v-model="isOpen" persistent>
    <q-card class="server-selector" style="min-width: 500px">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">🌐 Select Server</div>
        <q-space />
        <q-btn icon="close" flat round dense @click="onClose" />
      </q-card-section>

      <q-card-section>
        <p class="text-body2 text-grey-7">
          Connect to a Vue Notes sync server to enable real-time collaboration
          and cross-device synchronization.
        </p>

        <!-- Connection Status -->
        <q-banner
          v-if="connectionState.connected"
          class="bg-positive text-white q-mb-md"
          rounded
        >
          <template #avatar>
            <q-icon name="check_circle" />
          </template>
          Connected to {{ connectionState.server?.name }}
          <template #action>
            <q-btn
              flat
              label="Disconnect"
              color="white"
              @click="handleDisconnect"
            />
          </template>
        </q-banner>

        <q-banner
          v-else-if="connectionState.error"
          class="bg-negative text-white q-mb-md"
          rounded
        >
          <template #avatar>
            <q-icon name="error" />
          </template>
          {{ connectionState.error }}
        </q-banner>

        <!-- Server Input -->
        <div class="q-mb-md">
          <q-input
            v-model="serverUrl"
            label="Server URL"
            placeholder="http://localhost:4444"
            outlined
            :disable="connectionState.connecting"
            :error="!!urlError"
            :error-message="urlError"
            @keyup.enter="handleConnect"
          >
            <template #prepend>
              <q-icon name="dns" />
            </template>
            <template #append>
              <q-btn
                icon="search"
                flat
                round
                dense
                :loading="discovering"
                @click="handleAutoDiscover"
              >
                <q-tooltip>Auto-discover servers</q-tooltip>
              </q-btn>
            </template>
          </q-input>

          <q-input
            v-model="serverName"
            label="Server Name (optional)"
            placeholder="My Server"
            outlined
            class="q-mt-sm"
            :disable="connectionState.connecting"
          >
            <template #prepend>
              <q-icon name="label" />
            </template>
          </q-input>
        </div>

        <!-- Authentication Input -->
        <div class="q-mb-md">
          <q-input
            v-model="email"
            type="email"
            label="Email"
            placeholder="you@example.com"
            outlined
            :disable="connectionState.connecting"
            :error="!!authError"
            :error-message="authError"
          >
            <template #prepend>
              <q-icon name="mail" />
            </template>
          </q-input>

          <q-input
            v-model="displayName"
            label="Display Name (optional)"
            placeholder="Your name"
            outlined
            class="q-mt-sm"
            :disable="connectionState.connecting"
          >
            <template #prepend>
              <q-icon name="badge" />
            </template>
          </q-input>

          <q-input
            v-model="tenantSlug"
            label="Workspace Slug (optional)"
            placeholder="default"
            outlined
            class="q-mt-sm"
            :disable="connectionState.connecting"
          >
            <template #prepend>
              <q-icon name="domain" />
            </template>
            <template #append>
              <q-tooltip>
                Leave blank to use the default workspace
              </q-tooltip>
            </template>
          </q-input>
        </div>

        <!-- Quick Connect -->
        <div class="q-mb-md">
          <div class="text-subtitle2 q-mb-xs">Quick Connect</div>
          <div class="row q-gutter-sm">
            <q-btn
              outline
              size="sm"
              label="Localhost"
              @click="setUrl('http://localhost:4444')"
            />
            <q-btn
              outline
              size="sm"
              label="Custom Port"
              @click="showCustomPort = true"
            />
          </div>
        </div>

        <!-- Saved Servers -->
        <div v-if="savedServers.length > 0" class="q-mb-md">
          <div class="text-subtitle2 q-mb-xs">Saved Servers</div>
          <q-list bordered separator>
            <q-item
              v-for="server in savedServers"
              :key="server.url"
              clickable
              @click="selectSavedServer(server)"
            >
              <q-item-section avatar>
                <q-icon
                  :name="
                    currentServerConfig?.url === server.url
                      ? 'radio_button_checked'
                      : 'radio_button_unchecked'
                  "
                  :color="
                    currentServerConfig?.url === server.url ? 'primary' : ''
                  "
                />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ server.name }}</q-item-label>
                <q-item-label caption>{{ server.url }}</q-item-label>
                <q-item-label v-if="server.lastConnected" caption>
                  Last used: {{ formatDate(server.lastConnected) }}
                </q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-btn
                  icon="delete"
                  flat
                  round
                  dense
                  size="sm"
                  @click.stop="handleRemoveServer(server.url)"
                >
                  <q-tooltip>Remove server</q-tooltip>
                </q-btn>
              </q-item-section>
            </q-item>
          </q-list>
        </div>

        <!-- Discovered Servers -->
        <div v-if="discoveredServers.length > 0" class="q-mb-md">
          <div class="text-subtitle2 q-mb-xs">Discovered Servers</div>
          <q-list bordered separator>
            <q-item
              v-for="server in discoveredServers"
              :key="server.url"
              clickable
              @click="selectDiscoveredServer(server)"
            >
              <q-item-section avatar>
                <q-icon name="wifi_find" color="positive" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ server.name }}</q-item-label>
                <q-item-label caption>{{ server.url }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-btn
                  label="Connect"
                  color="primary"
                  size="sm"
                  @click.stop="selectDiscoveredServer(server)"
                />
              </q-item-section>
            </q-item>
          </q-list>
        </div>

        <!-- Offline Mode -->
        <q-separator class="q-my-md" />
        <div class="text-center">
          <q-btn
            flat
            label="Continue in Offline Mode"
            icon="cloud_off"
            @click="handleOfflineMode"
          />
          <div class="text-caption text-grey-6 q-mt-xs">
            Your notes will only be stored locally
          </div>
        </div>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Cancel" @click="onClose" />
        <q-btn
          color="primary"
          label="Connect"
          :loading="connectionState.connecting"
          :disable="!serverUrl || connectionState.connecting"
          @click="handleConnect"
        />
      </q-card-actions>
    </q-card>

    <!-- Custom Port Dialog -->
    <q-dialog v-model="showCustomPort">
      <q-card style="min-width: 300px">
        <q-card-section>
          <div class="text-h6">Custom Port</div>
        </q-card-section>
        <q-card-section>
          <q-input
            v-model.number="customPort"
            type="number"
            label="Port"
            outlined
            @keyup.enter="applyCustomPort"
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn
            color="primary"
            label="Apply"
            @click="applyCustomPort"
            v-close-popup
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useServerConnection } from "@/composables/useServerConnection";
import type { ServerConfig } from "@/stores/settings";
import { useAuthStore } from "@/stores/auth";

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
  serverUrl.value = `http://localhost:${customPort.value}`;
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

function onClose() {
  if (!connectionState.value.connected) {
    emit("offline");
  }
  isOpen.value = false;
}
</script>

<style scoped lang="sass">
.server-selector
  max-width: 600px
</style>
