"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import ItemOptionSelector, {
  type ItemSelectionResult,
} from "@/components/ItemOptionSelector";
import PriceWithDiscount from "@/components/PriceWithDiscount";
import { useRouter } from "@/i18n/navigation";
import { type CartLineOption, cartStore } from "@/lib/cart";
import {
  applySlotOverrides,
  computeSlotDiscountCents,
  type Locale,
  type MenuItem,
  type Offer,
} from "@/lib/menu-types";

type SlotState = {
  selectedSlug: string | null;
  options: CartLineOption[];
  comment: string;
  confirmed: boolean;
};

export default function OfferForm({
  offer,
  items,
  locale,
}: {
  offer: Offer;
  items: Record<string, MenuItem>;
  locale: Locale;
}) {
  const t = useTranslations("offers");
  const router = useRouter();

  const [slots, setSlots] = useState<SlotState[]>(
    offer.slots.map(() => ({
      selectedSlug: null,
      options: [],
      comment: "",
      confirmed: false,
    }))
  );
  const [activeSlot, setActiveSlot] = useState(0);

  const allConfirmed = slots.every((s) => s.confirmed);

  const handleSelectItem = (slotIdx: number, slug: string) => {
    setSlots((prev) =>
      prev.map((s, i) =>
        i === slotIdx
          ? { selectedSlug: slug, options: [], comment: "", confirmed: false }
          : s
      )
    );
  };

  const handleConfirmSlot = (slotIdx: number, result: ItemSelectionResult) => {
    setSlots((prev) =>
      prev.map((s, i) =>
        i === slotIdx
          ? {
              ...s,
              options: result.options,
              comment: result.comment,
              confirmed: true,
            }
          : s
      )
    );
    // Advance to next unconfirmed slot
    const nextIdx = slots.findIndex((s, i) => i > slotIdx && !s.confirmed);
    if (nextIdx >= 0) setActiveSlot(nextIdx);
  };

  const handleEdit = (slotIdx: number) => {
    setSlots((prev) =>
      prev.map((s, i) => (i === slotIdx ? { ...s, confirmed: false } : s))
    );
    setActiveSlot(slotIdx);
  };

  const computeSummary = () => {
    let originalCents = 0;
    let discountCents = 0;
    for (let i = 0; i < offer.slots.length; i++) {
      const slot = offer.slots[i];
      const state = slots[i];
      if (!state.selectedSlug) continue;
      const item = items[state.selectedSlug];
      if (!item) continue;
      const baseCents = Math.round(item.price * 100);
      const optionsCents = state.options.reduce(
        (s, o) => s + (o.priceCents ?? 0),
        0
      );
      const itemTotal = baseCents + optionsCents;
      originalCents += itemTotal;
      discountCents += computeSlotDiscountCents(slot, itemTotal);
    }
    return {
      originalCents,
      discountCents,
      finalCents: originalCents - discountCents,
    };
  };

  const handleAddToCart = () => {
    const lines = slots.map((state) => {
      const item = items[state.selectedSlug!];
      return {
        slug: item.slug,
        title: item.title,
        unitPrice: item.price,
        quantity: 1,
        options: state.options,
        comment: state.comment,
      };
    });

    const slotDiscounts = offer.slots.map((slot, i) => {
      const state = slots[i];
      const item = items[state.selectedSlug!];
      const baseCents = Math.round(item.price * 100);
      const optionsCents = state.options.reduce(
        (s, o) => s + (o.priceCents ?? 0),
        0
      );
      return {
        slotIndex: i,
        discountCents: computeSlotDiscountCents(slot, baseCents + optionsCents),
      };
    });

    cartStore.addOfferLines(lines, {
      offerSlug: offer.slug,
      offerTitle: offer.title,
      slotDiscounts,
    });
    router.push("/cart");
  };

  const summary = allConfirmed ? computeSummary() : null;

  return (
    <div className="stack-md">
      {/* Slot stepper */}
      <div className="offer-stepper">
        {offer.slots.map((slot, i) => (
          <button
            key={i}
            type="button"
            className={`offer-stepper__step${i === activeSlot ? " offer-stepper__step--active" : ""}${slots[i].confirmed ? " offer-stepper__step--done" : ""}`}
            onClick={() => setActiveSlot(i)}
          >
            {slots[i].confirmed ? "✓ " : ""}
            {slot.label[locale]}
          </button>
        ))}
      </div>

      {/* Active slot panel */}
      {!allConfirmed && (
        <div className="offer-slot">
          <h3 className="offer-slot__label">
            {t("step", {
              current: activeSlot + 1,
              total: offer.slots.length,
            })}
            {" — "}
            {offer.slots[activeSlot].label[locale]}
          </h3>

          {!slots[activeSlot].selectedSlug ? (
            // Item selection
            <div>
              <p
                style={{ color: "var(--text-muted)", marginBottom: "0.75rem" }}
              >
                {t("pickItem")}
              </p>
              {offer.slots[activeSlot].eligibleItems
                .map((slug) => items[slug])
                .filter(Boolean)
                .map((item) => {
                  const slot = offer.slots[activeSlot];
                  const baseCents = Math.round(item.price * 100);
                  const discount = computeSlotDiscountCents(slot, baseCents);
                  return (
                    <button
                      key={item.slug}
                      type="button"
                      className="offer-item-pick"
                      onClick={() => handleSelectItem(activeSlot, item.slug)}
                    >
                      <span className="offer-item-pick__title">
                        {item.title[locale]}
                      </span>
                      <span className="offer-item-pick__price">
                        <PriceWithDiscount
                          originalCents={baseCents}
                          discountCents={discount}
                          locale={locale}
                        />
                      </span>
                    </button>
                  );
                })}
            </div>
          ) : (
            // Options for selected item
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "0.75rem",
                }}
              >
                <strong>
                  {items[slots[activeSlot].selectedSlug!]?.title[locale]}
                </strong>
                <button
                  type="button"
                  className="btn btn--ghost btn--small"
                  onClick={() =>
                    setSlots((prev) =>
                      prev.map((s, i) =>
                        i === activeSlot
                          ? {
                              selectedSlug: null,
                              options: [],
                              comment: "",
                              confirmed: false,
                            }
                          : s
                      )
                    )
                  }
                  style={{ marginLeft: "0.5rem" }}
                >
                  ← {t("pickItem")}
                </button>
              </div>
              <ItemOptionSelector
                key={`${activeSlot}-${slots[activeSlot].selectedSlug}`}
                item={{
                  ...items[slots[activeSlot].selectedSlug!],
                  optionGroups: applySlotOverrides(
                    items[slots[activeSlot].selectedSlug!].optionGroups,
                    offer.slots[activeSlot].optionGroupOverrides
                  ),
                }}
                locale={locale}
                submitLabel={t("confirmSlot")}
                onComplete={(result) => handleConfirmSlot(activeSlot, result)}
              />
            </div>
          )}
        </div>
      )}

      {/* Confirmed slots summary */}
      {slots.some((s) => s.confirmed) && (
        <div className="offer-summary">
          {slots.map((state, i) => {
            if (!state.confirmed || !state.selectedSlug) return null;
            const item = items[state.selectedSlug];
            if (!item) return null;
            const slot = offer.slots[i];
            const baseCents = Math.round(item.price * 100);
            const optionsCents = state.options.reduce(
              (s, o) => s + (o.priceCents ?? 0),
              0
            );
            const itemTotal = baseCents + optionsCents;
            const discount = computeSlotDiscountCents(slot, itemTotal);
            return (
              <div key={i} className="offer-summary__slot">
                <div className="offer-summary__slot-header">
                  <span className="offer-summary__slot-label">
                    {slot.label[locale]}
                  </span>
                  <button
                    type="button"
                    className="btn btn--ghost btn--small"
                    onClick={() => handleEdit(i)}
                  >
                    {t("editSlot")}
                  </button>
                </div>
                <div className="offer-summary__slot-item">
                  {item.title[locale]}
                  {state.options.length > 0 && (
                    <span
                      className="cart-line__meta"
                      style={{ marginLeft: "0.5rem" }}
                    >
                      (
                      {state.options
                        .map((o) => o.optionName[locale])
                        .join(", ")}
                      )
                    </span>
                  )}
                </div>
                <div className="offer-summary__slot-price">
                  <PriceWithDiscount
                    originalCents={itemTotal}
                    discountCents={discount}
                    locale={locale}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Final summary + add to cart */}
      {allConfirmed && summary && (
        <div className="offer-total">
          <div className="offer-total__final">
            <strong>
              <PriceWithDiscount
                originalCents={summary.originalCents}
                discountCents={summary.discountCents}
                locale={locale}
              />
            </strong>
          </div>
          <button
            className="btn btn--primary btn--block"
            onClick={handleAddToCart}
          >
            {t("addToCart")}
          </button>
        </div>
      )}
    </div>
  );
}
