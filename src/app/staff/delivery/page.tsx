import Link from "next/link";
import { getDeliveryGuys } from "@/lib/menu";
import { getSession } from "@/lib/session";
import { isDevStaffBypassActive } from "@/lib/staff-auth";
import { staffSignOutAction } from "../actions";
import StaffSignInForm from "../StaffSignInForm";
import DeliveryDashboard from "./DeliveryDashboard";

export default async function DeliveryPage() {
  const devBypass = isDevStaffBypassActive();
  const session = devBypass ? null : await getSession();

  if (!devBypass && !session?.user) {
    return (
      <main className="page">
        <div className="container stack-md" style={{ maxWidth: "400px" }}>
          <h1 className="page__title">Σύνδεση προσωπικού</h1>
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
            Είστε συνδεδεμένος ως {session!.user!.email}, αλλά αυτός ο
            λογαριασμός δεν έχει πρόσβαση προσωπικού.
          </div>
          <form action={staffSignOutAction} style={{ marginTop: "1rem" }}>
            <button className="btn btn--ghost">Αποσύνδεση</button>
          </form>
        </div>
      </main>
    );
  }

  const deliveryGuys = await getDeliveryGuys();

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
          <h1>Διανομές{devBypass && " (dev bypass)"}</h1>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <Link href="/staff" className="btn btn--ghost btn--small">
              Παραγγελίες
            </Link>
            <Link href="/staff/analytics" className="btn btn--ghost btn--small">
              Analytics
            </Link>
            {!devBypass && (
              <form action={staffSignOutAction}>
                <button className="btn btn--ghost btn--small">
                  Αποσύνδεση
                </button>
              </form>
            )}
          </div>
        </div>
        <DeliveryDashboard deliveryGuys={deliveryGuys} />
      </div>
    </main>
  );
}

export const dynamic = "force-dynamic";
