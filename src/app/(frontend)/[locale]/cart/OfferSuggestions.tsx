import { useTranslations } from "next-intl";
import { cartStore } from "@/lib/cart";
import { formatPrice, type Locale } from "@/lib/menu-types";
import { type OfferSuggestion } from "@/lib/offer-matching";
import styles from "./CartView.module.css";

export function OfferSuggestions({
  suggestions,
  locale,
  onDismiss,
}: {
  suggestions: OfferSuggestion[];
  locale: Locale;
  onDismiss: (slug: string) => void;
}) {
  const tOffers = useTranslations("offers");

  if (suggestions.length === 0) return null;

  const handleApply = (suggestion: OfferSuggestion) => {
    cartStore.applyOffer({
      offerSlug: suggestion.offer.slug,
      offerTitle: suggestion.offer.title,
      slotAssignments: suggestion.suggestedAssignments,
    });
  };

  return (
    <>
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
              onClick={() => onDismiss(suggestion.offer.slug)}
            >
              {tOffers("dismiss")}
            </button>
          </div>
        </div>
      ))}
    </>
  );
}
