import { Notice } from "@/components/Notice";
import { isDevStaffBypassActive, isStaffAuthorized } from "@/lib/staff-auth";
import { getMenu } from "@/lib/menu";
import { staffSignOutAction } from "../actions";
import { StaffNav } from "../StaffNav";
import ProductsList from "./ProductsList";
import { getTranslations } from "next-intl/server";

export default async function StaffProductsPage() {
  const devBypass = isDevStaffBypassActive();
  const authorized = await isStaffAuthorized();
  const t = await getTranslations("staff");

  if (!authorized) {
    return (
      <main className="page">
        <div className="container">
          <Notice type="error">{t("forbidden")}</Notice>
        </div>
      </main>
    );
  }

  const categories = await getMenu();

  return (
    <main className="page">
      <div className="container">
        <StaffNav
          activePage="products"
          title={t("orders.title")}
          devBypass={devBypass}
          signOutAction={staffSignOutAction}
        />
        <p style={{ color: "var(--text-muted)", marginBottom: "1rem" }}>
          {t("orders.explanation")}
        </p>
        <ProductsList categories={categories} />
      </div>
    </main>
  );
}

export const dynamic = "force-dynamic";
