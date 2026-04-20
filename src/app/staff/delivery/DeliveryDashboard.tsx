"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import OrderCard, { formatEuro, type OrderDTO } from "../OrderCard";
import styles from "./Delivery.module.css";

function todayStr() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

async function fetchDeliveryOrders(
  deliveryGuy: string,
  date: string
): Promise<OrderDTO[] | null> {
  const params = new URLSearchParams({ deliveryGuy, date });
  const res = await fetch(`/api/staff/delivery-orders?${params}`, {
    cache: "no-store",
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { orders: OrderDTO[] };
  return json.orders;
}

export default function DeliveryDashboard({
  deliveryGuys,
}: {
  deliveryGuys: string[];
}) {
  const [selectedGuy, setSelectedGuy] = useState(deliveryGuys[0] ?? "");
  const [date, setDate] = useState(todayStr);
  const [orders, setOrders] = useState<OrderDTO[]>([]);
  const [isPending, startTransition] = useTransition();

  const load = useCallback(() => {
    if (!selectedGuy) return;
    startTransition(async () => {
      const data = await fetchDeliveryOrders(selectedGuy, date);
      if (data) setOrders(data);
    });
  }, [selectedGuy, date]);

  useEffect(() => {
    load();
  }, [load]);

  // Exclude cancelled orders from totals
  const activeOrders = orders.filter((o) => o.status !== "cancelled");
  const totalCash = activeOrders
    .filter((o) => o.paymentMethod === "cash")
    .reduce((sum, o) => sum + o.totalCents, 0);
  const totalCard = activeOrders
    .filter((o) => o.paymentMethod === "card")
    .reduce((sum, o) => sum + o.totalCents, 0);
  const totalTips = activeOrders.reduce((sum, o) => sum + o.tipCents, 0);

  return (
    <div className="stack-md">
      <div className={styles.controls}>
        <select
          value={selectedGuy}
          onChange={(e) => setSelectedGuy(e.target.value)}
          className={styles['select-input']}
        >
          {deliveryGuys.length === 0 && (
            <option value="">Κανένας διανομέας</option>
          )}
          {deliveryGuys.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className={styles['select-input']}
        />
      </div>

      {selectedGuy && (
        <div className={`card ${styles.summary}`}>
          <div>
            <div className={styles['summary__label']}>Μετρητά</div>
            <div className={`${styles['summary__value']} ${styles['summary__value--green']}`}>
              {formatEuro(totalCash)}
            </div>
          </div>
          <div>
            <div className={styles['summary__label']}>Κάρτα</div>
            <div className={`${styles['summary__value']} ${styles['summary__value--dark']}`}>
              {formatEuro(totalCard)}
            </div>
          </div>
          <div>
            <div className={styles['summary__label']}>Φιλοδωρήματα</div>
            <div className={`${styles['summary__value']} ${styles['summary__value--green']}`}>
              {formatEuro(totalTips)}
            </div>
          </div>
        </div>
      )}

      {isPending && <p className="empty">Φόρτωση…</p>}

      {!isPending && selectedGuy && orders.length === 0 && (
        <p className="empty">Δεν βρέθηκαν παραγγελίες.</p>
      )}

      {!isPending && orders.map((o) => <OrderCard key={o.id} order={o} />)}
    </div>
  );
}
