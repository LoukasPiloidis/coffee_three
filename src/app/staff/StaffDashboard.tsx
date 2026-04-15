"use client";

import { useEffect, useState, useTransition } from "react";
import { formatOptionLabel } from "@/lib/menu-types";
import { assignDeliveryGuyAction, updateStatusAction } from "./actions";

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
  deliveryGuy: string | null;
  notes: string | null;
  items: {
    title: { en: string; el: string };
    quantity: number;
    options: {
      groupName: { en: string; el: string };
      optionName: { en: string; el: string };
      priceCents?: number;
    }[];
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
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.8rem",
                    color: "var(--text-muted)",
                  }}
                >
                  #{o.publicToken.slice(0, 6)} ·{" "}
                  {new Date(o.createdAt).toLocaleTimeString("el-GR")}
                </div>
                <div style={{ fontWeight: 600, marginTop: "0.2rem" }}>
                  {o.guestName ?? "—"} · {o.guestPhone ?? "χωρίς τηλέφωνο"}
                </div>
                <div
                  style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}
                >
                  {o.deliveryStreet}, {o.deliveryCity} {o.deliveryPostcode}
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  gap: "0.3rem",
                }}
              >
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
                        {it.options
                          .map((op) =>
                            formatOptionLabel(
                              op.optionName.el,
                              op.priceCents,
                              "el"
                            )
                          )
                          .join(" · ")}
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
                <strong
                  style={{
                    display: "block",
                    fontSize: "0.7rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    color: "var(--text-muted)",
                    marginBottom: "0.2rem",
                  }}
                >
                  Σημειώσεις
                </strong>
                {o.notes}
              </div>
            )}

            {deliveryGuys.length > 0 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  fontSize: "0.85rem",
                }}
              >
                <label
                  htmlFor={`dg-${o.id}`}
                  style={{
                    fontWeight: 600,
                    color: "var(--text-muted)",
                    whiteSpace: "nowrap",
                  }}
                >
                  Διανομέας
                </label>
                <select
                  id={`dg-${o.id}`}
                  value={o.deliveryGuy ?? ""}
                  onChange={(e) => {
                    const val = e.target.value || null;
                    startTransition(async () => {
                      await assignDeliveryGuyAction(o.id, val);
                      const data = await fetchStaffOrders();
                      if (data) setOrders(data);
                    });
                  }}
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
