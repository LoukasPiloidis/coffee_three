import { Notice } from "@/components/Notice";
import { PageShell } from "@/components/PageShell";
import { getAnalyticsByDateRange } from "@/lib/analytics";
import { isDevStaffBypassActive, isStaffAuthorized } from "@/lib/staff-auth";
import { staffSignOutAction } from "../actions";
import { StaffNav } from "../StaffNav";
import { AnalyticsDashboard } from "./AnalyticsDashboard";

export default async function AnalyticsPage() {
  const devBypass = isDevStaffBypassActive();
  const authorized = await isStaffAuthorized();

  if (!authorized) {
    return (
      <PageShell>
        <Notice type="error">
          Access denied. Staff login required.
        </Notice>
      </PageShell>
    );
  }

  const today = new Date()
    .toLocaleDateString("sv-SE", { timeZone: "Europe/Athens" })
    .slice(0, 10);
  const todayData = await getAnalyticsByDateRange(today, today);

  return (
    <PageShell>
      <StaffNav
        activePage="analytics"
        devBypass={devBypass}
        signOutAction={staffSignOutAction}
      />
      <AnalyticsDashboard todayData={todayData[0] ?? null} />
    </PageShell>
  );
}

export const dynamic = "force-dynamic";
