import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { account, session, user, verification } from "@/db/schema";
import { sendEmail } from "@/lib/email";
import { resetPasswordEmail, verificationEmail } from "@/lib/email-templates";

const extractLocale = (request: Request | undefined): "en" | "el" => {
  const referer = request?.headers.get("referer") ?? "";
  if (referer.includes("/en/") || referer.endsWith("/en")) return "en";
  return "el";
};

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
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }, request) => {
      const locale = extractLocale(request);
      const { subject, html } = resetPasswordEmail({ url, locale });
      await sendEmail({ to: user.email, subject, html });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }, request) => {
      const locale = extractLocale(request);
      const { subject, html } = verificationEmail({ url, locale });
      await sendEmail({ to: user.email, subject, html });
    },
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
          if (staffEmail && createdUser.email?.toLowerCase() === staffEmail) {
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
