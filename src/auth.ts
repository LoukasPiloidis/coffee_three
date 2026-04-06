import NextAuth from "next-auth";
import Resend from "next-auth/providers/resend";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/db";
import { users, accounts, sessions, verificationTokens } from "@/db/schema";
import { eq } from "drizzle-orm";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [
    Resend({
      apiKey: process.env.AUTH_RESEND_KEY,
      from: process.env.EMAIL_FROM,
    }),
  ],
  session: { strategy: "database" },
  pages: {
    signIn: "/signin",
    verifyRequest: "/signin/verify",
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        // @ts-expect-error role is a custom field
        session.user.role = (user as { role?: string }).role ?? "customer";
      }
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      // Promote configured staff email to staff role on first sign in
      const staffEmail = process.env.STAFF_EMAIL?.toLowerCase();
      if (staffEmail && user.email?.toLowerCase() === staffEmail && user.id) {
        await db
          .update(users)
          .set({ role: "staff" })
          .where(eq(users.id, user.id));
      }
    },
  },
});
