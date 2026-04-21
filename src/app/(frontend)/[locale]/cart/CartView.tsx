"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { PageShell } from "@/components/PageShell";
import { PriceWithDiscount } from "@/components/PriceWithDiscount";
import { QuantityStepper } from "@/components/QuantityStepper";
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
import { formatOptionLabel, type Locale } from "@/lib/menu-types";
import { detectApplicableOffers } from "@/lib/offer-matching";
import lineStyles from "@/components/OrderLine.module.css";
import { OfferSuggestions } from "./OfferSuggestions";

export function CartView({
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

  const suggestions = detectApplicableOffers(cart, offers).filter(
    (s) => !dismissed.has(s.offer.slug)
  );

  if (cart.lines.length === 0) {
    return (
      <PageShell title={t("title")}>
        <p className="empty">{t("empty")}</p>
        <div style={{ textAlign: "center" }}>
          <Link href="/" className="btn btn--ghost">
            ← {t("title")}
          </Link>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title={t("title")}>
      <OfferSuggestions
          suggestions={suggestions}
          locale={locale}
          onDismiss={(slug) =>
            setDismissed((prev) => new Set(prev).add(slug))
          }
        />

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
                          .map((option) =>
                            formatOptionLabel(
                              option.optionName[locale],
                              option.priceCents,
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
                    <QuantityStepper
                      value={line.quantity}
                      min={0}
                      onChange={(next) => cartStore.updateQty(line.lineId, next)}
                    />
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
    </PageShell>
  );
}
