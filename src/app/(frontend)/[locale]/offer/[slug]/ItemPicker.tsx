import { useTranslations } from "next-intl";
import ItemOptionSelector, {
  type ItemSelectionResult,
} from "@/components/ItemOptionSelector";
import PriceWithDiscount from "@/components/PriceWithDiscount";
import {
  applySlotOverrides,
  computeSlotDiscountCents,
  type Locale,
  type MenuItem,
  type Offer,
} from "@/lib/menu-types";
import type { CartLineOption } from "@/lib/cart";
import styles from "./OfferForm.module.css";

type SlotState = {
  selectedSlug: string | null;
  options: CartLineOption[];
  comment: string;
  confirmed: boolean;
};

export function ItemPicker({
  offer,
  items,
  locale,
  activeSlot,
  slotState,
  onSelectItem,
  onClearItem,
  onConfirmSlot,
}: {
  offer: Offer;
  items: Record<string, MenuItem>;
  locale: Locale;
  activeSlot: number;
  slotState: SlotState;
  onSelectItem: (slug: string) => void;
  onClearItem: () => void;
  onConfirmSlot: (result: ItemSelectionResult) => void;
}) {
  const t = useTranslations("offers");
  const slot = offer.slots[activeSlot];

  return (
    <div className={styles['offer-slot']}>
      <h3 className={styles['offer-slot__label']}>
        {t("step", {
          current: activeSlot + 1,
          total: offer.slots.length,
        })}
        {" — "}
        {slot.label[locale]}
      </h3>

      {!slotState.selectedSlug ? (
        <div>
          <p className={styles['pick-hint']}>{t("pickItem")}</p>
          {slot.eligibleItems
            .map((slug) => items[slug])
            .filter(Boolean)
            .map((item) => {
              const baseCents = Math.round(item.price * 100);
              const discount = computeSlotDiscountCents(slot, baseCents);
              return (
                <button
                  key={item.slug}
                  type="button"
                  className={styles['offer-item-pick']}
                  onClick={() => onSelectItem(item.slug)}
                >
                  <span className={styles['offer-item-pick__title']}>
                    {item.title[locale]}
                  </span>
                  <span className={styles['offer-item-pick__price']}>
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
        <div>
          <div className={styles['selected-item-header']}>
            <strong>
              {items[slotState.selectedSlug]?.title[locale]}
            </strong>
            <button
              type="button"
              className="btn btn--ghost btn--small"
              onClick={onClearItem}
            >
              ← {t("pickItem")}
            </button>
          </div>
          <ItemOptionSelector
            key={`${activeSlot}-${slotState.selectedSlug}`}
            item={{
              ...items[slotState.selectedSlug],
              optionGroups: applySlotOverrides(
                items[slotState.selectedSlug].optionGroups,
                slot.optionGroupOverrides
              ),
            }}
            locale={locale}
            submitLabel={t("confirmSlot")}
            onComplete={onConfirmSlot}
          />
        </div>
      )}
    </div>
  );
}
