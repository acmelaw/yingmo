import { ref } from "vue";
import type { Ref } from "vue";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";

type ProviderStatus = "disconnected" | "connecting" | "connected";

type CollaborationHandle = {
  doc: Ref<Y.Doc | null>;
  status: Ref<ProviderStatus>;
  connect: (baseUrl: string) => void;
  disconnect: () => void;
  dispose: () => void;
};

export function useCollaborationDoc(roomId: string): CollaborationHandle {
  const doc = ref<Y.Doc | null>(null);
  const status = ref<ProviderStatus>("disconnected");

  let provider: WebsocketProvider | null = null;
  let currentUrl: string | null = null;

  function toWebsocketUrl(baseUrl: string): string {
    const trimmed = baseUrl.replace(/\/$/, "");
    if (trimmed.startsWith("https://")) {
      return trimmed.replace(/^https/, "wss") + "/api/sync";
    }
    return trimmed.replace(/^http/, "ws") + "/api/sync";
  }

  function connect(baseUrl: string) {
    if (!baseUrl) return;
    const wsUrl = toWebsocketUrl(baseUrl);

    if (provider && currentUrl === wsUrl) {
      if (status.value !== "connected") {
        provider.connect();
        status.value = "connecting";
      }
      return;
    }

    disconnect();

    currentUrl = wsUrl;
    doc.value = new Y.Doc();
    provider = new WebsocketProvider(wsUrl, roomId, doc.value, {
      connect: false,
    });

    status.value = "connecting";

    provider.on("status", (event: { status: ProviderStatus | "connected" | "disconnected" }) => {
      status.value = event.status === "connected" ? "connected" : "disconnected";
    });

    provider.connect();
  }

  function disconnect() {
    if (provider) {
      provider.destroy();
      provider = null;
    }
    if (doc.value) {
      doc.value.destroy();
      doc.value = null;
    }
    currentUrl = null;
    status.value = "disconnected";
  }

  function dispose() {
    disconnect();
  }

  return {
    doc,
    status,
    connect,
    disconnect,
    dispose,
  };
}
