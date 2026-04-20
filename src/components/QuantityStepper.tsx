import styles from "./QuantityStepper.module.css";

export function QuantityStepper({
  value,
  min = 1,
  onChange,
}: {
  value: number;
  min?: number;
  onChange: (next: number) => void;
}) {
  return (
    <div className={styles.stepper}>
      <button
        type="button"
        className={styles.btn}
        onClick={() => onChange(Math.max(min, value - 1))}
        aria-label="decrease"
      >
        −
      </button>
      <span className={styles.value}>{value}</span>
      <button
        type="button"
        className={styles.btn}
        onClick={() => onChange(value + 1)}
        aria-label="increase"
      >
        +
      </button>
    </div>
  );
}
