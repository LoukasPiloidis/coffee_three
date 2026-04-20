import type { Locale, Offer } from "@/lib/menu-types";
import styles from "./OfferForm.module.css";

export function SlotStepper({
  offer,
  activeSlot,
  setActiveSlot,
  confirmedSlots,
  locale,
}: {
  offer: Offer;
  activeSlot: number;
  setActiveSlot: (i: number) => void;
  confirmedSlots: boolean[];
  locale: Locale;
}) {
  return (
    <div className={styles['offer-stepper']}>
      {offer.slots.map((slot, i) => (
        <button
          key={i}
          type="button"
          className={`${styles['offer-stepper__step']}${i === activeSlot ? ` ${styles['offer-stepper__step--active']}` : ""}${confirmedSlots[i] ? ` ${styles['offer-stepper__step--done']}` : ""}`}
          onClick={() => setActiveSlot(i)}
        >
          {confirmedSlots[i] ? "✓ " : ""}
          {slot.label[locale]}
        </button>
      ))}
    </div>
  );
}
