"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cartStore, cartTotalCents, lineTotalCents, useCart } from "@/lib/cart";
import { formatPrice, type Locale } from "@/lib/menu-types";

export default function CartView({ locale }: { locale: Locale }) {
  const t = useTranslations("cart");
  const cart = useCart();
  const totalCents = cartTotalCents(cart);

  if (cart.lines.length === 0) {
    return (
      <main className="page">
        <div className="container">
          <h1 className="page__title">{t("title")}</h1>
          <p className="empty">{t("empty")}</p>
          <div style={{ textAlign: "center" }}>
            <Link href="/" className="btn btn--ghost">
              ← {t("title")}
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="container">
        <h1 className="page__title">{t("title")}</h1>

        <div className="card stack-md">
          <div>
            {cart.lines.map((line) => (
              <div key={line.lineId} className="cart-line">
                <div className="cart-line__main">
                  <div className="cart-line__title">{line.title[locale]}</div>
                  {line.options.length > 0 && (
                    <div className="cart-line__meta">
                      {line.options
                        .map((o) => `${o.optionName[locale]}`)
                        .join(" · ")}
                    </div>
                  )}
                  {line.comment && (
                    <div className="cart-line__meta">“{line.comment}”</div>
                  )}
                </div>
                <div className="cart-line__right">
                  <div className="item-row__price">
                    {formatPrice(lineTotalCents(line) / 100, locale)}
                  </div>
                  <div className="qty">
                    <button
                      type="button"
                      onClick={() =>
                        cartStore.updateQty(line.lineId, line.quantity - 1)
                      }
                      aria-label="decrease"
                    >
                      −
                    </button>
                    <span className="qty__value">{line.quantity}</span>
                    <button
                      type="button"
                      onClick={() =>
                        cartStore.updateQty(line.lineId, line.quantity + 1)
                      }
                      aria-label="increase"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="totals">
            <span>{t("total")}</span>
            <strong>{formatPrice(totalCents / 100, locale)}</strong>
          </div>

          <Link href="/checkout" className="btn btn--primary btn--block">
            {t("proceed")}
          </Link>
        </div>
      </div>
    </main>
  );
}
