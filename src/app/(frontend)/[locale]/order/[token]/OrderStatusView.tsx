"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import PriceWithDiscount from "@/components/PriceWithDiscount";
import { formatOptionLabel, formatPrice, type Locale } from "@/lib/menu-types";

type OrderDTO = {
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

// Customer-facing flow has 4 steps.
const STEPS: OrderDTO["status"][] = [
  "received",
  "preparing",
  "on_its_way",
  "completed",
];

const DISPLAY_KEY: Record<OrderDTO["status"], string> = {
  received: "received",
  preparing: "preparing",
  on_its_way: "on_its_way",
  completed: "completed",
  cancelled: "cancelled",
};

function statusToStep(s: OrderDTO["status"]): OrderDTO["status"] {
  return s;
}

export default function OrderStatusView({
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

  const activeIdx = STEPS.indexOf(statusToStep(data.status));
  const isCancelled = data.status === "cancelled";

  return (
    <main className="page">
      <div className="container stack-lg">
        <h1 className="page__title">{t("status")}</h1>

        {isCancelled && (
          <div style={{ textAlign: "center" }}>
            <span className={`status-pill status-pill--${data.status}`}>
              {t(data.status)}
            </span>
          </div>
        )}

        {!isCancelled &&
          (() => {
            const visible: { step: OrderDTO["status"]; active: boolean }[] = [
              { step: STEPS[activeIdx], active: true },
            ];
            const next = STEPS[activeIdx + 1];
            if (next) visible.push({ step: next, active: false });
            return (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(${visible.length}, 1fr)`,
                  gap: "0.5rem",
                }}
              >
                {visible.map(({ step, active }) => (
                  <div
                    key={step}
                    style={{
                      padding: "0.5rem",
                      borderRadius: "var(--radius-md)",
                      background: active
                        ? "var(--color-green-800)"
                        : "var(--color-cream-100)",
                      color: active
                        ? "var(--color-cream-50)"
                        : "var(--color-muted)",
                      textAlign: "center",
                      fontSize: "0.75rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      fontWeight: 600,
                    }}
                  >
                    {t(DISPLAY_KEY[step])}
                  </div>
                ))}
              </div>
            );
          })()}

        <div className="card">
          {data.items.map((it, i) => (
            <div key={i} className="cart-line">
              <div className="cart-line__main">
                <div className="cart-line__title">
                  {it.quantity}× {it.title[locale]}
                </div>
                {it.options.length > 0 && (
                  <div className="cart-line__meta">
                    {it.options
                      .map((o) =>
                        formatOptionLabel(
                          o.optionName[locale],
                          o.priceCents,
                          locale
                        )
                      )
                      .join(" · ")}
                  </div>
                )}
                {it.comment && (
                  <div className="cart-line__meta">“{it.comment}”</div>
                )}
              </div>
              <div className="cart-line__right">
                <div className="item-row__price">
                  <PriceWithDiscount
                    originalCents={it.unitPriceCents * it.quantity}
                    discountCents={it.discountCents}
                    locale={locale}
                  />
                </div>
              </div>
            </div>
          ))}
          <div className="totals">
            <span>Total</span>
            <strong>{formatPrice(data.totalCents / 100, locale)}</strong>
          </div>
          {data.tipCents > 0 && (
            <div
              style={{
                fontSize: "0.8rem",
                color: "var(--text-muted)",
                marginTop: "-0.5rem",
                textAlign: "right",
              }}
            >
              {t("tipIncluded", {
                amount: formatPrice(data.tipCents / 100, locale),
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
