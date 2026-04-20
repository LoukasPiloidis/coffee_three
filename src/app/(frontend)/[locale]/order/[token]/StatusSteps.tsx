import pillStyles from "@/components/StatusPill.module.css";
import styles from "./OrderStatusView.module.css";

type OrderStatus = "received" | "preparing" | "on_its_way" | "completed" | "cancelled";

const DELIVERY_STEPS: OrderStatus[] = [
  "received",
  "preparing",
  "on_its_way",
  "completed",
];
const TAKEAWAY_STEPS: OrderStatus[] = [
  "received",
  "preparing",
  "completed",
];

const DISPLAY_KEY: Record<OrderStatus, string> = {
  received: "received",
  preparing: "preparing",
  on_its_way: "on_its_way",
  completed: "completed",
  cancelled: "cancelled",
};

export function StatusSteps({
  type,
  status,
  t,
}: {
  type: "delivery" | "takeaway";
  status: OrderStatus;
  t: (key: string) => string;
}) {
  const isCancelled = status === "cancelled";

  if (isCancelled) {
    return (
      <div className={styles['cancelled-center']}>
        <span className={`${pillStyles['status-pill']} ${pillStyles['status-pill--cancelled']}`}>
          {t(status)}
        </span>
      </div>
    );
  }

  const steps = type === "takeaway" ? TAKEAWAY_STEPS : DELIVERY_STEPS;
  const activeIdx = steps.indexOf(status);

  const visible: { step: OrderStatus; active: boolean }[] = [
    { step: steps[activeIdx], active: true },
  ];
  const next = steps[activeIdx + 1];
  if (next) visible.push({ step: next, active: false });

  return (
    <div
      className={styles['status-steps']}
      style={{ gridTemplateColumns: `repeat(${visible.length}, 1fr)` }}
    >
      {visible.map(({ step, active }) => (
        <div
          key={step}
          className={`${styles['status-step']} ${active ? styles['status-step--active'] : styles['status-step--inactive']}`}
        >
          {t(DISPLAY_KEY[step])}
        </div>
      ))}
    </div>
  );
}
