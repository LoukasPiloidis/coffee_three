import styles from "./CheckoutForm.module.css";

export function PaymentSection({
  payment,
  setPayment,
  labels,
}: {
  payment: "cash" | "card";
  setPayment: (v: "cash" | "card") => void;
  labels: {
    paymentMethod: string;
    paymentHint: string;
    cash: string;
    card: string;
  };
}) {
  return (
    <div className="option-group">
      <div className="option-group__label">{labels.paymentMethod}</div>
      <div className={styles['payment-hint']}>{labels.paymentHint}</div>
      <div className="option-list">
        <label>
          <input
            type="radio"
            name="payment"
            checked={payment === "cash"}
            onChange={() => setPayment("cash")}
          />
          {labels.cash}
        </label>
        <label>
          <input
            type="radio"
            name="payment"
            checked={payment === "card"}
            onChange={() => setPayment("card")}
          />
          {labels.card}
        </label>
      </div>
    </div>
  );
}
