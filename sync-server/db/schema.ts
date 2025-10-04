/**
 * Database Schema for Multi-tenant Vue Notes Sync Server
 *
 * Supports: SQLite, PostgreSQL, MySQL
 * ORM: Drizzle
 */

import {
  pgTable,
  mysqlTable,
  sqliteTable,
  text,
  integer,
  timestamp,
  boolean,
  json,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import type { InferSelectModel, InferInsertModel } from "drizzle-orm";

// Determine database type from environment
const DB_TYPE = process.env.DATABASE_TYPE || "sqlite"; // sqlite | postgres | mysql

// Helper to create tables based on database type
const createTable = (name: string, columns: any) => {
  switch (DB_TYPE) {
    case "postgres":
      return pgTable(name, columns);
    case "mysql":
      return mysqlTable(name, columns);
    default:
      return sqliteTable(name, columns);
  }
};

/**
 * Tenants - Organizations or workspaces
 */
export const tenants = sqliteTable(
  "tenants",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    domain: text("domain"), // Custom domain (optional)

    // Configuration
    authStrategy: text("auth_strategy").notNull().default("none"), // none | credentials | oidc | oauth
    authConfig: text("auth_config", { mode: "json" }), // JSON config for auth provider

    // Limits
    maxUsers: integer("max_users").default(10),
    maxDocuments: integer("max_documents").default(1000),
    maxStorageMb: integer("max_storage_mb").default(100),

    // Features
    featuresEnabled: text("features_enabled", { mode: "json" }).default("[]"), // Array of feature flags

    // Status
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),

    // Metadata
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
    metadata: text("metadata", { mode: "json" }), // Additional custom data
  },
  (table) => ({
    slugIdx: uniqueIndex("slug_idx").on(table.slug),
    domainIdx: index("domain_idx").on(table.domain),
  })
);

/**
 * Users - Tenant users
 */
export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),

    // Identity
    email: text("email").notNull(),
    emailVerified: integer("email_verified", { mode: "boolean" }).default(
      false
    ),
    name: text("name"),
    image: text("image"),

    // Authentication (for credentials strategy)
    passwordHash: text("password_hash"),

    // OAuth/OIDC (external provider)
    providerId: text("provider_id"), // e.g., 'google', 'github', 'okta'
    providerUserId: text("provider_user_id"), // ID from the provider

    // Authorization
    role: text("role").notNull().default("member"), // owner | admin | member | viewer
    permissions: text("permissions", { mode: "json" }).default("[]"), // Array of permissions

    // Status
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    lastLoginAt: integer("last_login_at", { mode: "timestamp" }),

    // Metadata
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
    metadata: text("metadata", { mode: "json" }),
  },
  (table) => ({
    tenantEmailIdx: uniqueIndex("tenant_email_idx").on(
      table.tenantId,
      table.email
    ),
    tenantProviderIdx: index("tenant_provider_idx").on(
      table.tenantId,
      table.providerId,
      table.providerUserId
    ),
  })
);

/**
 * Sessions - User sessions
 */
export const sessions = sqliteTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),

    // Session data
    token: text("token").notNull().unique(),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),

    // Client info
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),

    // Metadata
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    lastActivityAt: integer("last_activity_at", {
      mode: "timestamp",
    }).notNull(),
  },
  (table) => ({
    tokenIdx: uniqueIndex("token_idx").on(table.token),
    userIdx: index("user_idx").on(table.userId),
    expiresIdx: index("expires_idx").on(table.expiresAt),
  })
);

/**
 * Documents - Yjs documents (rooms)
 */
export const documents = sqliteTable(
  "documents",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),

    // Document info
    name: text("name").notNull(),
    description: text("description"),

    // Yjs state
    yjsState: text("yjs_state", { mode: "json" }), // Serialized Yjs document
    yjsStateVector: text("yjs_state_vector"), // For efficient syncing

    // Access control
    ownerId: text("owner_id")
      .notNull()
      .references(() => users.id),
    visibility: text("visibility").notNull().default("private"), // private | team | public

    // Metadata
    size: integer("size").default(0), // Size in bytes
    version: integer("version").default(0), // Document version

    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
    lastAccessedAt: integer("last_accessed_at", { mode: "timestamp" }),

    metadata: text("metadata", { mode: "json" }),
  },
  (table) => ({
    tenantIdx: index("tenant_idx").on(table.tenantId),
    ownerIdx: index("owner_idx").on(table.ownerId),
    visibilityIdx: index("visibility_idx").on(table.visibility),
  })
);

