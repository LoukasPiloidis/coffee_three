"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { OrderCard, formatEuro, type OrderDTO } from "../OrderCard";
import styles from "./Delivery.module.css";
import { SummaryCard } from "./SummaryCard";

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

export function DeliveryDashboard({
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
  const activeOrders = orders.filter((order) => order.status !== "cancelled");
  const totalCash = activeOrders
    .filter((order) => order.paymentMethod === "cash")
    .reduce((sum, order) => sum + order.totalCents, 0);
  const totalCard = activeOrders
    .filter((order) => order.paymentMethod === "card")
    .reduce((sum, order) => sum + order.totalCents, 0);
  const totalTips = activeOrders.reduce((sum, order) => sum + order.tipCents, 0);

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
        <SummaryCard
          stats={[
            { label: "Μετρητά", value: formatEuro(totalCash), variant: "green" },
            { label: "Κάρτα", value: formatEuro(totalCard), variant: "dark" },
            { label: "Φιλοδωρήματα", value: formatEuro(totalTips), variant: "green" },
          ]}
        />
      )}

      {isPending && <p className="empty">Φόρτωση…</p>}

      {!isPending && selectedGuy && orders.length === 0 && (
        <p className="empty">Δεν βρέθηκαν παραγγελίες.</p>
      )}

      {!isPending && orders.map((order) => <OrderCard key={order.id} order={order} />)}
    </div>
  );
}
