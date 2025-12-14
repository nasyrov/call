import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { betterAuth } from "better-auth/minimal";

import { env } from "~/env";
import { db } from "~/server/db";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    usePlural: true,
  }),
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      // TODO: Configure actual email sending
      console.log(`Password reset link for ${user.email}: ${url}`);
    },
  },
  advanced: {
    useSecureCookies: env.NODE_ENV === "production",
    database: {
      generateId: "uuid",
    },
  },
});

export type Session = typeof auth.$Infer.Session;
