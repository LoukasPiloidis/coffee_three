import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { PageShell } from "@/components/PageShell";
import { db } from "@/db";
import { addresses, orderItems, orders, user } from "@/db/schema";
import type { Locale } from "@/lib/menu";
import { getSession } from "@/lib/session";
import { AccountDetails } from "./AccountDetails";
import { AddressManager } from "./AddressManager";
import { signOutAction } from "./actions";
import styles from "./Profile.module.css";
import { RecentOrders } from "./RecentOrders";

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

  const orderIds = recent.map((order) => order.id);
  const recentItems =
    orderIds.length > 0 ? await db.select().from(orderItems) : [];
  const itemsByOrder = new Map<string, typeof recentItems>();
  for (const item of recentItems) {
    if (!orderIds.includes(item.orderId)) continue;
    const arr = itemsByOrder.get(item.orderId) ?? [];
    arr.push(item);
    itemsByOrder.set(item.orderId, arr);
  }

  return (
    <PageShell containerClassName="stack-lg">
      <div className={styles.header}>
        <h1>{t("title")}</h1>
        <form action={signOutAction.bind(null, `/${locale}`)}>
          <button className="btn btn--ghost btn--small">
            {tCommon("signOut")}
          </button>
        </form>
      </div>

      <section>
        <h2 className={styles['section-title']}>{t("accountTitle")}</h2>
        <AccountDetails
          initialEmail={account.email}
          initialPhone={account.phone ?? ""}
        />
      </section>

      <section>
        <h2 className={styles['section-title']}>{t("addresses")}</h2>
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
        <h2 className={styles['section-title']}>{t("recentOrders")}</h2>
        <RecentOrders
          orders={recent}
          itemsByOrder={itemsByOrder}
          locale={loc}
          labels={{ view: t("view"), reorder: t("reorder") }}
        />
      </section>
    </PageShell>
  );
}

export const dynamic = "force-dynamic";
