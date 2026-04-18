import { formatPrice, type Locale } from "@/lib/menu-types";

/**
 * Shows a price, optionally with a crossed-out original when discounted.
 * Pure presentational — no "use client" needed, works in both server and client components.
 */
export default function PriceWithDiscount({
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
      <span className="price-discount__original">
        {formatPrice(originalCents / 100, locale)}
      </span>{" "}
      {formatPrice((originalCents - discountCents) / 100, locale)}
    </>
  );
}
