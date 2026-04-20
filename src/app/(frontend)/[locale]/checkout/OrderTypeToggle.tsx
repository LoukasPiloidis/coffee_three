import styles from "./CheckoutForm.module.css";

export function OrderTypeToggle({
  orderType,
  setOrderType,
  deliveryLabel,
  takeawayLabel,
}: {
  orderType: "delivery" | "takeaway";
  setOrderType: (type: "delivery" | "takeaway") => void;
  deliveryLabel: string;
  takeawayLabel: string;
}) {
  const isDelivery = orderType === "delivery";
  return (
    <div className={styles['order-type-toggle']}>
      <button
        type="button"
        className={`${styles['order-type-toggle__btn']}${isDelivery ? ` ${styles['order-type-toggle__btn--active']}` : ""}`}
        onClick={() => setOrderType("delivery")}
      >
        {deliveryLabel}
      </button>
      <button
        type="button"
        className={`${styles['order-type-toggle__btn']}${!isDelivery ? ` ${styles['order-type-toggle__btn--active']}` : ""}`}
        onClick={() => setOrderType("takeaway")}
      >
        {takeawayLabel}
      </button>
    </div>
  );
}
