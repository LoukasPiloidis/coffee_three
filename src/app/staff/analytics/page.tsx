import Link from "next/link";
import { getAnalyticsByDateRange } from "@/lib/analytics";
import { isDevStaffBypassActive, isStaffAuthorized } from "@/lib/staff-auth";
import { staffSignOutAction } from "../actions";
import AnalyticsDashboard from "./AnalyticsDashboard";

export default async function AnalyticsPage() {
  const devBypass = isDevStaffBypassActive();
  const authorized = await isStaffAuthorized();

  if (!authorized) {
    return (
      <main className="page">
        <div className="container">
          <div className="notice notice--error">
            Access denied. Staff login required.
          </div>
        </div>
      </main>
    );
  }

  const today = new Date()
    .toLocaleDateString("sv-SE", { timeZone: "Europe/Athens" })
    .slice(0, 10);
  const todayData = await getAnalyticsByDateRange(today, today);

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
          <h1>Analytics{devBypass && " (dev bypass)"}</h1>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <Link href="/staff" className="btn btn--ghost btn--small">
              Παραγγελίες
            </Link>
            <Link href="/staff/delivery" className="btn btn--ghost btn--small">
              Διανομές
            </Link>
            <Link href="/staff/products" className="btn btn--ghost btn--small">
              Προϊόντα
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
        <AnalyticsDashboard todayData={todayData[0] ?? null} />
      </div>
    </main>
  );
}

export const dynamic = "force-dynamic";
