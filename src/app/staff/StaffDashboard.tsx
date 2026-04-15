"use client";

import { useEffect, useState, useTransition } from "react";
import { assignDeliveryGuyAction, updateStatusAction } from "./actions";
import OrderCard, {
  type OrderDTO,
  STATUS_LABEL,
} from "./OrderCard";

// Staff flow: received -> preparing -> on_its_way. After on_its_way, orders
// auto-complete one hour after they were placed (handled server-side), so
// staff never has to mark "completed" manually.
const NEXT_STATUS: Record<OrderDTO["status"], OrderDTO["status"] | null> = {
  received: "preparing",
  preparing: "on_its_way",
  on_its_way: null,
  completed: null,
  cancelled: null,
};
const NEXT_LABEL: Record<OrderDTO["status"], string> = {
  received: "Έναρξη ετοιμασίας",
  preparing: "Αποστολή",
  on_its_way: "",
  completed: "",
  cancelled: "",
};

async function fetchStaffOrders(): Promise<OrderDTO[] | null> {
  const res = await fetch("/api/staff/orders", { cache: "no-store" });
  if (!res.ok) return null;
  const json = (await res.json()) as { orders: OrderDTO[] };
  return json.orders;
}

const ALL_STATUSES: OrderDTO["status"][] = [
  "received",
  "preparing",
  "on_its_way",
  "completed",
  "cancelled",
];
// Default view: active orders only (staff's working queue).
const DEFAULT_FILTER: OrderDTO["status"][] = ["received", "preparing"];

function ActionButtons({
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
    <div style={{ display: "flex", gap: "0.5rem" }}>
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
          {NEXT_LABEL[order.status]}
        </button>
      )}
    </div>
  );
}

function DeliveryGuySelect({
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
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        fontSize: "0.85rem",
      }}
    >
      <label
        htmlFor={`dg-${order.id}`}
        style={{
          fontWeight: 600,
          color: "var(--text-muted)",
          whiteSpace: "nowrap",
        }}
      >
        Διανομέας
      </label>
      <select
        id={`dg-${order.id}`}
        value={order.deliveryGuy ?? ""}
        onChange={(e) => onAssign(order.id, e.target.value || null)}
        style={{
          flex: 1,
          padding: "0.3rem 0.5rem",
          border: "1px solid var(--color-cream-300)",
          borderRadius: "var(--radius-md)",
          background: "var(--color-cream-50)",
          fontFamily: "var(--font-body)",
          fontSize: "0.85rem",
        }}
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

export default function StaffDashboard({
  deliveryGuys,
}: {
  deliveryGuys: string[];
}) {
  const [orders, setOrders] = useState<OrderDTO[]>([]);
  const [statusFilter, setStatusFilter] =
    useState<OrderDTO["status"][]>(DEFAULT_FILTER);
  const [, startTransition] = useTransition();

  const toggleStatus = (s: OrderDTO["status"]) => {
    setStatusFilter((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const data = await fetchStaffOrders();
      if (!cancelled && data) setOrders(data);
    };
    load();
    const id = setInterval(load, 6000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const isTerminal = (s: OrderDTO["status"]) =>
    s === "completed" || s === "cancelled" || s === "on_its_way";
  const visible = orders.filter((o) => statusFilter.includes(o.status));

  const transition = (id: string, status: OrderDTO["status"]) => {
    startTransition(async () => {
      await updateStatusAction(id, status);
      const data = await fetchStaffOrders();
      if (data) setOrders(data);
    });
  };

  const handleAssign = (orderId: string, guy: string | null) => {
    startTransition(async () => {
      await assignDeliveryGuyAction(orderId, guy);
      const data = await fetchStaffOrders();
      if (data) setOrders(data);
    });
  };

  const countsByStatus = orders.reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="stack-md">
      <div className="staff-filter">
        <div className="staff-filter__label">Φίλτρο κατάστασης</div>
        <div className="staff-filter__chips">
          {ALL_STATUSES.map((s) => {
            const active = statusFilter.includes(s);
            const count = countsByStatus[s] ?? 0;
            return (
              <button
                key={s}
                type="button"
                className={`staff-filter__chip${
                  active ? " staff-filter__chip--active" : ""
                }`}
                onClick={() => toggleStatus(s)}
                aria-pressed={active}
              >
                {STATUS_LABEL[s]}
                <span className="staff-filter__count">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {visible.length === 0 && (
        <p className="empty">Δεν υπάρχουν παραγγελίες με αυτά τα φίλτρα.</p>
      )}

      {visible.map((o) => (
        <OrderCard
          key={o.id}
          order={o}
          actions={
            <ActionButtons
              order={o}
              isTerminal={isTerminal(o.status)}
              next={NEXT_STATUS[o.status]}
              onTransition={transition}
            />
          }
        >
          <DeliveryGuySelect
            order={o}
            deliveryGuys={deliveryGuys}
            onAssign={handleAssign}
          />
        </OrderCard>
      ))}
    </div>
  );
}
