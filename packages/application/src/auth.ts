import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";
import { drizzle } from "drizzle-orm/node-postgres";
import { emailMessage, enqueueMail } from "../../adapters/src/mail";
import * as schema from "../../database/src/auth-schema";
import { authPool } from "../../database/src/connections";
import type { Actor, Locale } from "../../domain/src/workspaces/permissions";
import { listWorkspaces, updatePreference } from "./workspaces";

function requestLocale(request?: Request, fallback = "en"): Locale {
  const cookie = request?.headers.get("cookie") ?? "";
  const match = cookie.match(/(?:^|;\s*)locale=(fa|en)(?:;|$)/);
  return (match?.[1] ?? (fallback === "fa" ? "fa" : "en")) as Locale;
}
async function authEmail(
  kind: "verify" | "reset",
  user: { email: string; preferredLocale?: unknown },
  url: string,
  request?: Request,
) {
  const locale = requestLocale(request, String(user.preferredLocale ?? "en"));
  const c = await authPool().connect();
  try {
    await enqueueMail(c, {
      to: user.email,
      ...emailMessage(kind, locale, url),
    });
  } finally {
    c.release();
  }
}
function makeAuth() {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret || secret.length < 32)
    throw new Error("BETTER_AUTH_SECRET must contain at least 32 characters");
  const baseURL = process.env.APP_URL;
  if (!baseURL) throw new Error("Missing APP_URL");
  if (process.env.NODE_ENV === "production" && !baseURL.startsWith("https://"))
    throw new Error("Production APP_URL must use HTTPS");
  return betterAuth({
    appName: "Learning Platform",
    baseURL,
    secret,
    trustedOrigins: [new URL(baseURL).origin],
    database: drizzleAdapter(drizzle(authPool(), { schema }), {
      provider: "pg",
      schema,
      transaction: true,
    }),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      minPasswordLength: 12,
      maxPasswordLength: 128,
      revokeSessionsOnPasswordReset: true,
      resetPasswordTokenExpiresIn: 3600,
      sendResetPassword: async ({ user, url }, request) =>
        authEmail("reset", user, url, request),
    },
    emailVerification: {
      sendOnSignUp: true,
      sendOnSignIn: true,
      autoSignInAfterVerification: true,
      expiresIn: 3600,
      sendVerificationEmail: async ({ user, url }, request) =>
        authEmail("verify", user, url, request),
      afterEmailVerification: async (user, request) => {
        const locale = requestLocale(request);
        const actor: Actor = {
          ...user,
          preferredLocale: locale,
          emailVerified: true,
        };
        await updatePreference(actor, locale);
        await listWorkspaces(actor);
      },
    },
    user: {
      additionalFields: {
        preferredLocale: {
          type: "string",
          required: false,
          defaultValue: "en",
          input: false,
        },
      },
    },
    session: {
      expiresIn: 604800,
      updateAge: 86400,
      cookieCache: { enabled: false },
    },
    advanced: { useSecureCookies: process.env.NODE_ENV === "production" },
    rateLimit: {
      enabled: true,
      storage: "database",
      window: 60,
      max: 100,
      customRules: {
        "/sign-in/email": { window: 60, max: 10 },
        "/sign-up/email": { window: 60, max: 5 },
        "/request-password-reset": { window: 60, max: 5 },
      },
    },
    logger: { disabled: process.env.NODE_ENV === "test", level: "error" },
  });
}
let instance: ReturnType<typeof makeAuth> | undefined;
export function getAuth() {
  instance ??= makeAuth();
  return instance;
}
export async function sessionActor(headers: Headers): Promise<Actor | null> {
  const session = await getAuth().api.getSession({ headers });
  return session
    ? { ...session.user, preferredLocale: session.user.preferredLocale ?? "en" }
    : null;
}
