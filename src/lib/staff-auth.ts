import "server-only";
import { getSession } from "@/lib/session";

/**
 * Returns true if the current request should be allowed to access staff
 * endpoints. In production this requires an authenticated user with
 * `role === "staff"`. In non-production, setting `DEV_STAFF_BYPASS=1`
 * short-circuits the check so you can work on the dashboard without
 * needing a real account.
 */
export async function isStaffAuthorized(): Promise<boolean> {
  if (
    process.env.NODE_ENV !== "production" &&
    process.env.DEV_STAFF_BYPASS === "1"
  ) {
    return true;
  }
  const session = await getSession();
  return (session?.user as { role?: string } | undefined)?.role === "staff";
}

export function isDevStaffBypassActive(): boolean {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.DEV_STAFF_BYPASS === "1"
  );
}
