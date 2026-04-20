import type { OrderDTO } from "./OrderCard";
import { formatEuro, PAYMENT_LABEL } from "./OrderCard";
import styles from "./OrderCard.module.css";

export function OrderFooter({
  order,
  actions,
}: {
  order: OrderDTO;
  actions?: React.ReactNode;
}) {
  return (
    <div className={styles['order-card__footer']}>
      <strong className={styles['order-card__total']}>
        {formatEuro(order.totalCents)} · {PAYMENT_LABEL[order.paymentMethod]}
        {order.tipCents > 0 && (
          <span className={styles['order-card__tip']}>
            + {formatEuro(order.tipCents)} φιλοδώρημα
          </span>
        )}
      </strong>
      {actions}
    </div>
  );
}
