import type { OrderDTO } from "./OrderCard";
import { PAYMENT_LABEL } from "./OrderCard";
import pillStyles from "@/components/StatusPill.module.css";
import styles from "./OrderCard.module.css";

const TYPE_LABEL: Record<OrderDTO["type"], string> = {
  delivery: "Παράδοση",
  takeaway: "Take away",
};

export function OrderHeader({ order }: { order: OrderDTO }) {
  return (
    <div className={styles['order-card__header']}>
      <div>
        <div className={styles['order-card__token']}>
          #{order.publicToken.slice(0, 6)} ·{" "}
          {new Date(order.createdAt).toLocaleTimeString("el-GR")}
        </div>
        <div className={styles['order-card__customer']}>
          {order.guestName ?? "—"} · {order.guestPhone ?? "χωρίς τηλέφωνο"}
        </div>
        {order.type === "delivery" && order.deliveryStreet && (
          <div className={styles['order-card__address']}>
            {order.deliveryStreet}, {order.deliveryCity} {order.deliveryPostcode}
          </div>
        )}
      </div>
      <div className={styles['order-card__badges']}>
        <span className={`${pillStyles['status-pill']} ${pillStyles[`status-pill--${order.type}`]}`}>
          {TYPE_LABEL[order.type]}
        </span>
        <span className={`${pillStyles['status-pill']} ${styles[`payment-pill--${order.paymentMethod}`]}`}>
          {PAYMENT_LABEL[order.paymentMethod]}
        </span>
      </div>
    </div>
  );
}
