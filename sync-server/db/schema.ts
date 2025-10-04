/**
 * Database Schema for Vue Notes Sync Server v2.0
 */

import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import type { InferSelectModel, InferInsertModel } from "drizzle-orm";

export const tenants = sqliteTable("tenants", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  settings: text("settings", { mode: "json" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    name: text("name"),
    autoExtractTags: integer("auto_extract_tags", { mode: "boolean" })
      .notNull()
      .default(true),
    cleanContentOnExtract: integer("clean_content_on_extract", {
      mode: "boolean",
    })
      .notNull()
      .default(false),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (table) => ({
    emailIdx: index("user_email_idx").on(table.email),
    tenantIdx: index("user_tenant_idx").on(table.tenantId),
  })
);

export const notes = sqliteTable(
  "notes",
  {
    id: text("id").primaryKey(),
    type: text("type").notNull().default("text"), // Note type: text, rich-text, image, etc.
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    
    // Common fields
    tags: text("tags", { mode: "json" }).$type<string[]>(),
    category: text("category"),
    archived: integer("archived", { mode: "boolean" }).notNull().default(false),
    metadata: text("metadata", { mode: "json" }),
    created: integer("created", { mode: "timestamp" }).notNull(),
    updated: integer("updated", { mode: "timestamp" }).notNull(),
    
    // Type-specific content stored as JSON
    content: text("content", { mode: "json" }).notNull(),
    
    // Legacy fields for backward compatibility
    text: text("text"), // For text notes
    tiptapContent: text("tiptap_content", { mode: "json" }), // Legacy rich text
  },
  (table) => ({
    userIdx: index("note_user_idx").on(table.userId),
    tenantIdx: index("note_tenant_idx").on(table.tenantId),
    typeIdx: index("note_type_idx").on(table.type),
    updatedIdx: index("note_updated_idx").on(table.updated),
    archivedIdx: index("note_archived_idx").on(table.archived),
  })
);

export const noteEdits = sqliteTable(
  "note_edits",
  {
    id: text("id").primaryKey(),
    noteId: text("note_id")
      .notNull()
      .references(() => notes.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => users.id),
    text: text("text").notNull(),
    tags: text("tags", { mode: "json" }).$type<string[]>(),
    timestamp: integer("timestamp", { mode: "timestamp" }).notNull(),
    changeType: text("change_type").notNull(),
    device: text("device"),
  },
  (table) => ({
    noteIdx: index("edit_note_idx").on(table.noteId),
    timestampIdx: index("edit_timestamp_idx").on(table.timestamp),
  })
);

const tags = sqliteTable(
  "tags",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    displayName: text("display_name"),
    description: text("description"),
    color: text("color"),
    parentId: text("parent_id"),
    useCount: integer("use_count").notNull().default(0),
    lastUsed: integer("last_used", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (table) => ({
    nameIdx: index("tag_name_idx").on(table.name),
    tenantIdx: index("tag_tenant_idx").on(table.tenantId),
    useCountIdx: index("tag_use_count_idx").on(table.useCount),
  })
);

export { tags };

export const documents = sqliteTable(
  "yjs_documents",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    state: text("state").notNull(),
    lastUpdated: integer("last_updated", { mode: "timestamp" }).notNull(),
    version: integer("version").notNull().default(0),
  },
  (table) => ({
    tenantIdx: index("doc_tenant_idx").on(table.tenantId),
  })
);

export const sessions = sqliteTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
    token: text("token").notNull().unique(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    lastActive: integer("last_active", { mode: "timestamp" }).notNull(),
  },
  (table) => ({
    userIdx: index("session_user_idx").on(table.userId),
    tokenIdx: index("session_token_idx").on(table.token),
    expiresIdx: index("session_expires_idx").on(table.expiresAt),
  })
);

export type Tenant = InferSelectModel<typeof tenants>;
export type InsertTenant = InferInsertModel<typeof tenants>;
export type User = InferSelectModel<typeof users>;
export type InsertUser = InferInsertModel<typeof users>;
export type Note = InferSelectModel<typeof notes>;
export type InsertNote = InferInsertModel<typeof notes>;
export type NoteEdit = InferSelectModel<typeof noteEdits>;
export type InsertNoteEdit = InferInsertModel<typeof noteEdits>;
export type Tag = InferSelectModel<typeof tags>;
export type InsertTag = InferInsertModel<typeof tags>;
export type YjsDocument = InferSelectModel<typeof documents>;
export type InsertYjsDocument = InferInsertModel<typeof documents>;
export type Session = InferSelectModel<typeof sessions>;
export type InsertSession = InferInsertModel<typeof sessions>;
