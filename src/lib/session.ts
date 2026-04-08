import "server-only";
import { headers } from "next/headers";
import { auth } from "@/auth";

/**
 * Returns the current better-auth session for a server component / server
 * action / route handler. Returns `null` when not signed in.
 */
export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}
