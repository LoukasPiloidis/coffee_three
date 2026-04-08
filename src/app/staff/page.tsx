import StaffDashboard from "./StaffDashboard";
import StaffSignInForm from "./StaffSignInForm";
import { staffSignOutAction } from "./actions";
import { isDevStaffBypassActive } from "@/lib/staff-auth";
import { getSession } from "@/lib/session";

export default async function StaffPage() {
  const devBypass = isDevStaffBypassActive();
  const session = devBypass ? null : await getSession();

  if (!devBypass && !session?.user) {
    return (
      <main className="page">
        <div className="container stack-md" style={{ maxWidth: "400px" }}>
          <h1 className="page__title">Staff sign in</h1>
          <StaffSignInForm />
        </div>
      </main>
    );
  }

  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!devBypass && role !== "staff") {
    return (
      <main className="page">
        <div className="container">
          <div className="notice notice--error">
            You are signed in as {session!.user!.email}, but this account does
            not have staff access.
          </div>
          <form action={staffSignOutAction} style={{ marginTop: "1rem" }}>
            <button className="btn btn--ghost">Sign out</button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="container">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1rem",
          }}
        >
          <h1>Orders{devBypass && " (dev bypass)"}</h1>
          {!devBypass && (
            <form action={staffSignOutAction}>
              <button className="btn btn--ghost btn--small">Sign out</button>
            </form>
          )}
        </div>
        <StaffDashboard />
      </div>
    </main>
  );
}

export const dynamic = "force-dynamic";
