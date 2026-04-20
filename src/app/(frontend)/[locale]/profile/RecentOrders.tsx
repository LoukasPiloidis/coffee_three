import { Link } from "@/i18n/navigation";
import { formatPrice, type Locale } from "@/lib/menu";
import ReorderButton from "./ReorderButton";
import styles from "./Profile.module.css";

type OrderRow = {
  id: string;
  publicToken: string;
  createdAt: Date;
  totalCents: number;
};

type OrderItem = {
  orderId: string;
  menuSlug: string;
  titleSnapshot: unknown;
  unitPriceCents: number;
  quantity: number;
  comment: string | null;
};

export function RecentOrders({
  orders,
  itemsByOrder,
  locale,
  labels,
}: {
  orders: OrderRow[];
  itemsByOrder: Map<string, OrderItem[]>;
  locale: Locale;
  labels: { view: string; reorder: string };
}) {
  if (orders.length === 0) {
    return <p className="empty">—</p>;
  }

  return (
    <div className="stack-sm">
      {orders.map((order) => {
        const items = itemsByOrder.get(order.id) ?? [];
        return (
          <div key={order.id} className="card stack-sm">
            <div className={styles['order-header']}>
              <div>
                <div className={styles['order-date']}>
                  {new Date(order.createdAt).toLocaleString(
                    locale === "el" ? "el-GR" : "en-US"
                  )}
                </div>
                <div className={styles['order-total']}>
                  {formatPrice(order.totalCents / 100, locale)}
                </div>
              </div>
            </div>
            <div className={styles['order-items']}>
              {items
                .map(
                  (item) =>
                    `${item.quantity}× ${
                      (item.titleSnapshot as { en: string; el: string })[locale]
                    }`
                )
                .join(", ")}
            </div>
            <div className={styles['order-actions']}>
              <Link
                href={`/order/${order.publicToken}`}
                className="btn btn--ghost btn--small"
              >
                {labels.view}
              </Link>
              <ReorderButton
                items={items.map((item) => ({
                  slug: item.menuSlug,
                  title: item.titleSnapshot as { en: string; el: string },
                  unitPrice: item.unitPriceCents / 100,
                  quantity: item.quantity,
                  options: [],
                  comment: item.comment ?? "",
                }))}
                label={labels.reorder}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
