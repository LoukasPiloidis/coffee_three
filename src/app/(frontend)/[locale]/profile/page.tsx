import { getSession } from "@/lib/session";
import { signOutAction } from "./actions";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { db } from "@/db";
import { addresses, orderItems, orders, user } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { Link } from "@/i18n/navigation";
import { formatPrice, type Locale } from "@/lib/menu";
import ReorderButton from "./ReorderButton";
import AddressManager from "./AddressManager";
import AccountDetails from "./AccountDetails";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const loc = locale as Locale;
  const session = await getSession();
  if (!session?.user?.id) {
    redirect(`/${locale}/signin`);
  }
  const userId = session.user.id;

  const t = await getTranslations("profile");
  const tCommon = await getTranslations("common");

  const [savedAddresses, recent, accountRows] = await Promise.all([
    db.select().from(addresses).where(eq(addresses.userId, userId)),
    db
      .select()
      .from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt))
      .limit(5),
    db
      .select({ email: user.email, phone: user.phone })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1),
  ]);
  const account = accountRows[0] ?? {
    email: session.user.email,
    phone: null,
  };

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
          <form action={signOutAction.bind(null, `/${locale}`)}>
            <button className="btn btn--ghost btn--small">
              {tCommon("signOut")}
            </button>
          </form>
        </div>

        <section>
          <h2 style={{ marginBottom: "0.75rem" }}>{t("accountTitle")}</h2>
          <AccountDetails
            initialEmail={account.email}
            initialPhone={account.phone ?? ""}
          />
        </section>

        <section>
          <h2 style={{ marginBottom: "0.75rem" }}>{t("addresses")}</h2>
          <AddressManager
            initialAddresses={savedAddresses.map((a) => ({
              id: a.id,
              label: a.label,
              street: a.street,
              city: a.city,
              postcode: a.postcode,
              notes: a.notes,
            }))}
          />
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
                        items={items.map((i) => {
                          // Historical option snapshots may or may not
                          // carry groupKey/optionKey depending on when the
                          // order was placed. Drop options entirely on
                          // reorder — the customer re-selects them on the
                          // item page, which also guarantees we never
                          // restore an option that has since been disabled.
                          return {
                            slug: i.menuSlug,
                            title: i.titleSnapshot as {
                              en: string;
                              el: string;
                            },
                            unitPrice: i.unitPriceCents / 100,
                            quantity: i.quantity,
                            options: [],
                            comment: i.comment ?? "",
                          };
                        })}
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
