"use client";

import { useEffect, useState, useTransition } from "react";
import { assignDeliveryGuyAction, updateStatusAction } from "./actions";
import { type OrderDTO, STATUS_LABEL } from "./OrderCard";
import { OrderColumn } from "./OrderColumn";
import styles from "./Staff.module.css";

async function fetchStaffOrders(): Promise<OrderDTO[] | null> {
  const res = await fetch("/api/staff/orders", { cache: "no-store" });
  if (!res.ok) return null;
  const json = (await res.json()) as { orders: OrderDTO[] };
  return json.orders;
}

type Tab = "active" | "completed";

export function StaffDashboard({
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

  const received = orders.filter((order) => order.status === "received");
  const preparing = orders.filter((order) => order.status === "preparing");
  const onItsWay = orders.filter((order) => order.status === "on_its_way");
  const done = orders.filter(
    (order) => order.status === "completed" || order.status === "cancelled"
  );

  const activeCount = received.length + preparing.length;
  const completedCount = onItsWay.length + done.length;

  return (
    <div>
      <div className={styles['staff-tabs']}>
        <button
          type="button"
          className={`${styles['staff-tabs__tab']}${tab === "active" ? ` ${styles['staff-tabs__tab--active']}` : ""}`}
          onClick={() => setTab("active")}
        >
          Ενεργές
          <span className={styles['staff-tabs__count']}>{activeCount}</span>
        </button>
        <button
          type="button"
          className={`${styles['staff-tabs__tab']}${tab === "completed" ? ` ${styles['staff-tabs__tab--active']}` : ""}`}
          onClick={() => setTab("completed")}
        >
          Ολοκληρωμένες
          <span className={styles['staff-tabs__count']}>{completedCount}</span>
        </button>
      </div>

      {tab === "active" && (
        <div className={styles['staff-columns']}>
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
        <div className={styles['staff-columns']}>
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
