import type { OrderDTO } from "./OrderCard";
import styles from "./Staff.module.css";

const DELIVERY_NEXT_STATUS: Record<OrderDTO["status"], OrderDTO["status"] | null> = {
  received: "preparing",
  preparing: "on_its_way",
  on_its_way: null,
  completed: null,
  cancelled: null,
};
const TAKEAWAY_NEXT_STATUS: Record<OrderDTO["status"], OrderDTO["status"] | null> = {
  received: "preparing",
  preparing: "completed",
  on_its_way: null,
  completed: null,
  cancelled: null,
};

export function getNextStatus(order: OrderDTO): OrderDTO["status"] | null {
  return order.type === "takeaway"
    ? TAKEAWAY_NEXT_STATUS[order.status]
    : DELIVERY_NEXT_STATUS[order.status];
}

function getNextLabel(order: OrderDTO): string {
  if (order.status === "received") return "Έναρξη ετοιμασίας";
  if (order.status === "preparing") {
    return order.type === "takeaway" ? "Έτοιμο" : "Αποστολή";
  }
  return "";
}

export function ActionButtons({
  order,
  isTerminal,
  next,
  onTransition,
}: {
  order: OrderDTO;
  isTerminal: boolean;
  next: OrderDTO["status"] | null;
  onTransition: (id: string, status: OrderDTO["status"]) => void;
}) {
  return (
    <div className={styles['action-buttons']}>
      {!isTerminal && (
        <button
          className="btn btn--danger btn--small"
          onClick={() => onTransition(order.id, "cancelled")}
        >
          Ακύρωση
        </button>
      )}
      {next && (
        <button
          className="btn btn--primary btn--small"
          onClick={() => onTransition(order.id, next)}
        >
          {getNextLabel(order)}
        </button>
      )}
    </div>
  );
}
