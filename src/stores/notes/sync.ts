/**
 * Sync manager for handling offline queue and server synchronization
 */

import type { Note, NoteType } from "@/types/note";
import type { apiClient } from "@/services/apiClient";

export interface SyncConfig {
  apiClient: typeof apiClient;
  getTenantId: () => string | undefined;
  getUserId: () => string | undefined;
  getToken: () => string | undefined;
}

export interface SyncResult {
  synced: number;
  failed: number;
  errors: Array<{ noteId: string; error: string }>;
}

export class SyncManager {
  private config: SyncConfig;
  private pendingSync: Set<string> = new Set();
  private syncing = false;

  constructor(config: SyncConfig) {
    this.config = config;
  }

  /**
   * Add a note to the pending sync queue
   */
  addToPendingQueue(noteId: string): void {
    this.pendingSync.add(noteId);
  }

  /**
   * Remove a note from the pending sync queue
   */
  removeFromPendingQueue(noteId: string): void {
    this.pendingSync.delete(noteId);
  }

  /**
   * Get all pending note IDs
   */
  getPendingNotes(): string[] {
    return Array.from(this.pendingSync);
  }

  /**
   * Check if a note is pending sync
   */
  isPending(noteId: string): boolean {
    return this.pendingSync.has(noteId);
  }

  /**
   * Check if currently syncing
   */
  isSyncing(): boolean {
    return this.syncing;
  }

  /**
   * Sync all pending notes to the server
   */
  async syncPendingNotes(notes: Note[]): Promise<SyncResult> {
    const { getTenantId, getUserId, getToken, apiClient } = this.config;
    
    const tenantId = getTenantId();
    const userId = getUserId();
    const token = getToken();

    if (!tenantId || !userId || !token) {
      return { synced: 0, failed: 0, errors: [] };
    }

    if (this.syncing) {
      return { synced: 0, failed: 0, errors: [] };
    }

    this.syncing = true;
    const result: SyncResult = { synced: 0, failed: 0, errors: [] };
    const pending = this.getPendingNotes();

    try {
      for (const noteId of pending) {
        const note = notes.find((n) => n.id === noteId);
        
        if (!note) {
          // Note was deleted, remove from pending
          this.removeFromPendingQueue(noteId);
          continue;
        }

        try {
          // Try to get remote version first
          const remoteNotes = await apiClient.listNotes({ tenantId, userId });
          const remoteNote = remoteNotes.find((n: Note) => n.id === noteId);

          if (remoteNote) {
            // Note exists remotely, update it if local is newer
            if (note.updated > remoteNote.updated) {
              await apiClient.updateNote(noteId, note);
            }
          } else {
            // Note doesn't exist remotely, create it
            await apiClient.createNote(note.type, {
              ...note,
              tenantId,
              userId,
            });
          }

          this.removeFromPendingQueue(noteId);
          result.synced++;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          result.failed++;
          result.errors.push({ noteId, error: errorMessage });
          console.error(`Failed to sync note ${noteId}:`, error);
        }
      }
    } finally {
      this.syncing = false;
    }

    return result;
  }

  /**
   * Create a note on the server
   */
  async createOnServer(
    type: NoteType,
    data: Record<string, unknown>
  ): Promise<Note | null> {
    const { getTenantId, getUserId, apiClient } = this.config;
    
    const tenantId = getTenantId();
    const userId = getUserId();

    if (!tenantId || !userId) {
      return null;
    }

    try {
      const created = await apiClient.createNote(type, {
        ...data,
        tenantId,
        userId,
      });
      return created;
    } catch (error) {
      console.error("Failed to create note on server:", error);
      return null;
    }
  }

  /**
   * Update a note on the server
   */
  async updateOnServer(
    noteId: string,
    updates: Partial<Note>
  ): Promise<Note | null> {
    try {
      const updated = await this.config.apiClient.updateNote(noteId, updates);
      return updated;
    } catch (error) {
      console.error("Failed to update note on server:", error);
      return null;
    }
  }

  /**
   * Delete a note on the server
   */
  async deleteOnServer(noteId: string): Promise<boolean> {
    try {
      await this.config.apiClient.deleteNote(noteId);
      return true;
    } catch (error) {
      console.error("Failed to delete note on server:", error);
      return false;
    }
  }

  /**
   * Fetch notes from the server
   */
  async fetchFromServer(): Promise<Note[]> {
    const { getTenantId, getUserId, apiClient } = this.config;
    
    const tenantId = getTenantId();
    const userId = getUserId();

    if (!tenantId || !userId) {
      return [];
    }

    try {
      const notes = await apiClient.listNotes({ tenantId, userId });
      return notes;
    } catch (error) {
      console.error("Failed to fetch notes from server:", error);
      return [];
    }
  }

  /**
   * Clear the pending sync queue
   */
  clear(): void {
    this.pendingSync.clear();
  }

  /**
   * Get sync queue state for serialization
   */
  getState(): string[] {
    return this.getPendingNotes();
  }

  /**
   * Restore sync queue state from serialization
   */
  setState(noteIds: string[]): void {
    this.pendingSync = new Set(noteIds);
  }
}
