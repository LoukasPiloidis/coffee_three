import PriceWithDiscount from "@/components/PriceWithDiscount";
import { formatOptionLabel, formatPrice, type Locale } from "@/lib/menu-types";
import lineStyles from "@/components/OrderLine.module.css";
import styles from "./OrderStatusView.module.css";

type OrderItem = {
  title: { en: string; el: string };
  quantity: number;
  unitPriceCents: number;
  discountCents: number;
  options: {
    groupName: { en: string; el: string };
    optionName: { en: string; el: string };
    priceCents?: number;
  }[];
  comment: string | null;
};

export function OrderItemsCard({
  items,
  totalCents,
  tipCents,
  locale,
  tipLabel,
}: {
  items: OrderItem[];
  totalCents: number;
  tipCents: number;
  locale: Locale;
  tipLabel: string;
}) {
  return (
    <div className="card">
      {items.map((item, index) => (
        <div key={index} className={lineStyles['cart-line']}>
          <div className={lineStyles['cart-line__main']}>
            <div className={lineStyles['cart-line__title']}>
              {item.quantity}× {item.title[locale]}
            </div>
            {item.options.length > 0 && (
              <div className={lineStyles['cart-line__meta']}>
                {item.options
                  .map((opt) =>
                    formatOptionLabel(
                      opt.optionName[locale],
                      opt.priceCents,
                      locale
                    )
                  )
                  .join(" · ")}
              </div>
            )}
            {item.comment && (
              <div className={lineStyles['cart-line__meta']}>&quot;{item.comment}&quot;</div>
            )}
          </div>
          <div className={lineStyles['cart-line__right']}>
            <div className={lineStyles['item-row__price']}>
              <PriceWithDiscount
                originalCents={item.unitPriceCents * item.quantity}
                discountCents={item.discountCents}
                locale={locale}
              />
            </div>
          </div>
        </div>
      ))}
      <div className="totals">
        <span>Total</span>
        <strong>{formatPrice(totalCents / 100, locale)}</strong>
      </div>
      {tipCents > 0 && (
        <div className={styles['tip-note']}>
          {tipLabel}
        </div>
      )}
    </div>
  );
}
