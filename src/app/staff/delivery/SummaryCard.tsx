import styles from "./Delivery.module.css";

type StatItem = {
  label: string;
  value: string;
  variant: "green" | "dark";
};

export function SummaryCard({ stats }: { stats: StatItem[] }) {
  return (
    <div className={`card ${styles.summary}`}>
      {stats.map((s) => (
        <div key={s.label}>
          <div className={styles["summary__label"]}>{s.label}</div>
          <div
            className={`${styles["summary__value"]} ${styles[`summary__value--${s.variant}`]}`}
          >
            {s.value}
          </div>
        </div>
      ))}
    </div>
  );
}
