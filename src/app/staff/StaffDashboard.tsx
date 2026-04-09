"use client";

import { useEffect, useState, useTransition } from "react";
import { updateStatusAction } from "./actions";

type OrderDTO = {
  id: string;
  publicToken: string;
  status: "received" | "preparing" | "on_its_way" | "completed" | "cancelled";
  createdAt: string;
  totalCents: number;
  tipCents: number;
  paymentMethod: "cash" | "card";
  guestName: string | null;
  guestPhone: string | null;
  deliveryStreet: string;
  deliveryCity: string;
  deliveryPostcode: string;
  notes: string | null;
  items: {
    title: { en: string; el: string };
    quantity: number;
    options: { groupName: { en: string; el: string }; optionName: { en: string; el: string } }[];
    comment: string | null;
  }[];
};

// Staff flow: received → preparing → on_its_way. After on_its_way, orders
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

const STATUS_LABEL: Record<OrderDTO["status"], string> = {
  received: "Ελήφθη",
  preparing: "Ετοιμάζεται",
  on_its_way: "Καθ' οδόν",
  completed: "Ολοκληρώθηκε",
  cancelled: "Ακυρώθηκε",
};

const PAYMENT_LABEL: Record<OrderDTO["paymentMethod"], string> = {
  cash: "Μετρητά",
  card: "Κάρτα",
};

function formatEuro(cents: number) {
  return new Intl.NumberFormat("el-GR", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

export default function StaffDashboard() {
  const [orders, setOrders] = useState<OrderDTO[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [, startTransition] = useTransition();

  const fetchOrders = async () => {
    const res = await fetch("/api/staff/orders", { cache: "no-store" });
    if (!res.ok) return;
    const json = (await res.json()) as { orders: OrderDTO[] };
    setOrders(json.orders);
  };

  useEffect(() => {
    fetchOrders();
    const id = setInterval(fetchOrders, 6000);
    return () => clearInterval(id);
  }, []);

  const isTerminal = (s: OrderDTO["status"]) =>
    s === "completed" || s === "cancelled" || s === "on_its_way";
  const active = orders.filter((o) => !isTerminal(o.status));
  const past = orders.filter((o) => isTerminal(o.status));
  const visible = showHistory ? [...active, ...past] : active;

  const transition = (id: string, status: OrderDTO["status"]) => {
    startTransition(async () => {
      await updateStatusAction(id, status);
      fetchOrders();
    });
  };

  return (
    <div className="stack-md">
      <label style={{ fontSize: "0.85rem" }}>
        <input
          type="checkbox"
          checked={showHistory}
          onChange={(e) => setShowHistory(e.target.checked)}
        />{" "}
        Εμφάνιση ολοκληρωμένων/ακυρωμένων
      </label>

      {visible.length === 0 && (
        <p className="empty">Δεν υπάρχουν ενεργές παραγγελίες.</p>
      )}

      {visible.map((o) => {
        const next = NEXT_STATUS[o.status];
        return (
          <div key={o.id} className="card stack-md">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "0.5rem",
                flexWrap: "wrap",
              }}
            >
              <div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  #{o.publicToken.slice(0, 6)} ·{" "}
                  {new Date(o.createdAt).toLocaleTimeString("el-GR")}
                </div>
                <div style={{ fontWeight: 600, marginTop: "0.2rem" }}>
                  {o.guestName ?? "—"} · {o.guestPhone ?? "χωρίς τηλέφωνο"}
                </div>
                <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                  {o.deliveryStreet}, {o.deliveryCity} {o.deliveryPostcode}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.3rem" }}>
                <span className={`status-pill status-pill--${o.status}`}>
                  {STATUS_LABEL[o.status]}
                </span>
                <span
                  className={`status-pill status-pill--${o.paymentMethod}`}
                  style={{
                    background:
                      o.paymentMethod === "cash"
                        ? "var(--color-green-700)"
                        : "var(--color-green-900)",
                    color: "var(--color-cream-50)",
                  }}
                >
                  {PAYMENT_LABEL[o.paymentMethod]}
                </span>
              </div>
            </div>

            <div>
              {o.items.map((it, i) => (
                <div key={i} className="cart-line">
                  <div className="cart-line__main">
                    <div className="cart-line__title">
                      {it.quantity}× {it.title.el}
                    </div>
                    {it.options.length > 0 && (
                      <div className="cart-line__meta">
                        {it.options.map((op) => op.optionName.el).join(" · ")}
                      </div>
                    )}
                    {it.comment && (
                      <div className="cart-line__meta">“{it.comment}”</div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {o.notes && (
              <div
                style={{
                  fontSize: "0.85rem",
                  padding: "0.5rem 0.75rem",
                  background: "var(--color-cream-100)",
                  borderRadius: "var(--radius-md)",
                  whiteSpace: "pre-wrap",
                }}
              >
                <strong style={{ display: "block", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", marginBottom: "0.2rem" }}>
                  Σημειώσεις
                </strong>
                {o.notes}
              </div>
            )}

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <strong style={{ fontFamily: "var(--font-mono)" }}>
                {formatEuro(o.totalCents)} · {PAYMENT_LABEL[o.paymentMethod]}
                {o.tipCents > 0 && (
                  <span
                    style={{
                      display: "block",
                      fontSize: "0.7rem",
                      fontWeight: 500,
                      color: "var(--color-green-700)",
                    }}
                  >
                    + {formatEuro(o.tipCents)} φιλοδώρημα
                  </span>
                )}
              </strong>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                {!isTerminal(o.status) && (
                  <button
                    className="btn btn--danger btn--small"
                    onClick={() => transition(o.id, "cancelled")}
                  >
                    Ακύρωση
                  </button>
                )}
                {next && (
                  <button
                    className="btn btn--primary btn--small"
                    onClick={() => transition(o.id, next)}
                  >
                    {NEXT_LABEL[o.status]}
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
