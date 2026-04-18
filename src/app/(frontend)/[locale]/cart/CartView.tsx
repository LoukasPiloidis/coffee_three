"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Link } from "@/i18n/navigation";
import {
  cartStore,
  cartTotalCents,
  cartTotalCentsWithOffers,
  lineDiscountCents,
  lineTotalCents,
  offerForLine,
  totalOfferDiscountCents,
  useCart,
} from "@/lib/cart";
import type { Offer } from "@/lib/menu-types";
import { formatOptionLabel, formatPrice, type Locale } from "@/lib/menu-types";
import { detectApplicableOffers } from "@/lib/offer-matching";

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
  const totalCents = cartTotalCentsWithOffers(cart);
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
          <div key={suggestion.offer.slug} className="offer-suggestion">
            <div className="offer-suggestion__text">
              {tOffers("suggestion", {
                amount: formatPrice(suggestion.totalSavingsCents / 100, locale),
                offerName: suggestion.offer.title[locale],
              })}
            </div>
            <div className="offer-suggestion__actions">
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
                <div key={line.lineId} className="cart-line">
                  <div className="cart-line__main">
                    <div className="cart-line__title">
                      {line.title[locale]}
                      {offer && (
                        <span className="offer-badge">
                          {offer.offerTitle[locale]}
                        </span>
                      )}
                    </div>
                    {line.options.length > 0 && (
                      <div className="cart-line__meta">
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
                      <div className="cart-line__meta">
                        &quot;{line.comment}&quot;
                      </div>
                    )}
                  </div>
                  <div className="cart-line__right">
                    <div className="item-row__price">
                      {discount > 0 ? (
                        <>
                          <span className="offer-item-pick__original">
                            {formatPrice(lineTotal / 100, locale)}
                          </span>{" "}
                          {formatPrice((lineTotal - discount) / 100, locale)}
                        </>
                      ) : (
                        formatPrice(lineTotal / 100, locale)
                      )}
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
              );
            })}
          </div>

          {/* Applied offers with remove option */}
          {cart.appliedOffers.length > 0 && (
            <div>
              {cart.appliedOffers.map((ao) => {
                const savings = ao.slotAssignments.reduce(
                  (s, a) => s + a.discountCents,
                  0
                );
                return (
                  <div
                    key={ao.offerSlug}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "0.5rem 0",
                    }}
                  >
                    <span className="offer-discount">
                      {tOffers("applied")}: {ao.offerTitle[locale]} (
                      {tOffers("discount", {
                        amount: formatPrice(savings / 100, locale),
                      })}
                      )
                    </span>
                    <button
                      type="button"
                      className="btn btn--ghost btn--small"
                      style={{ color: "var(--color-danger)" }}
                      onClick={() => cartStore.removeOffer(ao.offerSlug)}
                    >
                      {tOffers("removeOffer")}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <div className="totals">
            <span>{t("total")}</span>
            <strong>
              {savingsCents > 0 && (
                <span
                  className="offer-item-pick__original"
                  style={{ marginRight: "0.5rem" }}
                >
                  {formatPrice(cartTotalCents(cart) / 100, locale)}
                </span>
              )}
              {formatPrice(totalCents / 100, locale)}
            </strong>
          </div>

          {savingsCents > 0 && (
            <div style={{ textAlign: "center" }}>
              <span className="offer-discount">
                {tOffers("youSave", {
                  amount: formatPrice(savingsCents / 100, locale),
                })}
              </span>
            </div>
          )}

          <Link href="/checkout" className="btn btn--primary btn--block">
            {t("proceed")}
          </Link>
        </div>
      </div>
    </main>
  );
}
