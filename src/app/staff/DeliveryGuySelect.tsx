import type { OrderDTO } from "./OrderCard";
import styles from "./Staff.module.css";

export function DeliveryGuySelect({
  order,
  deliveryGuys,
  onAssign,
}: {
  order: OrderDTO;
  deliveryGuys: string[];
  onAssign: (orderId: string, guy: string | null) => void;
}) {
  if (deliveryGuys.length === 0) return null;
  return (
    <div className={styles['delivery-guy-select']}>
      <label
        htmlFor={`dg-${order.id}`}
        className={styles['delivery-guy-select__label']}
      >
        Διανομέας
      </label>
      <select
        id={`dg-${order.id}`}
        value={order.deliveryGuy ?? ""}
        onChange={(e) => onAssign(order.id, e.target.value || null)}
        className={styles['delivery-guy-select__input']}
      >
        <option value="">—</option>
        {deliveryGuys.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>
    </div>
  );
}
