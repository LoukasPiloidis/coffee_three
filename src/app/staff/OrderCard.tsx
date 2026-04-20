"use client";

import { formatOptionLabel } from "@/lib/menu-types";
import lineStyles from "@/components/OrderLine.module.css";
import pillStyles from "@/components/StatusPill.module.css";
import styles from "./OrderCard.module.css";

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
  className,
}: {
  order: OrderDTO;
  children?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`card stack-md${className ? ` ${className}` : ""}`}>
      <div className={styles['order-card__header']}>
        <div>
          <div className={styles['order-card__token']}>
            #{o.publicToken.slice(0, 6)} ·{" "}
            {new Date(o.createdAt).toLocaleTimeString("el-GR")}
          </div>
          <div className={styles['order-card__customer']}>
            {o.guestName ?? "—"} · {o.guestPhone ?? "χωρίς τηλέφωνο"}
          </div>
          {o.type === "delivery" && o.deliveryStreet && (
            <div className={styles['order-card__address']}>
              {o.deliveryStreet}, {o.deliveryCity} {o.deliveryPostcode}
            </div>
          )}
        </div>
        <div className={styles['order-card__badges']}>
          <span className={`${pillStyles['status-pill']} ${pillStyles[`status-pill--${o.type}`]}`}>
            {TYPE_LABEL[o.type]}
          </span>
          <span className={`${pillStyles['status-pill']} ${styles[`payment-pill--${o.paymentMethod}`]}`}>
            {PAYMENT_LABEL[o.paymentMethod]}
          </span>
        </div>
      </div>

      <div>
        {o.items.map((it, i) => (
          <div key={i} className={lineStyles['cart-line']}>
            <div className={lineStyles['cart-line__main']}>
              <div className={lineStyles['cart-line__title']}>
                {it.quantity}× {it.title.el}
                {it.discountCents > 0 && (
                  <span
                    className={`${lineStyles['offer-discount']} ${styles['order-card__discount-inline']}`}
                  >
                    -{formatEuro(it.discountCents)}
                  </span>
                )}
              </div>
              {it.options.length > 0 && (
                <div className={lineStyles['cart-line__meta']}>
                  {it.options
                    .map((op) =>
                      formatOptionLabel(op.optionName.el, op.priceCents, "el")
                    )
                    .join(" · ")}
                </div>
              )}
              {it.comment && (
                <div className={lineStyles['cart-line__meta']}>&quot;{it.comment}&quot;</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {o.offersJson && o.offersJson.length > 0 && (
        <div className={styles['order-card__offers']}>
          {o.offersJson.map((offer, i) => {
            const totalDiscount = offer.slots.reduce(
              (s, sl) => s + sl.discountCents,
              0
            );
            return (
              <div
                key={i}
                className={styles['order-card__offer-row']}
              >
                <span className={lineStyles['offer-badge']}>προσφορά</span>
                <span className={lineStyles['offer-discount']}>
                  -{formatEuro(totalDiscount)}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {o.notes && (
        <div className={styles['order-card__notes']}>
          <strong className={styles['order-card__notes-label']}>
            Σημειώσεις
          </strong>
          {o.notes}
        </div>
      )}

      {children}

      <div className={styles['order-card__footer']}>
        <strong className={styles['order-card__total']}>
          {formatEuro(o.totalCents)} · {PAYMENT_LABEL[o.paymentMethod]}
          {o.tipCents > 0 && (
            <span className={styles['order-card__tip']}>
              + {formatEuro(o.tipCents)} φιλοδώρημα
            </span>
          )}
        </strong>
        {actions}
      </div>
    </div>
  );
}
