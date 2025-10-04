/**
 * Authentication and Authorization Middleware
 */

import type { Request, Response, NextFunction } from "express";
import { db } from "../db";
import { users, sessions, tenants, documentPermissions } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "./better-auth";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    tenantId: string;
    role: string;
    permissions: string[];
  };
  tenant?: {
    id: string;
    slug: string;
    authStrategy: string;
  };
  session?: {
    id: string;
    token: string;
  };
}

/**
 * Extract tenant from request (subdomain, domain, or header)
 */
export async function extractTenant(req: Request): Promise<string | null> {
  // 1. Check X-Tenant-ID header
  const tenantHeader = req.headers["x-tenant-id"] as string;
  if (tenantHeader) return tenantHeader;

  // 2. Check subdomain (e.g., acme.notes.example.com -> acme)
  const host = req.headers.host || "";
  const subdomain = host.split(".")[0];
  if (subdomain && subdomain !== "www" && subdomain !== "localhost") {
    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.slug, subdomain))
      .limit(1);
    return tenant?.id || null;
  }

  // 3. Check custom domain
  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.domain, host))
    .limit(1);

  return tenant?.id || null;
}

/**
 * Middleware: Extract and validate tenant
 */
export async function tenantMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const tenantId = await extractTenant(req);

    if (!tenantId) {
      // Use default tenant or create one
      const defaultTenantId = process.env.DEFAULT_TENANT_ID || "default";
      let [tenant] = await db
        .select()
        .from(tenants)
        .where(eq(tenants.id, defaultTenantId))
        .limit(1);

      if (!tenant) {
        // Create default tenant
        [tenant] = await db
          .insert(tenants)
          .values({
            id: defaultTenantId,
            slug: "default",
            name: "Default Workspace",
            authStrategy: process.env.AUTH_STRATEGY || "none",
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();
      }

      req.tenant = tenant;
    } else {
      const [tenant] = await db
        .select()
        .from(tenants)
        .where(and(eq(tenants.id, tenantId), eq(tenants.isActive, true)))
        .limit(1);

      if (!tenant) {
        return res.status(404).json({ error: "Tenant not found or inactive" });
      }

      req.tenant = tenant;
    }

    next();
  } catch (error) {
    console.error("Tenant middleware error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Middleware: Authenticate user (optional - depends on tenant auth strategy)
 */
export async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const tenant = req.tenant;
    if (!tenant) {
      return res.status(400).json({ error: "Tenant required" });
    }

    // If tenant has no auth, skip authentication
    if (tenant.authStrategy === "none") {
      // Create anonymous user for this session
      req.user = {
        id: "anonymous",
        email: "anonymous@localhost",
        tenantId: tenant.id,
        role: "member",
        permissions: ["read", "write"],
      };
      return next();
    }

    // Extract token from Authorization header or cookie
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.substring(7)
      : req.cookies?.session;

    if (!token) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Verify session
    const [session] = await db
      .select()
      .from(sessions)
      .where(and(eq(sessions.token, token), eq(sessions.tenantId, tenant.id)))
      .limit(1);

    if (!session || session.expiresAt < new Date()) {
      return res.status(401).json({ error: "Invalid or expired session" });
    }

    // Get user
    const [user] = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.id, session.userId),
          eq(users.tenantId, tenant.id),
          eq(users.isActive, true)
        )
      )
      .limit(1);

    if (!user) {
      return res.status(401).json({ error: "User not found or inactive" });
    }

    // Update session activity
    await db
      .update(sessions)
      .set({ lastActivityAt: new Date() })
      .where(eq(sessions.id, session.id));

    req.user = {
      id: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role,
      permissions: (user.permissions as string[]) || [],
    };
    req.session = {
      id: session.id,
      token: session.token,
    };

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Middleware: Require authentication (always enforces auth)
 */
export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.user || req.user.id === "anonymous") {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
}

/**
 * Middleware: Check user role
 */
export function requireRole(...roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    next();
  };
}

/**
 * Middleware: Check user permission
 */
export function requirePermission(...permissions: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const hasPermission = permissions.some((p) =>
      req.user!.permissions.includes(p)
    );

    if (!hasPermission) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    next();
  };
}

/**
 * Check if user can access document
 */
export async function canAccessDocument(
  userId: string,
  documentId: string,
  requiredPermission: "read" | "write" | "delete" | "share" = "read"
): Promise<boolean> {
  const [permission] = await db
    .select()
    .from(documentPermissions)
    .where(
      and(
        eq(documentPermissions.documentId, documentId),
        eq(documentPermissions.userId, userId)
      )
    )
    .limit(1);

  if (!permission) return false;

  // Check expiration
  if (permission.expiresAt && permission.expiresAt < new Date()) {
    return false;
  }

  switch (requiredPermission) {
    case "read":
      return permission.canRead;
    case "write":
      return permission.canWrite;
    case "delete":
      return permission.canDelete;
    case "share":
      return permission.canShare;
    default:
      return false;
  }
}

/**
 * Middleware: Check document access
 */
export function requireDocumentAccess(
  permission: "read" | "write" | "delete" | "share" = "read"
) {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const documentId = req.params.documentId || req.params.roomId;
    if (!documentId) {
      return res.status(400).json({ error: "Document ID required" });
    }

    const hasAccess = await canAccessDocument(
      req.user.id,
      documentId,
      permission
    );
    if (!hasAccess) {
      return res.status(403).json({ error: "Access denied" });
    }

    next();
  };
}
