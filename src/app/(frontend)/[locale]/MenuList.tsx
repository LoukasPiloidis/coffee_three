"use client";

import { useState } from "react";
import ScrollPills from "@/components/ScrollPills";
import { Link } from "@/i18n/navigation";
import type { Locale, MenuCategory, Offer } from "@/lib/menu-types";
import { formatPrice } from "@/lib/menu-types";
import styles from "./MenuList.module.css";

export default function MenuList({
  categories,
  offers,
  locale,
  translations,
}: {
  categories: MenuCategory[];
  offers: Offer[];
  locale: Locale;
  translations: { unavailable: string; search: string; offersTitle: string };
}) {
  const [query, setQuery] = useState("");
  const q = query.toLowerCase().trim();

  const filtered = q
    ? categories
        .map((cat) => ({
          ...cat,
          items: cat.items.filter(
            (item) =>
              item.title.en.toLowerCase().includes(q) ||
              item.title.el.toLowerCase().includes(q)
          ),
        }))
        .filter((cat) => cat.items.length > 0)
    : categories;

  return (
    <>
      <div className={styles['menu-nav']}>
        <input
          type="search"
          className={styles['search-bar']}
          placeholder={translations.search}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {!q && (
          <ScrollPills
            items={filtered.map((cat) => ({
              slug: cat.slug,
              label: cat.title[locale],
            }))}
          />
        )}
      </div>

      {offers.length > 0 && !q && (
        <section className={styles['offers-section']}>
          <h2 className={styles['offers-section__title']}>{translations.offersTitle}</h2>
          <div className={styles['offers-section__list']}>
            {offers.map((offer) => (
              <Link
                key={offer.slug}
                href={`/offer/${offer.slug}`}
                className={styles['offer-card']}
              >
                <div className={styles['offer-card__title']}>{offer.title[locale]}</div>
                {offer.description[locale] && (
                  <div className={styles['offer-card__desc']}>
                    {offer.description[locale]}
                  </div>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {filtered.length === 0 && (
        <p className="empty">{translations.unavailable}</p>
      )}

      {filtered.map((cat) => (
        <section key={cat.slug} className={styles['category']} data-slug={cat.slug}>
          <h2 className={styles['category__title']}>{cat.title[locale]}</h2>
          <div>
            {cat.items.map((item) => {
              const inner = (
                <>
                  <div className={styles['item-row__main']}>
                    <div className={styles['item-row__title']}>{item.title[locale]}</div>
                    {item.description[locale] && (
                      <div className={styles['item-row__desc']}>
                        {item.description[locale]}
                      </div>
                    )}
                    {!item.available && (
                      <div className={styles['item-row__unavailable']}>
                        {translations.unavailable}
                      </div>
                    )}
                  </div>
                  <div className={styles['item-row__right']}>
                    <span className={styles['item-row__price']}>
                      {formatPrice(item.price, locale)}
                    </span>
                    {item.available && (
                      <span className={styles['item-row__add']} aria-hidden="true">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <line x1="12" y1="5" x2="12" y2="19" />
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                      </span>
                    )}
                  </div>
                </>
              );
              return item.available ? (
                <Link
                  key={item.slug}
                  href={`/item/${item.slug}`}
                  className={styles['item-row']}
                >
                  {inner}
                </Link>
              ) : (
                <div
                  key={item.slug}
                  className={`${styles['item-row']} ${styles['item-row--disabled']}`}
                  aria-disabled="true"
                >
                  {inner}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </>
  );
}
