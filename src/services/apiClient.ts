/**
 * Centralized API client for communicating with the Vue Notes sync server
 */

import type { Note, NoteType } from "@/types/note";

export interface ApiClientConfig {
  baseUrl: string;
  token?: string | null;
  tenantId?: string | null;
}

export interface LoginResponse {
  tenant: {
    id: string;
    slug: string;
    name?: string | null;
  };
  user: {
    id: string;
    email: string;
    name?: string | null;
    preferences?: {
      autoExtractTags?: boolean;
      cleanContentOnExtract?: boolean;
    };
  };
  session: {
    token: string;
    expiresAt: number;
  };
}

export interface NoteSearchFilters {
  type?: NoteType;
  category?: string;
}

export interface NoteListFilters extends NoteSearchFilters {
  archived?: boolean;
}

export interface NoteHistoryEntry {
  id: string;
  noteId: string;
  userId?: string;
  text?: string;
  tags?: string[];
  timestamp: number;
  changeType: string;
  device?: string;
}

class ApiClient {
  private baseUrl = "";
  private token: string | null = null;
  private tenantId: string | null = null;

  configure(config: ApiClientConfig): void {
    this.baseUrl = config.baseUrl.replace(/\/$/, "");
    this.token = config.token ?? null;
    this.tenantId = config.tenantId ?? null;
  }

  clearSession(): void {
    this.token = null;
    this.tenantId = null;
  }

  get isConfigured(): boolean {
    return Boolean(this.baseUrl);
  }

  private buildUrl(
    path: string,
    searchParams?: Record<string, string | number | boolean | undefined>
  ): string {
    if (!this.baseUrl) {
      throw new Error("API client not configured");
    }

    const url = new URL(path, this.baseUrl);

    if (searchParams) {
      Object.entries(searchParams).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        url.searchParams.set(key, String(value));
      });
    }

    return url.toString();
  }

  private buildHeaders(): HeadersInit {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    if (this.tenantId) {
      headers["X-Tenant-ID"] = this.tenantId;
    }

    return headers;
  }

  private async request<T>(
    path: string,
    options: RequestInit & {
      searchParams?: Record<string, string | number | boolean | undefined>;
    } = {}
  ): Promise<T> {
    const { searchParams, ...init } = options;
    const url = this.buildUrl(path, searchParams);

    const response = await fetch(url, {
      ...init,
      headers: {
        ...this.buildHeaders(),
        ...(init.headers ?? {}),
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `API ${response.status} ${response.statusText}: ${errorText || "Unknown error"}`
      );
    }

    if (response.status === 204) {
      return undefined as T;
    }

    const data = (await response.json()) as T;
    return data;
  }

  async login(email: string, name?: string, tenantSlug?: string): Promise<LoginResponse> {
    const result = await this.request<LoginResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, name, tenantSlug }),
    });

    this.token = result.session.token;
    this.tenantId = result.tenant.id;

    return result;
  }

  async logout(token?: string): Promise<void> {
    if (!token && !this.token) return;

    await this.request("/api/auth/logout", {
      method: "POST",
      body: JSON.stringify({ token: token ?? this.token }),
    });

    this.clearSession();
  }

  async listNotes(filters: NoteListFilters & { tenantId: string; userId: string }): Promise<Note[]> {
    const { tenantId, userId, archived, type, category } = filters;

    const response = await this.request<{ notes: Array<Note & { created: number; updated: number }> }>(
      "/api/notes",
      {
        method: "GET",
        searchParams: {
          tenantId,
          userId,
          archived: archived !== undefined ? String(archived) : undefined,
          type,
          category,
        },
      }
    );

    return response.notes.map((note) => ({
      ...note,
      created: typeof note.created === "number" ? note.created : Number(note.created),
      updated: typeof note.updated === "number" ? note.updated : Number(note.updated),
    }));
  }

  async searchNotes(
    tenantId: string,
    userId: string,
    query: string,
    filters?: NoteSearchFilters
  ): Promise<Note[]> {
    const response = await this.request<{ notes: Array<Note & { created: number; updated: number }> }>(
      "/api/notes/search",
      {
        method: "GET",
        searchParams: {
          tenantId,
          userId,
          q: query,
          type: filters?.type,
          category: filters?.category,
        },
      }
    );

    return response.notes.map((note) => ({
      ...note,
      created: Number(note.created),
      updated: Number(note.updated),
    }));
  }

  async createNote(
    type: NoteType,
    data: Record<string, unknown> & { tenantId: string; userId: string }
  ): Promise<Note> {
    const response = await this.request<{ success: boolean; note: Note & { created: number; updated: number } }>(
      "/api/notes",
      {
        method: "POST",
        body: JSON.stringify({
          type,
          tenantId: data.tenantId,
          userId: data.userId,
          data,
        }),
      }
    );

    const { note } = response;
    return {
      ...note,
      created: Number(note.created),
      updated: Number(note.updated),
    };
  }

  async updateNote(
    noteId: string,
    updates: Partial<Note>
  ): Promise<Note> {
    const response = await this.request<{ success: boolean; note: Note & { created: number; updated: number } }>(
      `/api/notes/${noteId}`,
      {
        method: "PUT",
        body: JSON.stringify({ updates }),
      }
    );

    const { note } = response;
    return {
      ...note,
      created: Number(note.created),
      updated: Number(note.updated),
    };
  }

  async deleteNote(noteId: string): Promise<void> {
    await this.request(`/api/notes/${noteId}`, {
      method: "DELETE",
    });
  }

  async getNoteHistory(noteId: string): Promise<NoteHistoryEntry[]> {
    const response = await this.request<{ history: NoteHistoryEntry[] }>(
      `/api/notes/${noteId}/history`,
      {
        method: "GET",
      }
    );

    return response.history;
  }

  async listTags(tenantId: string, sort: "name" | "count" | "recent" = "count") {
    return this.request<{ tags: Array<Record<string, unknown>> }>("/api/tags", {
      method: "GET",
      searchParams: {
        tenantId,
        sort,
      },
    });
  }
}

export const apiClient = new ApiClient();
