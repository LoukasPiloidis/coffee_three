import { isDevStaffBypassActive, isStaffAuthorized } from "@/lib/staff-auth";
import { getMenu } from "@/lib/menu";
import { staffSignOutAction } from "../actions";
import ProductsList from "./ProductsList";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

export default async function StaffProductsPage() {
  const devBypass = isDevStaffBypassActive();
  const authorized = await isStaffAuthorized();
  const t = await getTranslations("staff");

  if (!authorized) {
    return (
      <main className="page">
        <div className="container">
          <div className="notice notice--error">{t("forbidden")}</div>
        </div>
      </main>
    );
  }

  const categories = await getMenu();

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
          <h1>
            {t("orders.title")}
            {devBypass && " (dev bypass)"}
          </h1>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <Link href="/staff" className="btn btn--ghost btn--small">
              {t("title")}
            </Link>
            {!devBypass && (
              <form action={staffSignOutAction}>
                <button className="btn btn--ghost btn--small">
                  {t("signOut")}
                </button>
              </form>
            )}
          </div>
        </div>
        <p style={{ color: "var(--text-muted)", marginBottom: "1rem" }}>
          {t("orders.explanation")}
        </p>
        <ProductsList categories={categories} />
      </div>
    </main>
  );
}

export const dynamic = "force-dynamic";
