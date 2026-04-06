import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { db } from "@/db";
import { addresses, orderItems, orders } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { Link } from "@/i18n/navigation";
import { formatPrice, type Locale } from "@/lib/menu";
import ReorderButton from "./ReorderButton";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const loc = locale as Locale;
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/${locale}/signin`);
  }

  const t = await getTranslations("profile");
  const tCommon = await getTranslations("common");

  const [savedAddresses, recent] = await Promise.all([
    db.select().from(addresses).where(eq(addresses.userId, session.user.id!)),
    db
      .select()
      .from(orders)
      .where(eq(orders.userId, session.user.id!))
      .orderBy(desc(orders.createdAt))
      .limit(5),
  ]);

  // Fetch items for all recent orders in one query
  const orderIds = recent.map((o) => o.id);
  const recentItems =
    orderIds.length > 0
      ? await db.select().from(orderItems)
      : [];
  const itemsByOrder = new Map<string, typeof recentItems>();
  for (const it of recentItems) {
    if (!orderIds.includes(it.orderId)) continue;
    const arr = itemsByOrder.get(it.orderId) ?? [];
    arr.push(it);
    itemsByOrder.set(it.orderId, arr);
  }

  return (
    <main className="page">
      <div className="container stack-lg">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h1>{t("title")}</h1>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: `/${locale}` });
            }}
          >
            <button className="btn btn--ghost btn--small">
              {tCommon("signOut")}
            </button>
          </form>
        </div>

        <div style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
          {session.user.email}
        </div>

        <section>
          <h2 style={{ marginBottom: "0.75rem" }}>{t("addresses")}</h2>
          {savedAddresses.length === 0 ? (
            <p className="empty">—</p>
          ) : (
            <div className="stack-sm">
              {savedAddresses.map((a) => (
                <div key={a.id} className="card">
                  <div style={{ fontWeight: 600 }}>{a.label ?? a.street}</div>
                  <div
                    style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}
                  >
                    {a.street}, {a.city} {a.postcode}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 style={{ marginBottom: "0.75rem" }}>{t("recentOrders")}</h2>
          {recent.length === 0 ? (
            <p className="empty">—</p>
          ) : (
            <div className="stack-sm">
              {recent.map((o) => {
                const items = itemsByOrder.get(o.id) ?? [];
                return (
                  <div key={o.id} className="card stack-sm">
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "0.75rem",
                            color: "var(--text-muted)",
                          }}
                        >
                          {new Date(o.createdAt).toLocaleString(
                            loc === "el" ? "el-GR" : "en-US"
                          )}
                        </div>
                        <div style={{ fontWeight: 600 }}>
                          {formatPrice(o.totalCents / 100, loc)}
                        </div>
                      </div>
                      <span className={`status-pill status-pill--${o.status}`}>
                        {o.status}
                      </span>
                    </div>
                    <div
                      style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}
                    >
                      {items
                        .map(
                          (i) =>
                            `${i.quantity}× ${
                              (i.titleSnapshot as { en: string; el: string })[
                                loc
                              ]
                            }`
                        )
                        .join(", ")}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: "0.5rem",
                      }}
                    >
                      <Link
                        href={`/order/${o.publicToken}`}
                        className="btn btn--ghost btn--small"
                      >
                        View
                      </Link>
                      <ReorderButton
                        items={items.map((i) => ({
                          slug: i.menuSlug,
                          title: i.titleSnapshot as {
                            en: string;
                            el: string;
                          },
                          unitPrice: i.unitPriceCents / 100,
                          quantity: i.quantity,
                          options: (i.optionsJson as unknown) as {
                            groupName: { en: string; el: string };
                            optionName: { en: string; el: string };
                          }[],
                          comment: i.comment ?? "",
                        }))}
                        label={t("reorder")}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export const dynamic = "force-dynamic";
