"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { formatPrice, type Locale } from "@/lib/menu-types";
import { OrderItemsCard } from "./OrderItemsCard";
import { StatusSteps } from "./StatusSteps";

type OrderDTO = {
  type: "delivery" | "takeaway";
  status: "received" | "preparing" | "on_its_way" | "completed" | "cancelled";
  totalCents: number;
  tipCents: number;
  paymentMethod: "cash" | "card";
  items: {
    title: { en: string; el: string };
    quantity: number;
    unitPriceCents: number;
    discountCents: number;
    options: {
      groupName: { en: string; el: string };
      optionName: { en: string; el: string };
      priceCents?: number;
    }[];
    comment: string | null;
  }[];
};

export function OrderStatusView({
  locale,
  token,
}: {
  locale: Locale;
  token: string;
}) {
  const t = useTranslations("order");
  const [data, setData] = useState<OrderDTO | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchOnce = async () => {
      try {
        const res = await fetch(`/api/orders/${token}`, { cache: "no-store" });
        if (res.status === 404) {
          if (active) setNotFound(true);
          return;
        }
        const json = (await res.json()) as OrderDTO;
        if (active) setData(json);
      } catch {
        /* ignore transient */
      }
    };
    fetchOnce();
    const id = setInterval(fetchOnce, 7000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [token]);

  if (notFound) {
    return (
      <main className="page">
        <div className="container">
          <p className="empty">Order not found.</p>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="page">
        <div className="container">
          <p className="empty">…</p>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="container stack-lg">
        <h1 className="page__title">{t("status")}</h1>

        <StatusSteps type={data.type} status={data.status} t={t} />

        <OrderItemsCard
          items={data.items}
          totalCents={data.totalCents}
          tipCents={data.tipCents}
          locale={locale}
          tipLabel={t("tipIncluded", {
            amount: formatPrice(data.tipCents / 100, locale),
          })}
        />
      </div>
    </main>
  );
}
