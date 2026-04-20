import { Notice } from "@/components/Notice";
import { getDeliveryGuys } from "@/lib/menu";
import { getSession } from "@/lib/session";
import { isDevStaffBypassActive } from "@/lib/staff-auth";
import { staffSignOutAction } from "../actions";
import { StaffNav } from "../StaffNav";
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
          <Notice type="error">
            Είστε συνδεδεμένος ως {session!.user!.email}, αλλά αυτός ο
            λογαριασμός δεν έχει πρόσβαση προσωπικού.
          </Notice>
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
        <StaffNav
          activePage="delivery"
          devBypass={devBypass}
          signOutAction={staffSignOutAction}
        />
        <DeliveryDashboard deliveryGuys={deliveryGuys} />
      </div>
    </main>
  );
}

export const dynamic = "force-dynamic";
