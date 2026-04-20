"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import type { ItemSelectionResult } from "@/components/ItemOptionSelector";
import PriceWithDiscount from "@/components/PriceWithDiscount";
import { useRouter } from "@/i18n/navigation";
import { type CartLineOption, cartStore } from "@/lib/cart";
import {
  computeSlotDiscountCents,
  type Locale,
  type MenuItem,
  type Offer,
} from "@/lib/menu-types";
import { ConfirmedSlots } from "./ConfirmedSlots";
import { ItemPicker } from "./ItemPicker";
import styles from "./OfferForm.module.css";
import { SlotStepper } from "./SlotStepper";

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

  const handleSelectItem = (slug: string) => {
    setSlots((prev) =>
      prev.map((s, i) =>
        i === activeSlot
          ? { selectedSlug: slug, options: [], comment: "", confirmed: false }
          : s
      )
    );
  };

  const handleClearItem = () => {
    setSlots((prev) =>
      prev.map((s, i) =>
        i === activeSlot
          ? { selectedSlug: null, options: [], comment: "", confirmed: false }
          : s
      )
    );
  };

  const handleConfirmSlot = (result: ItemSelectionResult) => {
    setSlots((prev) =>
      prev.map((s, i) =>
        i === activeSlot
          ? {
              ...s,
              options: result.options,
              comment: result.comment,
              confirmed: true,
            }
          : s
      )
    );
    const nextIdx = slots.findIndex((s, i) => i > activeSlot && !s.confirmed);
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
        (sum, opt) => sum + (opt.priceCents ?? 0),
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
        (sum, opt) => sum + (opt.priceCents ?? 0),
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
      <SlotStepper
        offer={offer}
        activeSlot={activeSlot}
        setActiveSlot={setActiveSlot}
        confirmedSlots={slots.map((s) => s.confirmed)}
        locale={locale}
      />

      {!allConfirmed && (
        <ItemPicker
          offer={offer}
          items={items}
          locale={locale}
          activeSlot={activeSlot}
          slotState={slots[activeSlot]}
          onSelectItem={handleSelectItem}
          onClearItem={handleClearItem}
          onConfirmSlot={handleConfirmSlot}
        />
      )}

      <ConfirmedSlots
        offer={offer}
        items={items}
        locale={locale}
        slots={slots}
        onEdit={handleEdit}
      />

      {allConfirmed && summary && (
        <div className={styles['offer-total']}>
          <div className={styles['offer-total__final']}>
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
