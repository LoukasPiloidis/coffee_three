import "server-only";
import { auth } from "@/auth";

/**
 * Returns true if the current request should be allowed to access staff
 * endpoints. In production this requires an authenticated user with
 * `role === "staff"`. In non-production, setting `DEV_STAFF_BYPASS=1`
 * short-circuits the check so you can work on the dashboard without
 * configuring Resend + a real email round-trip.
 */
export async function isStaffAuthorized(): Promise<boolean> {
  if (
    process.env.NODE_ENV !== "production" &&
    process.env.DEV_STAFF_BYPASS === "1"
  ) {
    return true;
  }
  const session = await auth();
  // @ts-expect-error custom role field on session.user
  return session?.user?.role === "staff";
}

export function isDevStaffBypassActive(): boolean {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.DEV_STAFF_BYPASS === "1"
  );
}
