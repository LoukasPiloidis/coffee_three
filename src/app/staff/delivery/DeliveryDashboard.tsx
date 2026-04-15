"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import OrderCard, { formatEuro, type OrderDTO } from "../OrderCard";

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

  const selectStyle: React.CSSProperties = {
    padding: "0.4rem 0.6rem",
    border: "1px solid var(--color-cream-300)",
    borderRadius: "var(--radius-md)",
    background: "var(--color-cream-50)",
    fontFamily: "var(--font-body)",
    fontSize: "0.9rem",
    flex: 1,
  };

  return (
    <div className="stack-md">
      <div
        style={{
          display: "flex",
          gap: "0.75rem",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <select
          value={selectedGuy}
          onChange={(e) => setSelectedGuy(e.target.value)}
          style={selectStyle}
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
          style={selectStyle}
        />
      </div>

      {selectedGuy && (
        <div
          className="card"
          style={{
            display: "flex",
            gap: "1rem",
            justifyContent: "space-around",
            textAlign: "center",
            padding: "1rem",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "0.7rem",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "var(--text-muted)",
                marginBottom: "0.25rem",
              }}
            >
              Μετρητά
            </div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontWeight: 700,
                fontSize: "1.1rem",
                color: "var(--color-green-700)",
              }}
            >
              {formatEuro(totalCash)}
            </div>
          </div>
          <div>
            <div
              style={{
                fontSize: "0.7rem",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "var(--text-muted)",
                marginBottom: "0.25rem",
              }}
            >
              Κάρτα
            </div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontWeight: 700,
                fontSize: "1.1rem",
                color: "var(--color-green-900)",
              }}
            >
              {formatEuro(totalCard)}
            </div>
          </div>
          <div>
            <div
              style={{
                fontSize: "0.7rem",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "var(--text-muted)",
                marginBottom: "0.25rem",
              }}
            >
              Φιλοδωρήματα
            </div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontWeight: 700,
                fontSize: "1.1rem",
                color: "var(--color-green-700)",
              }}
            >
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
