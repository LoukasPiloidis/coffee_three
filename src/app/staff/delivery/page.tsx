import { Notice } from "@/components/Notice";
import { PageShell } from "@/components/PageShell";
import { getDeliveryGuys } from "@/lib/menu";
import { getSession } from "@/lib/session";
import { isDevStaffBypassActive } from "@/lib/staff-auth";
import { staffSignOutAction } from "../actions";
import { StaffNav } from "../StaffNav";
import { StaffSignInForm } from "../StaffSignInForm";
import { DeliveryDashboard } from "./DeliveryDashboard";

export default async function DeliveryPage() {
  const devBypass = isDevStaffBypassActive();
  const session = devBypass ? null : await getSession();

  if (!devBypass && !session?.user) {
    return (
      <PageShell title="Σύνδεση προσωπικού" containerClassName="stack-md" maxWidth="400px">
        <StaffSignInForm />
      </PageShell>
    );
  }

  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!devBypass && role !== "staff") {
    return (
      <PageShell>
        <Notice type="error">
          Είστε συνδεδεμένος ως {session!.user!.email}, αλλά αυτός ο
          λογαριασμός δεν έχει πρόσβαση προσωπικού.
        </Notice>
        <form action={staffSignOutAction} style={{ marginTop: "1rem" }}>
          <button className="btn btn--ghost">Αποσύνδεση</button>
        </form>
      </PageShell>
    );
  }

  const deliveryGuys = await getDeliveryGuys();

  return (
    <PageShell>
      <StaffNav
        activePage="delivery"
        devBypass={devBypass}
        signOutAction={staffSignOutAction}
      />
      <DeliveryDashboard deliveryGuys={deliveryGuys} />
    </PageShell>
  );
}

export const dynamic = "force-dynamic";
