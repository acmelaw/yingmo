/**
 * Authentication routes
 * Provides lightweight tenant-aware login suitable for the Vue Notes client
 */

import type { FastifyInstance } from "fastify";
import { randomUUID } from "crypto";
import { and, eq } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { schema } from "../db/index.js";

type DB = BetterSQLite3Database<typeof schema>;

interface LoginBody {
  email: string;
  name?: string;
  tenantSlug?: string;
}

interface LogoutBody {
  token: string;
}

/**
 * Register authentication routes
 */
export async function registerAuthRoutes(
  fastify: FastifyInstance,
  db: DB
) {
  fastify.post<{ Body: LoginBody }>("/api/auth/login", async (request, reply) => {
    const { email, name, tenantSlug = "default" } = request.body;

    if (!email) {
      reply.code(400);
      return { error: "Email is required" };
    }

    const now = new Date();

    // Ensure tenant exists
    let [tenant] = await db
      .select()
      .from(schema.tenants)
      .where(eq(schema.tenants.slug, tenantSlug))
      .limit(1);

    if (!tenant) {
      [tenant] = await db
        .insert(schema.tenants)
        .values({
          id: randomUUID(),
          slug: tenantSlug,
          name: tenantSlug === "default" ? "Default Workspace" : tenantSlug,
          settings: null,
          createdAt: now,
          updatedAt: now,
        })
        .returning();
    } else if (!tenant.name && name) {
      // Backfill name if missing
      [tenant] = await db
        .update(schema.tenants)
        .set({ name, updatedAt: now })
        .where(eq(schema.tenants.id, tenant.id))
        .returning();
    }

    // Ensure user exists
    let [user] = await db
      .select()
      .from(schema.users)
      .where(
        and(
          eq(schema.users.tenantId, tenant.id),
          eq(schema.users.email, email.toLowerCase())
        )
      )
      .limit(1);

    if (!user) {
      [user] = await db
        .insert(schema.users)
        .values({
          id: randomUUID(),
          tenantId: tenant.id,
          email: email.toLowerCase(),
          name: name ?? email.split("@")[0],
          autoExtractTags: true,
          cleanContentOnExtract: false,
          createdAt: now,
          updatedAt: now,
        })
        .returning();
    } else if (name && user.name !== name) {
      [user] = await db
        .update(schema.users)
        .set({ name, updatedAt: now })
        .where(eq(schema.users.id, user.id))
        .returning();
    }

    // Rotate session token
    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // 7 days

    await db
      .delete(schema.sessions)
      .where(eq(schema.sessions.userId, user.id));

    const [session] = await db
      .insert(schema.sessions)
      .values({
        id: randomUUID(),
        userId: user.id,
        token,
        expiresAt,
        ipAddress: request.ip,
        userAgent: request.headers["user-agent"],
        createdAt: now,
        lastActive: now,
      })
      .returning();

    return {
      tenant: {
        id: tenant.id,
        slug: tenant.slug,
        name: tenant.name,
      },
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        preferences: {
          autoExtractTags: Boolean(user.autoExtractTags),
          cleanContentOnExtract: Boolean(user.cleanContentOnExtract),
        },
      },
      session: {
        token: session.token,
        expiresAt: session.expiresAt.getTime(),
      },
    };
  });

  fastify.post<{ Body: LogoutBody }>("/api/auth/logout", async (request) => {
    const { token } = request.body;
    if (!token) {
      return { success: true };
    }

    await db.delete(schema.sessions).where(eq(schema.sessions.token, token));
    return { success: true };
  });
}
