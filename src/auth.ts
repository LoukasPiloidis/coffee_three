import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import { user, session, account, verification } from "@/db/schema";
import { eq } from "drizzle-orm";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { user, session, account, verification },
  }),
  secret: process.env.AUTH_SECRET,
  baseURL: process.env.AUTH_URL,
  trustedOrigins: process.env.AUTH_URL ? [process.env.AUTH_URL] : undefined,
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 8,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "customer",
        input: false, // never settable from the client
      },
      phone: {
        type: "string",
        required: false,
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (createdUser) => {
          // Promote configured staff email to staff role on creation.
          const staffEmail = process.env.STAFF_EMAIL?.toLowerCase();
          if (
            staffEmail &&
            createdUser.email?.toLowerCase() === staffEmail
          ) {
            await db
              .update(user)
              .set({ role: "staff" })
              .where(eq(user.id, createdUser.id));
          }
        },
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session;
