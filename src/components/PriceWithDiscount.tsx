import { formatPrice, type Locale } from "@/lib/menu-types";
import styles from "./PriceWithDiscount.module.css";

/**
 * Shows a price, optionally with a crossed-out original when discounted.
 * Pure presentational — no "use client" needed, works in both server and client components.
 */
export function PriceWithDiscount({
  originalCents,
  discountCents,
  locale,
}: {
  originalCents: number;
  discountCents: number;
  locale: Locale;
}) {
  if (discountCents <= 0) {
    return <>{formatPrice(originalCents / 100, locale)}</>;
  }
  return (
    <>
      <span className={styles['price-discount__original']}>
        {formatPrice(originalCents / 100, locale)}
      </span>{" "}
      {formatPrice((originalCents - discountCents) / 100, locale)}
    </>
  );
}
