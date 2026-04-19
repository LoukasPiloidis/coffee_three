"use client";

import { formatOptionLabel } from "@/lib/menu-types";

export type OrderDTO = {
  id: string;
  publicToken: string;
  type: "delivery" | "takeaway";
  status: "received" | "preparing" | "on_its_way" | "completed" | "cancelled";
  createdAt: string;
  totalCents: number;
  tipCents: number;
  paymentMethod: "cash" | "card";
  guestName: string | null;
  guestPhone: string | null;
  deliveryStreet: string | null;
  deliveryCity: string | null;
  deliveryPostcode: string | null;
  deliveryGuy: string | null;
  notes: string | null;
  offersJson: {
    offerSlug: string;
    offerTitle: { en: string; el: string };
    slots: {
      menuSlug: string;
      slotLabel: { en: string; el: string };
      discountCents: number;
    }[];
  }[];
  items: {
    title: { en: string; el: string };
    quantity: number;
    options: {
      groupName: { en: string; el: string };
      optionName: { en: string; el: string };
      priceCents?: number;
    }[];
    discountCents: number;
    comment: string | null;
  }[];
};

export const STATUS_LABEL: Record<OrderDTO["status"], string> = {
  received: "Ελήφθη",
  preparing: "Ετοιμάζεται",
  on_its_way: "Καθ' οδόν",
  completed: "Ολοκληρώθηκε",
  cancelled: "Ακυρώθηκε",
};

export const PAYMENT_LABEL: Record<OrderDTO["paymentMethod"], string> = {
  cash: "Μετρητά",
  card: "Κάρτα",
};

const TYPE_LABEL: Record<OrderDTO["type"], string> = {
  delivery: "Παράδοση",
  takeaway: "Take away",
};

export function formatEuro(cents: number) {
  return new Intl.NumberFormat("el-GR", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

export default function OrderCard({
  order: o,
  children,
  actions,
}: {
  order: OrderDTO;
  children?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="card stack-md">
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
          {o.type === "delivery" && o.deliveryStreet && (
            <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
              {o.deliveryStreet}, {o.deliveryCity} {o.deliveryPostcode}
            </div>
          )}
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
          <span className={`status-pill status-pill--${o.type}`}>
            {TYPE_LABEL[o.type]}
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
                {it.discountCents > 0 && (
                  <span className="offer-discount" style={{ marginLeft: "0.5rem", fontSize: "0.8rem" }}>
                    -{formatEuro(it.discountCents)}
                  </span>
                )}
              </div>
              {it.options.length > 0 && (
                <div className="cart-line__meta">
                  {it.options
                    .map((op) =>
                      formatOptionLabel(op.optionName.el, op.priceCents, "el")
                    )
                    .join(" · ")}
                </div>
              )}
              {it.comment && (
                <div className="cart-line__meta">&quot;{it.comment}&quot;</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {o.offersJson && o.offersJson.length > 0 && (
        <div style={{ fontSize: "0.85rem" }}>
          {o.offersJson.map((offer, i) => {
            const totalDiscount = offer.slots.reduce(
              (s, sl) => s + sl.discountCents,
              0
            );
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <span className="offer-badge">{offer.offerTitle.el}</span>
                <span className="offer-discount">-{formatEuro(totalDiscount)}</span>
              </div>
            );
          })}
        </div>
      )}

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

      {children}

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
        {actions}
      </div>
    </div>
  );
}
