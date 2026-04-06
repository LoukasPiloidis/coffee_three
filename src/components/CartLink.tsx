"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useCart, cartItemCount } from "@/lib/cart";

export default function CartLink() {
  const t = useTranslations("common");
  const cart = useCart();
  const count = cartItemCount(cart);

  return (
    <Link
      href="/cart"
      className="site-header__icon-btn"
      aria-label={t("cart")}
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="9" cy="20" r="1.4" />
        <circle cx="18" cy="20" r="1.4" />
        <path d="M2.5 3.5h2.6l2.4 11.2a1.6 1.6 0 0 0 1.6 1.3h8.7a1.6 1.6 0 0 0 1.6-1.2l1.6-6.3H6.2" />
      </svg>
      {count > 0 && (
        <span className="site-header__badge" aria-label={`${count}`}>
          {count}
        </span>
      )}
    </Link>
  );
}
