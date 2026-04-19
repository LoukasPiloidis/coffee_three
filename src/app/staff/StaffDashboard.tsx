"use client";

import { useEffect, useState, useTransition } from "react";
import { assignDeliveryGuyAction, updateStatusAction } from "./actions";
import OrderCard, {
  type OrderDTO,
  STATUS_LABEL,
} from "./OrderCard";

// Staff flow: received -> preparing -> on_its_way (delivery) or completed (takeaway).
// After on_its_way, orders auto-complete one hour after they were placed (server-side).
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

function getNextStatus(order: OrderDTO): OrderDTO["status"] | null {
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

async function fetchStaffOrders(): Promise<OrderDTO[] | null> {
  const res = await fetch("/api/staff/orders", { cache: "no-store" });
  if (!res.ok) return null;
  const json = (await res.json()) as { orders: OrderDTO[] };
  return json.orders;
}

type Tab = "active" | "completed";

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
          {getNextLabel(order)}
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

function OrderColumn({
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
      <div className="staff-column__header">
        {label}
        <span className="staff-column__count">{orders.length}</span>
      </div>
      {orders.length === 0 && (
        <p className="empty" style={{ fontSize: "0.85rem" }}>
          Κενό
        </p>
      )}
      <div className="stack-md">
        {orders.map((o) => (
          <OrderCard
            key={o.id}
            order={o}
            className={o.status === "cancelled" ? "staff-card--cancelled" : undefined}
            actions={
              <ActionButtons
                order={o}
                isTerminal={isTerminal(o.status)}
                next={getNextStatus(o)}
                onTransition={onTransition}
              />
            }
          >
            {o.type === "delivery" && (
              <DeliveryGuySelect
                order={o}
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

export default function StaffDashboard({
  deliveryGuys,
}: {
  deliveryGuys: string[];
}) {
  const [orders, setOrders] = useState<OrderDTO[]>([]);
  const [tab, setTab] = useState<Tab>("active");
  const [, startTransition] = useTransition();

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

  const received = orders.filter((o) => o.status === "received");
  const preparing = orders.filter((o) => o.status === "preparing");
  const onItsWay = orders.filter((o) => o.status === "on_its_way");
  const done = orders.filter(
    (o) => o.status === "completed" || o.status === "cancelled"
  );

  const activeCount = received.length + preparing.length;
  const completedCount = onItsWay.length + done.length;

  return (
    <div>
      <div className="staff-tabs">
        <button
          type="button"
          className={`staff-tabs__tab${tab === "active" ? " staff-tabs__tab--active" : ""}`}
          onClick={() => setTab("active")}
        >
          Ενεργές
          <span className="staff-tabs__count">{activeCount}</span>
        </button>
        <button
          type="button"
          className={`staff-tabs__tab${tab === "completed" ? " staff-tabs__tab--active" : ""}`}
          onClick={() => setTab("completed")}
        >
          Ολοκληρωμένες
          <span className="staff-tabs__count">{completedCount}</span>
        </button>
      </div>

      {tab === "active" && (
        <div className="staff-columns">
          <OrderColumn
            label={STATUS_LABEL.received}
            orders={received}
            deliveryGuys={deliveryGuys}
            onTransition={transition}
            onAssign={handleAssign}
          />
          <OrderColumn
            label={STATUS_LABEL.preparing}
            orders={preparing}
            deliveryGuys={deliveryGuys}
            onTransition={transition}
            onAssign={handleAssign}
          />
        </div>
      )}

      {tab === "completed" && (
        <div className="staff-columns">
          <OrderColumn
            label={STATUS_LABEL.on_its_way}
            orders={onItsWay}
            deliveryGuys={deliveryGuys}
            onTransition={transition}
            onAssign={handleAssign}
          />
          <OrderColumn
            label="Ολοκληρωμένες / Ακυρωμένες"
            orders={done}
            deliveryGuys={deliveryGuys}
            onTransition={transition}
            onAssign={handleAssign}
          />
        </div>
      )}
    </div>
  );
}
