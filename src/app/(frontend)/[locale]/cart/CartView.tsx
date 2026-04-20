"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import PriceWithDiscount from "@/components/PriceWithDiscount";
import { Link } from "@/i18n/navigation";
import {
  cartStore,
  cartTotalCents,
  lineDiscountCents,
  lineTotalCents,
  offerForLine,
  totalOfferDiscountCents,
  useCart,
} from "@/lib/cart";
import type { Offer } from "@/lib/menu-types";
import { formatOptionLabel, formatPrice, type Locale } from "@/lib/menu-types";
import { detectApplicableOffers } from "@/lib/offer-matching";
import lineStyles from "@/components/OrderLine.module.css";
import styles from "./CartView.module.css";

export default function CartView({
  locale,
  offers,
}: {
  locale: Locale;
  offers: Offer[];
}) {
  const t = useTranslations("cart");
  const tOffers = useTranslations("offers");
  const cart = useCart();
  const savingsCents = totalOfferDiscountCents(cart);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  // Auto-detect applicable offers
  const suggestions = detectApplicableOffers(cart, offers).filter(
    (s) => !dismissed.has(s.offer.slug)
  );

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

  const handleApply = (suggestion: (typeof suggestions)[0]) => {
    cartStore.applyOffer({
      offerSlug: suggestion.offer.slug,
      offerTitle: suggestion.offer.title,
      slotAssignments: suggestion.suggestedAssignments,
    });
  };

  return (
    <main className="page">
      <div className="container">
        <h1 className="page__title">{t("title")}</h1>

        {/* Offer suggestions */}
        {suggestions.map((suggestion) => (
          <div key={suggestion.offer.slug} className={styles['offer-suggestion']}>
            <div className={styles['offer-suggestion__text']}>
              {tOffers("suggestion", {
                amount: formatPrice(suggestion.totalSavingsCents / 100, locale),
                offerName: suggestion.offer.title[locale],
              })}
            </div>
            <div className={styles['offer-suggestion__actions']}>
              <button
                type="button"
                className="btn btn--primary btn--small"
                onClick={() => handleApply(suggestion)}
              >
                {tOffers("apply")}
              </button>
              <button
                type="button"
                className="btn btn--ghost btn--small"
                onClick={() =>
                  setDismissed((prev) =>
                    new Set(prev).add(suggestion.offer.slug)
                  )
                }
              >
                {tOffers("dismiss")}
              </button>
            </div>
          </div>
        ))}

        <div className="card stack-md">
          <div>
            {cart.lines.map((line) => {
              const offer = offerForLine(line.lineId, cart);
              const discount = lineDiscountCents(line.lineId, cart);
              const lineTotal = lineTotalCents(line);
              return (
                <div key={line.lineId} className={lineStyles['cart-line']}>
                  <div className={lineStyles['cart-line__main']}>
                    <div className={lineStyles['cart-line__title']}>
                      {line.title[locale]}
                      {offer && (
                        <span className={lineStyles['offer-badge']}>
                          {tOffers("offer")}
                        </span>
                      )}
                    </div>
                    {line.options.length > 0 && (
                      <div className={lineStyles['cart-line__meta']}>
                        {line.options
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
                    {line.comment && (
                      <div className={lineStyles['cart-line__meta']}>
                        &quot;{line.comment}&quot;
                      </div>
                    )}
                  </div>
                  <div className={lineStyles['cart-line__right']}>
                    <div className={lineStyles['item-row__price']}>
                      <PriceWithDiscount
                        originalCents={lineTotal}
                        discountCents={discount}
                        locale={locale}
                      />
                    </div>
                    <div className={styles.qty}>
                      <button
                        type="button"
                        onClick={() =>
                          cartStore.updateQty(line.lineId, line.quantity - 1)
                        }
                        aria-label="decrease"
                      >
                        −
                      </button>
                      <span className={styles['qty__value']}>{line.quantity}</span>
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
              );
            })}
          </div>

          <div className="totals">
            <span>{t("total")}</span>
            <strong>
              <PriceWithDiscount
                originalCents={cartTotalCents(cart)}
                discountCents={savingsCents}
                locale={locale}
              />
            </strong>
          </div>

          <Link href="/checkout" className="btn btn--primary btn--block">
            {t("proceed")}
          </Link>
        </div>
      </div>
    </main>
  );
}
