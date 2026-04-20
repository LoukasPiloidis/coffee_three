import { OrderCard, type OrderDTO } from "./OrderCard";
import { ActionButtons, getNextStatus } from "./ActionButtons";
import { DeliveryGuySelect } from "./DeliveryGuySelect";
import styles from "./Staff.module.css";

export function OrderColumn({
  label,
  orders,
  deliveryGuys,
  onTransition,
  onAssign,
}: {
  label: string;
  orders: OrderDTO[];
  deliveryGuys: string[];
  onTransition: (id: string, status: OrderDTO["status"]) => void;
  onAssign: (orderId: string, guy: string | null) => void;
}) {
  const isTerminal = (s: OrderDTO["status"]) =>
    s === "completed" || s === "cancelled" || s === "on_its_way";

  return (
    <div>
      <div className={styles['staff-column__header']}>
        {label}
        <span className={styles['staff-column__count']}>{orders.length}</span>
      </div>
      {orders.length === 0 && (
        <p className="empty" style={{ fontSize: "0.85rem" }}>
          Κενό
        </p>
      )}
      <div className="stack-md">
        {orders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            className={order.status === "cancelled" ? styles['staff-card--cancelled'] : undefined}
            actions={
              <ActionButtons
                order={order}
                isTerminal={isTerminal(order.status)}
                next={getNextStatus(order)}
                onTransition={onTransition}
              />
            }
          >
            {order.type === "delivery" && (
              <DeliveryGuySelect
                order={order}
                deliveryGuys={deliveryGuys}
                onAssign={onAssign}
              />
            )}
          </OrderCard>
        ))}
      </div>
    </div>
  );
}
