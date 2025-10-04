import { computed } from "vue";
import { useStorage } from "@vueuse/core";
import { defineStore, acceptHMRUpdate } from "pinia";
import { apiClient } from "@/services/apiClient";
import type { LoginResponse } from "@/services/apiClient";

export interface AuthState {
  email?: string;
  name?: string;
  tenantId?: string;
  tenantSlug?: string;
  tenantName?: string | null;
  userId?: string;
  token?: string;
  sessionExpiresAt?: number;
  baseUrl?: string;
}

const STORAGE_KEY = "vue-notes.auth";

export const useAuthStore = defineStore("auth", () => {
  const state = useStorage<AuthState>(STORAGE_KEY, {});

  const isAuthenticated = computed(() => Boolean(state.value.token));
  const tenantId = computed(() => state.value.tenantId);
  const userId = computed(() => state.value.userId);
  const token = computed(() => state.value.token);

  function setSession(login: LoginResponse, baseUrl?: string) {
    state.value.email = login.user.email;
    state.value.name = login.user.name ?? undefined;
    state.value.tenantId = login.tenant.id;
    state.value.tenantSlug = login.tenant.slug;
    state.value.tenantName = login.tenant.name ?? null;
    state.value.userId = login.user.id;
    state.value.token = login.session.token;
    state.value.sessionExpiresAt = login.session.expiresAt;

    if (baseUrl) {
      state.value.baseUrl = baseUrl;
    }

    if (state.value.baseUrl) {
      apiClient.configure({
        baseUrl: state.value.baseUrl,
        token: state.value.token,
        tenantId: state.value.tenantId,
      });
    }
  }

  function clearSession() {
    state.value = {};
    apiClient.clearSession();
  }

  async function login(
    baseUrl: string,
    email: string,
    name?: string,
    tenantSlug?: string
  ) {
    apiClient.configure({ baseUrl });
    const response = await apiClient.login(email, name, tenantSlug);
    setSession(response, baseUrl);
    return response;
  }

  async function logout() {
    if (state.value.token) {
      await apiClient.logout(state.value.token);
    }
    clearSession();
  }

  if (state.value.baseUrl && state.value.token && state.value.tenantId) {
    apiClient.configure({
      baseUrl: state.value.baseUrl,
      token: state.value.token,
      tenantId: state.value.tenantId,
    });
  }

  return {
    state,
    isAuthenticated,
    tenantId,
    userId,
    token,
    login,
    logout,
    setSession,
    clearSession,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAuthStore, import.meta.hot));
}
