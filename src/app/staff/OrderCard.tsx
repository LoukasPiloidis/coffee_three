"use client";

import styles from "./OrderCard.module.css";
import { OrderFooter } from "./OrderFooter";
import { OrderHeader } from "./OrderHeader";
import { OrderItems } from "./OrderItems";

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

export function formatEuro(cents: number) {
  return new Intl.NumberFormat("el-GR", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

export default function OrderCard({
  order,
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
      <OrderHeader order={order} />
      <OrderItems order={order} />

      {order.notes && (
        <div className={styles['order-card__notes']}>
          <strong className={styles['order-card__notes-label']}>
            Σημειώσεις
          </strong>
          {order.notes}
        </div>
      )}

      {children}

      <OrderFooter order={order} actions={actions} />
    </div>
  );
}
