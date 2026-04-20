import { useTranslations } from "next-intl";
import { PriceWithDiscount } from "@/components/PriceWithDiscount";
import {
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

export function ConfirmedSlots({
  offer,
  items,
  locale,
  slots,
  onEdit,
}: {
  offer: Offer;
  items: Record<string, MenuItem>;
  locale: Locale;
  slots: SlotState[];
  onEdit: (index: number) => void;
}) {
  const t = useTranslations("offers");

  if (!slots.some((s) => s.confirmed)) return null;

  return (
    <div className={styles['offer-summary']}>
      {slots.map((state, i) => {
        if (!state.confirmed || !state.selectedSlug) return null;
        const item = items[state.selectedSlug];
        if (!item) return null;
        const slot = offer.slots[i];
        const baseCents = Math.round(item.price * 100);
        const optionsCents = state.options.reduce(
          (sum, opt) => sum + (opt.priceCents ?? 0),
          0
        );
        const itemTotal = baseCents + optionsCents;
        const discount = computeSlotDiscountCents(slot, itemTotal);
        return (
          <div key={i} className={styles['offer-summary__slot']}>
            <div className={styles['offer-summary__slot-header']}>
              <span className={styles['offer-summary__slot-label']}>
                {slot.label[locale]}
              </span>
              <button
                type="button"
                className="btn btn--ghost btn--small"
                onClick={() => onEdit(i)}
              >
                {t("editSlot")}
              </button>
            </div>
            <div className={styles['offer-summary__slot-item']}>
              {item.title[locale]}
              {state.options.length > 0 && (
                <span className={styles['slot-options-meta']}>
                  (
                  {state.options
                    .map((opt) => opt.optionName[locale])
                    .join(", ")}
                  )
                </span>
              )}
            </div>
            <div className={styles['offer-summary__slot-price']}>
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
  );
}
