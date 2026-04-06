import { auth, signIn, signOut } from "@/auth";
import StaffDashboard from "./StaffDashboard";
import { isDevStaffBypassActive } from "@/lib/staff-auth";

export default async function StaffPage() {
  const devBypass = isDevStaffBypassActive();
  const session = devBypass ? null : await auth();

  if (!devBypass && !session?.user) {
    return (
      <main className="page">
        <div className="container stack-md" style={{ maxWidth: "400px" }}>
          <h1 className="page__title">Staff sign in</h1>
          <form
            action={async (formData) => {
              "use server";
              await signIn("resend", {
                email: formData.get("email"),
                redirectTo: "/staff",
              });
            }}
            className="card stack-md"
          >
            <div className="field">
              <label>Email</label>
              <input type="email" name="email" required />
            </div>
            <button className="btn btn--primary btn--block">
              Send magic link
            </button>
          </form>
        </div>
      </main>
    );
  }

  // @ts-expect-error custom role field
  if (!devBypass && session!.user!.role !== "staff") {
    return (
      <main className="page">
        <div className="container">
          <div className="notice notice--error">
            You are signed in as {session!.user!.email}, but this account does
            not have staff access.
          </div>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/staff" });
            }}
            style={{ marginTop: "1rem" }}
          >
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
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/staff" });
              }}
            >
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
