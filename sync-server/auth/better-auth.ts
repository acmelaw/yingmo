/**
 * Better Auth Configuration with Multi-tenancy
 * Supports: No-auth, Credentials, OIDC, OAuth
 */

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db";
import { users, sessions, tenants } from "../db/schema";
import type { BetterAuthOptions } from "better-auth";

const BASE_URL = process.env.BASE_URL || "http://localhost:4444";
const AUTH_SECRET =
  process.env.AUTH_SECRET || "your-secret-key-change-in-production";

/**
 * Base authentication configuration
 */
const baseAuthConfig: BetterAuthOptions = {
  database: drizzleAdapter(db, {
    provider: (process.env.DATABASE_TYPE || "sqlite") as any,
    schema: {
      user: users,
      session: sessions,
    },
  }),

  secret: AUTH_SECRET,
  baseURL: BASE_URL,

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Update every 24 hours
  },

  trustedOrigins: process.env.ALLOWED_ORIGINS?.split(",") || [],

  advanced: {
    generateId: () => crypto.randomUUID(),
  },
};

/**
 * Credentials authentication plugin
 */
export const credentialsAuth = {
  id: "credentials" as const,

  endpoints: {
    signUp: {
      path: "/sign-up",
      method: "POST" as const,
    },
    signIn: {
      path: "/sign-in",
      method: "POST" as const,
    },
  },
};

/**
 * OAuth providers configuration
 */
export const getOAuthProviders = () => {
  const providers: any[] = [];

  // Google OAuth
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    providers.push({
      id: "google",
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    });
  }

  // GitHub OAuth
  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    providers.push({
      id: "github",
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    });
  }

  // Microsoft/Azure AD OAuth
  if (process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET) {
    providers.push({
      id: "microsoft",
      clientId: process.env.MICROSOFT_CLIENT_ID,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
      tenant: process.env.MICROSOFT_TENANT || "common",
    });
  }

  return providers;
};

/**
 * OIDC provider configuration
 */
export const getOIDCProvider = () => {
  if (!process.env.OIDC_ISSUER) return null;

  return {
    id: "oidc",
    name: process.env.OIDC_NAME || "OIDC",
    issuer: process.env.OIDC_ISSUER,
    clientId: process.env.OIDC_CLIENT_ID!,
    clientSecret: process.env.OIDC_CLIENT_SECRET!,
    scopes: process.env.OIDC_SCOPES?.split(",") || [
      "openid",
      "profile",
      "email",
    ],
  };
};

/**
 * Create auth instance based on configuration
 */
export const createAuth = (authStrategy: string = "none") => {
  const config = { ...baseAuthConfig };

  switch (authStrategy.toLowerCase()) {
    case "credentials":
      return betterAuth({
        ...config,
        emailAndPassword: {
          enabled: true,
          requireEmailVerification:
            process.env.REQUIRE_EMAIL_VERIFICATION === "true",
        },
      });

    case "oauth": {
      const socialProviders = getOAuthProviders();
      if (socialProviders.length === 0) {
        throw new Error("No OAuth providers configured");
      }
      return betterAuth({
        ...config,
        socialProviders,
      });
    }

    case "oidc": {
      const oidcProvider = getOIDCProvider();
      if (!oidcProvider) {
        throw new Error("OIDC provider not configured");
      }
      return betterAuth({
        ...config,
        socialProviders: [oidcProvider as any],
      });
    }

    case "all": {
      // Enable everything
      const socialProviders = getOAuthProviders();
      const oidcProvider = getOIDCProvider();

      return betterAuth({
        ...config,
        emailAndPassword: {
          enabled: true,
          requireEmailVerification:
            process.env.REQUIRE_EMAIL_VERIFICATION === "true",
        },
        socialProviders: [
          ...socialProviders,
          ...(oidcProvider ? [oidcProvider as any] : []),
        ],
      });
    }

    case "none":
    default:
      // No authentication - development mode or open access
      return null;
  }
};

/**
 * Default auth instance (can be reconfigured per tenant)
 */
export const auth = createAuth(process.env.AUTH_STRATEGY || "none");
