import { formatOptionLabel } from "@/lib/menu-types";
import type { OrderDTO } from "./OrderCard";
import { formatEuro } from "./OrderCard";
import lineStyles from "@/components/OrderLine.module.css";
import styles from "./OrderCard.module.css";

export function OrderItems({ order }: { order: OrderDTO }) {
  return (
    <>
      <div>
        {order.items.map((item, index) => (
          <div key={index} className={lineStyles['cart-line']}>
            <div className={lineStyles['cart-line__main']}>
              <div className={lineStyles['cart-line__title']}>
                {item.quantity}× {item.title.el}
                {item.discountCents > 0 && (
                  <span
                    className={`${lineStyles['offer-discount']} ${styles['order-card__discount-inline']}`}
                  >
                    -{formatEuro(item.discountCents)}
                  </span>
                )}
              </div>
              {item.options.length > 0 && (
                <div className={lineStyles['cart-line__meta']}>
                  {item.options
                    .map((op) =>
                      formatOptionLabel(op.optionName.el, op.priceCents, "el")
                    )
                    .join(" · ")}
                </div>
              )}
              {item.comment && (
                <div className={lineStyles['cart-line__meta']}>&quot;{item.comment}&quot;</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {order.offersJson && order.offersJson.length > 0 && (
        <div className={styles['order-card__offers']}>
          {order.offersJson.map((offer, index) => {
            const totalDiscount = offer.slots.reduce(
              (sum, sl) => sum + sl.discountCents,
              0
            );
            return (
              <div
                key={index}
                className={styles['order-card__offer-row']}
              >
                <span className={lineStyles['offer-badge']}>προσφορά</span>
                <span className={lineStyles['offer-discount']}>
                  -{formatEuro(totalDiscount)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