/**
 * Document Permissions - Granular access control
 */
export const documentPermissions = sqliteTable(
  "document_permissions",
  {
    id: text("id").primaryKey(),
    documentId: text("document_id")
      .notNull()
      .references(() => documents.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    // Permissions
    canRead: integer("can_read", { mode: "boolean" }).notNull().default(true),
    canWrite: integer("can_write", { mode: "boolean" })
      .notNull()
      .default(false),
    canDelete: integer("can_delete", { mode: "boolean" })
      .notNull()
      .default(false),
    canShare: integer("can_share", { mode: "boolean" })
      .notNull()
      .default(false),

    // Metadata
    grantedAt: integer("granted_at", { mode: "timestamp" }).notNull(),
    grantedBy: text("granted_by").references(() => users.id),
    expiresAt: integer("expires_at", { mode: "timestamp" }),
  },
  (table) => ({
    docUserIdx: uniqueIndex("doc_user_idx").on(table.documentId, table.userId),
    userIdx: index("user_perm_idx").on(table.userId),
  })
);

/**
 * Audit Log - Track all important actions
 */
export const auditLog = sqliteTable(
  "audit_log",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),

    // Actor
    userId: text("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    userEmail: text("user_email"),

    // Action
    action: text("action").notNull(), // e.g., 'document.create', 'user.login', 'permission.grant'
    resourceType: text("resource_type"), // e.g., 'document', 'user', 'tenant'
    resourceId: text("resource_id"),

    // Details
    details: text("details", { mode: "json" }),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),

    // Metadata
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (table) => ({
    tenantIdx: index("audit_tenant_idx").on(table.tenantId),
    userIdx: index("audit_user_idx").on(table.userId),
    actionIdx: index("audit_action_idx").on(table.action),
    createdIdx: index("audit_created_idx").on(table.createdAt),
  })
);

/**
 * API Keys - For programmatic access
 */
export const apiKeys = sqliteTable(
  "api_keys",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    // Key info
    name: text("name").notNull(),
    keyHash: text("key_hash").notNull().unique(), // Hashed API key
    keyPrefix: text("key_prefix").notNull(), // First 8 chars for identification

    // Permissions
    scopes: text("scopes", { mode: "json" }).notNull(), // Array of allowed scopes

    // Status
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    expiresAt: integer("expires_at", { mode: "timestamp" }),
    lastUsedAt: integer("last_used_at", { mode: "timestamp" }),

    // Metadata
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    metadata: text("metadata", { mode: "json" }),
  },
  (table) => ({
    keyHashIdx: uniqueIndex("key_hash_idx").on(table.keyHash),
    tenantIdx: index("apikey_tenant_idx").on(table.tenantId),
    userIdx: index("apikey_user_idx").on(table.userId),
  })
);

// Type exports
export type Tenant = InferSelectModel<typeof tenants>;
export type NewTenant = InferInsertModel<typeof tenants>;

export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;

export type Session = InferSelectModel<typeof sessions>;
export type NewSession = InferInsertModel<typeof sessions>;

export type Document = InferSelectModel<typeof documents>;
export type NewDocument = InferInsertModel<typeof documents>;

export type DocumentPermission = InferSelectModel<typeof documentPermissions>;
export type NewDocumentPermission = InferInsertModel<
  typeof documentPermissions
>;

export type AuditLog = InferSelectModel<typeof auditLog>;
export type NewAuditLog = InferInsertModel<typeof auditLog>;

export type ApiKey = InferSelectModel<typeof apiKeys>;
export type NewApiKey = InferInsertModel<typeof apiKeys>;
